"""
图片下载器
负责从远程 URL 下载壁纸原图到本地分类目录
"""
import os
import uuid
import time
import requests
from config import get_originals_dir, REQUEST_TIMEOUT, DOWNLOAD_RETRY


def ensure_dir(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)


def download_image(url, category, filename=None):
    """
    下载单张图片到分类目录

    Args:
        url: 图片远程 URL
        category: 分类名称（如"风景"、"动漫"）
        filename: 本地文件名（不含扩展名）。若为 None，自动生成 UUID

    Returns:
        str: 本地文件路径（成功）或 None（失败）
    """
    save_dir = get_originals_dir(category)
    ensure_dir(save_dir)

    if filename is None:
        filename = uuid.uuid4().hex[:12]

    ext = ".jpg"
    url_lower = url.lower()
    for candidate in [".jpg", ".jpeg", ".png", ".webp"]:
        if candidate in url_lower:
            ext = candidate
            break
    if ext == ".jpeg":
        ext = ".jpg"

    filepath = os.path.join(save_dir, f"{filename}{ext}")

    if os.path.exists(filepath):
        print(f"  [skip] 已存在: {filepath}")
        return filepath

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36"
    }

    for attempt in range(1, DOWNLOAD_RETRY + 1):
        try:
            print(f"  [下载] {url[:80]}...")
            resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT, stream=True)
            resp.raise_for_status()

            with open(filepath, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)

            size_kb = os.path.getsize(filepath) / 1024
            print(f"  [OK] {category}/{os.path.basename(filepath)} ({size_kb:.0f} KB)")
            return filepath

        except requests.exceptions.Timeout:
            print(f"  [重试 {attempt}/{DOWNLOAD_RETRY}] 下载超时")
        except requests.exceptions.ConnectionError:
            print(f"  [重试 {attempt}/{DOWNLOAD_RETRY}] 连接失败")
        except Exception as e:
            print(f"  [重试 {attempt}/{DOWNLOAD_RETRY}] {type(e).__name__}: {e}")

        time.sleep(1 * attempt)

    print(f"  [FAIL] 下载失败: {url[:80]}")
    return None


def download_batch(items, category):
    """
    批量下载图片到分类目录

    Args:
        items: 壁纸元数据列表，每个元素需包含 "picurl" 字段
        category: 分类名称

    Returns:
        list: 下载成功的 items（已填充 local_path, filename）
    """
    success = []
    total = len(items)
    for idx, item in enumerate(items):
        print(f"\n[{idx + 1}/{total}] {item.get('title', '')[:40]}")
        local_path = download_image(item["picurl"], category)
        if local_path:
            item["local_path"] = local_path
            item["filename"] = os.path.splitext(os.path.basename(local_path))[0]
            success.append(item)
    return success
