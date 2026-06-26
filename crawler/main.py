#!/usr/bin/env python3
"""
壁纸采集器 - 主流程

用法:
  python main.py                          # 采集所有分类（默认每类50张）
  python main.py -c 风景 动漫              # 只采集指定分类
  python main.py -n 100                   # 每类采集100张
  python main.py -s wallhaven bing        # 只使用指定数据源
  python main.py -c 风景 -n 30 --local    # 本地模式：下载+缩略图，不上传到云

流程:
  1. 从各数据源搜索壁纸元数据
  2. 下载原图到本地
  3. 生成 300px 宽 webp 缩略图
  4. 上传原图和缩略图到 uniCloud 云存储
  5. 调用 adminBatchImport 批量写入数据库

前置条件:
  - 安装依赖: pip install -r requirements.txt
  - 配置环境变量（API Key、UNICLOUD_FUNCTION_URL 等），见 config.py
"""
import argparse
import json
import logging
import os
import sys
from datetime import datetime

from config import PER_CATEGORY_MIN
from classify_map import CLASSIFY_MAP, get_classify_names
from sources.wallhaven import WallhavenSource
from sources.bing import BingSource
from sources.unsplash import UnsplashSource
from sources.pexels import PexelsSource
from downloader import download_batch
from thumbnail import generate_batch
from uploader import upload_batch
from importer import batch_import


# 数据源实例（按优先级排序）
SOURCE_INSTANCES = {
    "bing":      BingSource(),
    "wallhaven": WallhavenSource(),
    "unsplash":  UnsplashSource(),
    "pexels":    PexelsSource(),
}


def collect_from_source(source_name, keyword, target_count):
    """
    从指定数据源采集壁纸

    Args:
        source_name: 数据源名称 (bing/wallhaven/unsplash/pexels)
        keyword: 搜索关键词（中文分类名）
        target_count: 目标数量

    Returns:
        list: 壁纸元数据列表
    """
    source = SOURCE_INSTANCES.get(source_name)
    if not source:
        print(f"  [WARN] 未知数据源: {source_name}")
        return []

    print(f"\n{'=' * 50}")
    print(f"  数据源: {source_name}  |  关键词: {keyword}  |  目标: {target_count} 张")
    print(f"{'=' * 50}")

    try:
        if source_name == "bing":
            items = source.fetch_daily(days=8)
            print(f"  获取到 {len(items)} 张 Bing 每日壁纸")
        elif source_name == "wallhaven":
            items = source.search_all_categories(keyword, target_count=target_count)
            print(f"  获取到 {len(items)} 张 Wallhaven 壁纸")
        else:
            items = source.search_all_pages(keyword, target_count=target_count)
            print(f"  获取到 {len(items)} 张壁纸")

        return items
    except Exception as e:
        print(f"  [ERROR] {source_name} 采集异常: {e}")
        return []


