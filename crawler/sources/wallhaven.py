"""
Wallhaven 壁纸采集器
API: https://wallhaven.cc/api/v1/search
免费使用，无需 API Key（有频率限制）
"""
import requests
from sources import BaseSource
from config import WALLHAVEN_API_KEY

WALLHAVEN_API = "https://wallhaven.cc/api/v1/search"

# Wallhaven 分类代码
CATEGORY_MAP = {
    "scenery": "100",    # General
    "anime": "010",      # Anime
    "girl": "001",       # People
}

# 中文关键词 → Wallhaven 搜索词
KEYWORD_MAP = {
    "风景":   ["nature", "landscape", "mountain", "lake", "forest"],
    "动漫":   ["anime", "anime girl", "anime scenery"],
    "游戏":   ["game art", "video game", "game wallpaper"],
    "美女":   ["model", "girl", "portrait"],
    "汽车":   ["car", "vehicle", "sports car"],
    "动物":   ["animal", "wildlife", "cat", "dog"],
    "建筑":   ["architecture", "city", "building"],
    "太空":   ["space", "universe", "planet", "galaxy"],
    "抽象":   ["abstract", "digital art", "minimalist"],
    "自然":   ["nature wallpaper", "flower", "ocean", "forest"],
}


class WallhavenSource(BaseSource):
    """Wallhaven 壁纸源"""

    def __init__(self):
        super().__init__("wallhaven")
        self._cache = {}

    def search(self, keyword, page=1, per_page=24):
        # 如果传入了中文分类名，映射到英文搜索词
        if keyword in KEYWORD_MAP:
            search_term = KEYWORD_MAP[keyword][0]  # 用第一个作为主搜索词
        else:
            search_term = keyword

        params = {
            "q": search_term,
            "sorting": "toplist",
            "purity": "100",     # SFW only
            "page": page,
        }
        if WALLHAVEN_API_KEY:
            params["apikey"] = WALLHAVEN_API_KEY

        resp = requests.get(WALLHAVEN_API, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        items = []
        for img in data.get("data", []):
            items.append({
                "source_id": img.get("id", ""),
                "source": "wallhaven",
                "title": f"Wallhaven #{img.get('id', '')}",
                "picurl": img.get("path", ""),
                "description": f"Resolution: {img.get('resolution', '')}",
                "nickname": img.get("uploader", {}).get("username", ""),
                "tabs": self._normalize_tags(img.get("tags", [])),
                "width": int(img.get("dimension_x", 0)),
                "height": int(img.get("dimension_y", 0)),
            })

        return items

    def search_all_categories(self, keyword, target_count=50, per_page=24):
        """
        对中文分类名，遍历多个相关英文搜索词采集
        """
        search_terms = KEYWORD_MAP.get(keyword, [keyword])
        all_items = []
        per_term_target = max(target_count // len(search_terms), 20)

        for term in search_terms:
            if len(all_items) >= target_count:
                break
            items = self.search_all_pages(term, target_count=per_term_target, per_page=per_page)
            all_items.extend(items)

        return all_items[:target_count]

    def _normalize_tags(self, tags):
        """提取标签名称列表"""
        result = []
        for tag in tags[:6]:
            name = tag.get("name", "")
            if name:
                result.append(name)
        return result
