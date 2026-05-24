"""
uniCloud 云存储上传器
通过云对象 adminUpload 方法将本地图片上传到 uniCloud 云存储
"""
import os
import base64
import json
import requests
from config import UNICLOUD_FUNCTION_URL, REQUEST_TIMEOUT


def upload_file(local_path, cloud_filename):
    """
    上传单个文件到 uniCloud 云存储

    Args:
        local_path: 本地文件路径
        cloud_filename: 云端路径，如 originals/abc123.jpg

    Returns:
        str: 云存储 URL（成功）或 None（失败）
    """
    if not UNICLOUD_FUNCTION_URL:
        print(f"  [skip] 未配置 UNICLOUD_FUNCTION_URL，跳过上传")
        return None

    if not os.path.exists(local_path):
        print(f"  [FAIL] 文件不存在: {local_path}")
        return None

    try:
        # 读取文件并 base64 编码
        with open(local_path, "rb") as f:
            file_data = base64.b64encode(f.read()).decode("utf-8")

        # 调用云对象 adminUpload 方法
        url = f"{UNICLOUD_FUNCTION_URL}/adminUpload"
        payload = {
            "fileName": cloud_filename,
            "base64": file_data,
        }

        resp = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT * 2)
        result = resp.json()

        if result.get("errCode") == 0:
            cloud_url = result["data"]["cloudURL"]
            print(f"  [OK] 上传成功: {cloud_filename}")
            return cloud_url
        else:
            print(f"  [FAIL] 上传失败: {result.get('errMsg', '未知错误')}")
            return None

    except requests.exceptions.ConnectionError:
        print(f"  [FAIL] 无法连接云对象，请确认 UNICLOUD_FUNCTION_URL 已配置且云对象已部署并开启 URL 化")
        return None
    except Exception as e:
        print(f"  [FAIL] 上传异常: {e}")
        return None


def upload_batch(items, classify_id):
    """
    批量上传壁纸原图和缩略图

    Args:
        items: 壁纸数据列表，每项需有 local_path, thumb_path, filename
        classify_id: 分类ID，用于组织云存储路径

    Returns:
        list: 上传成功的 items（已填充 picurl 和 smallPicurl 字段）
    """
    if not UNICLOUD_FUNCTION_URL:
        print("\n[提示] UNICLOUD_FUNCTION_URL 未配置，跳过云存储上传。")
        print("  如需上传，请在 config.py 中设置 UNICLOUD_FUNCTION_URL")
        print("  或设置环境变量: export UNICLOUD_FUNCTION_URL=https://fc-xxx.bspapp.com/wallpaper")
        return items

    success = []
    total = len(items)
    for idx, item in enumerate(items):
        print(f"\n[{idx + 1}/{total}] 上传: {item.get('title', '')[:40]}")

        filename = item["filename"]

        # 上传原图
        ext = os.path.splitext(item["local_path"])[1]
        origin_url = upload_file(
            item["local_path"],
            f"originals/{filename}{ext}"
        )

        # 上传缩略图
        thumb_url = upload_file(
            item["thumb_path"],
            f"thumbnails/{filename}_small.webp"
        )

        if origin_url and thumb_url:
            item["picurl"] = origin_url
            item["smallPicurl"] = thumb_url
            success.append(item)
        else:
            print(f"  [WARN] 跳过 {item.get('title', '')[:40]}，上传不完整")

    return success
