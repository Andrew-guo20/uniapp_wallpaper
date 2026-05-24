"""
壁纸采集器配置文件

使用前请根据实际情况修改以下配置：
1. UNICLOUD_FUNCTION_URL — 云对象 URL 化后的地址（在 uniCloud 控制台开启）
2. 各数据源的 API Key（通过环境变量设置更安全）
"""
import os

# ============================================================
# uniCloud 云对象 URL（需先在 uniCloud 控制台开启 URL 化）
# 格式示例: https://fc-xxx.bspapp.com/wallpaper
# ============================================================
UNICLOUD_FUNCTION_URL = os.getenv("UNICLOUD_FUNCTION_URL", "https://env-00jy6ar8nt4o.dev-hz.cloudbasefunction.cn/wallpaper")

# ============================================================
# API Keys（通过环境变量设置）
# ============================================================
WALLHAVEN_API_KEY = os.getenv("WALLHAVEN_API_KEY", "")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")

# ============================================================
# 本地存储路径
# ============================================================
DOWNLOAD_DIR = "./downloads"

def get_category_dir(category_name):
    """获取分类对应的本地存储路径"""
    return os.path.join(DOWNLOAD_DIR, category_name)

def get_originals_dir(category_name):
    """获取分类原图存储路径"""
    return os.path.join(DOWNLOAD_DIR, category_name, "originals")

def get_thumbnails_dir(category_name):
    """获取分类缩略图存储路径"""
    return os.path.join(DOWNLOAD_DIR, category_name, "thumbnails")

# ============================================================
# 缩略图配置
# ============================================================
THUMBNAIL_WIDTH = 300       # 缩略图宽度（px）
THUMBNAIL_FORMAT = "webp"   # 缩略图格式
THUMBNAIL_QUALITY = 80      # webp 质量 (0-100)

# ============================================================
# 采集配置
# ============================================================
REQUEST_TIMEOUT = 30        # HTTP 请求超时（秒）
DOWNLOAD_RETRY = 3          # 下载失败重试次数
PER_CATEGORY_MIN = 50       # 每个分类最少采集数量