def process_category(category_name, config, args):
    """
    处理单个分类：采集 → 下载 → 缩略图 → 上传 → 导入

    Args:
        category_name: 分类中文名
        config: 分类配置 dict
        args: 命令行参数

    Returns:
        dict: { collected, downloaded, uploaded, imported, skipped }
    """
    classify_id = config["classify_id"]
    target_count = args.num
    sources_to_use = args.sources if args.sources else ["bing", "wallhaven", "unsplash", "pexels"]
    result = {"collected": 0, "downloaded": 0, "uploaded": 0, "imported": 0, "skipped": 0}

    if args.local and not classify_id:
        classify_id = "LOCAL_" + category_name

    if not args.headless:
        print(f"\n\n{'#' * 60}")
        print(f"  分类: {category_name}  |  classify_id: {classify_id}")
        print(f"  数据源: {', '.join(sources_to_use)}  |  目标: {target_count} 张")
        print(f"{'#' * 60}")

    if not classify_id and not args.headless:
        print(f"\n[WARN] 分类「{category_name}」未配置 classify_id，使用本地模式")

    # --- 阶段1: 采集 ---
    all_items = []
    per_source = max(target_count // max(len(sources_to_use), 1), 20)

    for src in sources_to_use:
        keyword = config.get("search_terms", {}).get(src, category_name)
        items = collect_from_source(src, keyword, per_source)
        all_items.extend(items)
        if len(all_items) >= target_count:
            break

    seen = set()
    unique_items = []
    for item in all_items:
        sid = f"{item['source']}_{item['source_id']}"
        if sid not in seen:
            seen.add(sid)
            unique_items.append(item)

    unique_items = unique_items[:target_count]
    result["collected"] = len(unique_items)

    if not args.headless:
        print(f"\n  去重后共 {len(unique_items)} 张壁纸")

    if not unique_items:
        return result

    # --- 阶段2: 下载 ---
    if not args.headless:
        print(f"\n--- 阶段2: 下载原图 ---")
    downloaded = download_batch(unique_items, category_name)
    result["downloaded"] = len(downloaded)

    if not args.headless:
        print(f"  下载成功: {len(downloaded)}/{len(unique_items)}")
    if not downloaded:
        return result

    # --- 阶段3: 缩略图 ---
    if not args.headless:
        print(f"\n--- 阶段3: 生成缩略图 ---")
    thumbnailed = generate_batch(downloaded, category_name)
    result["downloaded"] = len(thumbnailed)

    if not args.headless:
        print(f"  缩略图成功: {len(thumbnailed)}/{len(downloaded)}")
    if not thumbnailed:
        return result

    # --- 本地模式 ---
    if args.local:
        result["uploaded"] = 0
        result["imported"] = 0
        return result

    # --- 阶段4: 上传 ---
    if not args.headless:
        print(f"\n--- 阶段4: 上传云存储 ---")
    uploaded = upload_batch(thumbnailed, classify_id)
    result["uploaded"] = len(uploaded)

    if not args.headless:
        print(f"  上传成功: {len(uploaded)}/{len(thumbnailed)}")
    if not uploaded:
        return result

    # --- 阶段5: 导入 ---
    if not args.headless:
        print(f"\n--- 阶段5: 批量导入数据库 ---")
    inserted = batch_import(uploaded, classify_id, category_name)
    result["imported"] = inserted

    if not args.headless:
        print(f"  导入完成: {inserted} 条")

    return result


def run_health_check():
    """检查所有数据源的可用状态"""
    import time
    from config import UNICLOUD_FUNCTION_URL, REQUEST_TIMEOUT

    print("数据源健康检查\n")
    results = {}

    for name, source in SOURCE_INSTANCES.items():
        start = time.time()
        try:
            if name == "bing":
                items = source.fetch_daily(days=1)
                status = "OK" if items else "EMPTY"
                detail = f"获取 {len(items)} 张"
            elif name == "wallhaven":
                items = source.search_all_categories("test", target_count=1)
                status = "OK" if items else "EMPTY"
                detail = f"测试搜索返回 {len(items)} 张"
            elif name == "unsplash":
                if not source.access_key:
                    status = "SKIP"
                    detail = "未配置 API Key"
                else:
                    items = source.search("test", per_page=1)
                    status = "OK" if items else "EMPTY"
                    detail = f"测试搜索返回 {len(items)} 张"
            elif name == "pexels":
                if not source.api_key:
                    status = "SKIP"
                    detail = "未配置 API Key"
                else:
                    items = source.search("test", per_page=1)
                    status = "OK" if items else "EMPTY"
                    detail = f"测试搜索返回 {len(items)} 张"
        except Exception as e:
            status = "ERROR"
            detail = str(e)[:100]

        elapsed = (time.time() - start) * 1000
        icon = {"OK": "✅", "EMPTY": "⚠️", "SKIP": "⏭️", "ERROR": "❌"}.get(status, "❓")
        print(f"  {icon} {name:10s}  {status:6s}  {elapsed:6.0f}ms  {detail}")
        results[name] = {"status": status, "latency_ms": int(elapsed), "detail": detail}

    # 云对象连通性检查
    print(f"\n  云对象连通性检查: {UNICLOUD_FUNCTION_URL}")
    try:
        import requests
        resp = requests.get(UNICLOUD_FUNCTION_URL, timeout=REQUEST_TIMEOUT)
        print(f"  ✅ 云对象可访问 (HTTP {resp.status_code})")
    except Exception as e:
        print(f"  ❌ 云对象不可达: {e}")

    return results


def get_category_wall_counts():
    """从云端获取各分类已有壁纸数，用于调整采集策略"""
    import requests
    from config import UNICLOUD_FUNCTION_URL, REQUEST_TIMEOUT
    try:
        resp = requests.post(
            f"{UNICLOUD_FUNCTION_URL}/adminGetWallStats",
            json={}, timeout=REQUEST_TIMEOUT
        )
        result = resp.json()
        if result.get("errCode") == 0:
            return result["data"].get("byStatus", {})
    except Exception:
        pass
    return {}


def main():
    parser = argparse.ArgumentParser(
        description="壁纸采集器 - uniCloud Wallpaper 数据采集",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python main.py                          全部分类，每类50张
  python main.py -c 风景 -n 100            风景分类采集100张
  python main.py -c 风景 动漫 游戏          指定多个分类
  python main.py -s wallhaven bing         只用 Wallhaven + Bing
  python main.py -n 30 --local             本地模式(不上传云端)
  python main.py --list-categories         列出所有分类
  python main.py --list-sources            列出所有数据源
        """
    )
    parser.add_argument("-c", "--categories", nargs="*",
                        help="要采集的分类名（空格分隔），默认全部")
    parser.add_argument("-n", "--num", type=int, default=PER_CATEGORY_MIN,
                        help=f"每个分类采集数量（默认: {PER_CATEGORY_MIN}）")
    parser.add_argument("-s", "--sources", nargs="*",
                        choices=["bing", "wallhaven", "unsplash", "pexels"],
                        help="使用的数据源（空格分隔），默认全部")
    parser.add_argument("--local", action="store_true",
                        help="本地模式：只下载图片+生成缩略图，不上传到云存储")
    parser.add_argument("--skip-download", action="store_true",
                        help="跳过下载（用于测试后续流程）")
    parser.add_argument("--list-categories", action="store_true",
                        help="列出所有可用分类")
    parser.add_argument("--list-sources", action="store_true",
                        help="列出所有可用数据源")
    parser.add_argument("--headless", action="store_true",
                        help="无交互模式：静默运行，输出 JSON 结果，错误写入日志文件")
    parser.add_argument("--json", action="store_true",
                        help="以 JSON 格式输出结果（供自动化调用）")
    parser.add_argument("--health-check", action="store_true",
                        help="检查所有数据源可用状态")
    parser.add_argument("--target-per-category", type=int, default=0,
                        help="每个分类的目标壁纸总数，不足时自动增加采集量（默认: 不限制）")

    args = parser.parse_args()

    # 无交互模式：配置日志
    if args.headless:
        os.makedirs("logs", exist_ok=True)
        log_file = f"logs/crawl_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        logging.basicConfig(
            filename=log_file, level=logging.INFO,
            format='%(asctime)s [%(levelname)s] %(message)s'
        )
        logging.info(f"Headless crawl started: categories={args.categories}, num={args.num}, sources={args.sources}")

    if args.list_categories:
        print("可用分类:")
        for name, info in CLASSIFY_MAP.items():
            status = "已配置ID" if info["classify_id"] else "待配置ID"
            print(f"  {name:6s}  (sort={info['sort']}, 主源={info['priority_source']}, {status})")
        return

    if args.list_sources:
        print("可用数据源:")
        print("  bing      - Bing 每日壁纸（免费，无需 API Key）")
        print("  wallhaven - Wallhaven（免费，无需 API Key）")
        print("  unsplash  - Unsplash（需注册获取 Access Key）")
        print("  pexels    - Pexels（需注册获取 API Key）")
        return

    if args.health_check:
        run_health_check()
        return

    # 确定要采集的分类
    if args.categories:
        categories = {}
        for c in args.categories:
            if c in CLASSIFY_MAP:
                categories[c] = CLASSIFY_MAP[c]
            else:
                print(f"[WARN] 未知分类: {c}")
        if not categories:
            print("没有有效分类，使用 --list-categories 查看可用分类")
            sys.exit(1)
    else:
        categories = CLASSIFY_MAP

    print(f"╔══════════════════════════════════════════╗")
    print(f"║     uniCloud Wallpaper 壁纸采集器        ║")
    print(f"╠══════════════════════════════════════════╣")
    print(f"║  分类数: {len(categories):<3}                           ║")
    print(f"║  每类数量: {args.num:<3}                          ║")
    print(f"║  数据源: {', '.join(args.sources) if args.sources else '全部':<30s} ║")
    print(f"║  模式: {'本地(不上传)' if args.local else '云端':<30s} ║")
    print(f"╚══════════════════════════════════════════╝")

    # 根据目标壁纸数动态调整采集量
    if args.target_per_category > 0 and not args.local:
        from config import UNICLOUD_FUNCTION_URL
        if UNICLOUD_FUNCTION_URL:
            print(f"\n检查各分类壁纸数量（目标: {args.target_per_category} 张/类）...")
            for category_name, config in categories.items():
                try:
                    import requests
                    resp = requests.post(
                        f"{UNICLOUD_FUNCTION_URL}/adminGetWalls",
                        json={"classid": config["classify_id"], "status": 1, "pageSize": 1},
                        timeout=10
                    )
                    data = resp.json()
                    current = data.get("data", {}).get("total", 0) if data.get("errCode") == 0 else 0
                    shortage = args.target_per_category - current
                    if shortage > 0:
                        adjusted = max(shortage, args.num)
                        print(f"  {category_name}: 已有 {current} 张，需补充 {shortage} 张 → 本次采集 {adjusted} 张")
                        config["_target"] = adjusted
                    else:
                        print(f"  {category_name}: 已有 {current} 张，已达目标 → 跳过")
                        config["_skip"] = True
                except Exception as e:
                    print(f"  {category_name}: 查询失败 ({e})，使用默认数量 {args.num}")
        else:
            print("未配置云对象 URL，跳过数量检查")

    start_time = datetime.now()
    results = {"categories": {}, "total": {"collected": 0, "downloaded": 0, "uploaded": 0, "imported": 0, "skipped": 0}}

    for category_name, config in categories.items():
        if config.get("_skip"):
            results["categories"][category_name] = {"collected": 0, "downloaded": 0, "uploaded": 0, "imported": 0, "skipped": 0, "msg": "已达目标数量"}
            continue
        if config.get("_target"):
            args.num = config["_target"]
        result = process_category(category_name, config, args)
        if result:
            results["categories"][category_name] = result
            for k in ["collected", "downloaded", "uploaded", "imported", "skipped"]:
                results["total"][k] += result.get(k, 0)

    elapsed = datetime.now() - start_time
    results["elapsed"] = str(elapsed)

    if args.headless or args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(f"\n\n{'=' * 50}")
        print(f"  采集完成！总耗时: {elapsed}")
        print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
