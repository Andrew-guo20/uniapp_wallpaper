"""
批量导入模块
通过云对象 adminBatchImport 将壁纸元数据批量写入数据库
"""
import json
import os
import requests
from config import UNICLOUD_FUNCTION_URL, REQUEST_TIMEOUT

# 本地导出目录（云对象未配置时使用）
EXPORT_DIR = "./exports"


def check_wall_exists(picurl):
    """检查壁纸 URL 是否已在数据库中"""
    try:
        url = f"{UNICLOUD_FUNCTION_URL}/adminCheckWallExists"
        resp = requests.post(url, json={"picurl": picurl}, timeout=REQUEST_TIMEOUT)
        result = resp.json()
        return result.get("errCode") == 0 and result.get("data", {}).get("exists", False)
    except Exception as e:
        print(f"  [WARN] 去重检查失败: {e}")
        return False


def deduplicate_walls(walls):
    """
    对壁纸列表进行云端去重，跳过已存在的壁纸

    Returns:
        (new_walls, skipped_count): 去重后的壁纸列表和跳过的数量
    """
    if not UNICLOUD_FUNCTION_URL:
        return walls, 0  # 无法连接云端时跳过去重

    new_walls = []
    skipped = 0
    for w in walls:
        picurl = w.get("picurl", "")
        if picurl and check_wall_exists(picurl):
            skipped += 1
        else:
            new_walls.append(w)

    if skipped > 0:
        print(f"  [去重] 跳过 {skipped} 张已存在的壁纸")
    return new_walls, skipped


def import_to_cloud(walls, classify_id):
    """
    通过云对象 adminBatchImport 批量写入数据库

    Args:
        walls: 壁纸数据列表，每项需包含 classid, picurl, smallPicurl, description, tabs, nickname
        classify_id: 分类ID

    Returns:
        int: 成功导入数量
    """
    if not walls:
        print("没有可导入的数据")
        return 0

    # 云端去重
    walls, skipped = deduplicate_walls(walls)
    if not walls:
        print("  [去重] 所有壁纸均已存在，无需导入")
        return 0

    import_data = []
    for w in walls:
        import_data.append({
            "classid": classify_id,
            "picurl": w.get("picurl", ""),
            "smallPicurl": w.get("smallPicurl", ""),
            "nickname": w.get("nickname", ""),
            "score": 0,
            "description": w.get("description", "")[:500],
            "tabs": w.get("tabs", [])[:6],
            "downloadCount": 0,
            "scoreCount": 0,
            "status": 1,   # 直接发布
        })

    batch_size = 50  # 每批最多 50 条
    total_inserted = 0

    for i in range(0, len(import_data), batch_size):
        batch = import_data[i:i + batch_size]
        try:
            url = f"{UNICLOUD_FUNCTION_URL}/adminBatchImport"
            resp = requests.post(url, json={"walls": batch}, timeout=REQUEST_TIMEOUT)
            result = resp.json()

            if result.get("errCode") == 0:
                inserted = result["data"]["inserted"]
                total_inserted += inserted
                print(f"  [OK] 批量导入 {i + 1}-{i + len(batch)}: {inserted} 条")
            else:
                print(f"  [FAIL] 导入失败: {result.get('errMsg', '未知错误')}")

        except Exception as e:
            print(f"  [FAIL] 导入异常: {e}")

    return total_inserted


def export_to_json(walls, classify_id, keyword):
    """
    导出壁纸数据为 JSON 文件（本地模式，供后续手动导入）

    Args:
        walls: 壁纸数据列表
        classify_id: 分类ID
        keyword: 分类关键词
    """
    os.makedirs(EXPORT_DIR, exist_ok=True)

    export_data = {
        "classify_id": classify_id,
        "keyword": keyword,
        "count": len(walls),
        "walls": []
    }

    for w in walls:
        export_data["walls"].append({
            "classid": classify_id,
            "picurl": w.get("picurl", w.get("local_path", "")),
            "smallPicurl": w.get("smallPicurl", w.get("thumb_path", "")),
            "nickname": w.get("nickname", ""),
            "description": w.get("description", ""),
            "tabs": w.get("tabs", []),
        })

    filepath = os.path.join(EXPORT_DIR, f"walls_{keyword}_{len(walls)}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)

    print(f"\n[导出] 壁纸数据已导出到: {filepath}")
    print(f"  共 {len(walls)} 条，请在 uniCloud 控制台上传后使用 adminBatchImport 导入")


def batch_import(walls, classify_id, keyword=""):
    """
    批量导入壁纸（优先云对象，回退到本地 JSON 导出）

    Args:
        walls: 壁纸数据列表
        classify_id: 分类ID
        keyword: 分类关键词

    Returns:
        int: 导入数量
    """
    if not walls:
        return 0

    if UNICLOUD_FUNCTION_URL:
        return import_to_cloud(walls, classify_id)
    else:
        export_to_json(walls, classify_id, keyword)
        return 0
