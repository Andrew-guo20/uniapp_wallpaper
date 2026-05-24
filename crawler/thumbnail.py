"""
缩略图生成器
使用 Pillow 将原图缩放为 300px 宽度的 webp 缩略图，存入分类目录
"""
import os
from PIL import Image
from config import get_thumbnails_dir, THUMBNAIL_WIDTH, THUMBNAIL_FORMAT, THUMBNAIL_QUALITY
from downloader import ensure_dir


def generate_thumbnail(image_path, category, output_name=None):
    """
    生成单张缩略图到分类目录

    Args:
        image_path: 原图本地路径
        category: 分类名称
        output_name: 输出文件名（不含扩展名）。默认在原文件名后加 _small

    Returns:
        str: 缩略图本地路径（成功）或 None（失败）
    """
    save_dir = get_thumbnails_dir(category)
    ensure_dir(save_dir)

    if not os.path.exists(image_path):
        print(f"  [skip] 原图不存在: {image_path}")
        return None

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    if output_name is None:
        output_name = f"{base_name}_small"

    thumb_path = os.path.join(save_dir, f"{output_name}.{THUMBNAIL_FORMAT}")

    if os.path.exists(thumb_path):
        print(f"  [skip] 缩略图已存在: {category}/{os.path.basename(thumb_path)}")
        return thumb_path

    try:
        with Image.open(image_path) as img:
            if img.mode in ("CMYK", "P"):
                img = img.convert("RGB")
            elif img.mode == "RGBA":
                background = Image.new("RGB", img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background

            orig_width, orig_height = img.size
            ratio = THUMBNAIL_WIDTH / orig_width
            new_height = int(orig_height * ratio)

            resized = img.resize((THUMBNAIL_WIDTH, new_height), Image.LANCZOS)
            resized.save(thumb_path, format=THUMBNAIL_FORMAT.upper(),
                         quality=THUMBNAIL_QUALITY)

            size_kb = os.path.getsize(thumb_path) / 1024
            print(f"  [缩略图] {category}/{os.path.basename(thumb_path)} "
                  f"({orig_width}x{orig_height} -> {THUMBNAIL_WIDTH}x{new_height}, {size_kb:.0f} KB)")
            return thumb_path

    except Exception as e:
        print(f"  [FAIL] 缩略图生成失败: {os.path.basename(image_path)} — {e}")
        return None


def generate_batch(items, category):
    """
    批量生成缩略图到分类目录

    Args:
        items: 壁纸数据列表，每项需有 "local_path" 和 "filename"
        category: 分类名称

    Returns:
        list: 生成成功的 items（已填充 "thumb_path" 字段）
    """
    success = []
    total = len(items)
    for idx, item in enumerate(items):
        print(f"\n[{idx + 1}/{total}] 缩略图: {item.get('title', '')[:40]}")
        thumb_path = generate_thumbnail(
            item["local_path"],
            category,
            output_name=f"{item['filename']}_small"
        )
        if thumb_path:
            item["thumb_path"] = thumb_path
            success.append(item)
    return success
