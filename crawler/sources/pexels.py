"""
Pexels 壁纸采集器
API: https://www.pexels.com/api/
需要注册获取 API Key
免费版: 200 请求/小时
"""
import requests
from sources import BaseSource
from config import PEXELS_API_KEY

PEXELS_API = "https://api.pexels.com/v1"

# Pexels 搜索词映射
KEYWORD_MAP = {
    "风景":   "nature landscape",
    "动漫":   "anime art",
    "游戏":   "gaming art",
    "美女":   "portrait model",
    "汽车":   "car vehicle",
    "动物":   "animal wildlife",
    "建筑":   "architecture city",
    "太空":   "space universe",
    "抽象":   "abstract art",
    "自然":   "nature flower",
}


class PexelsSource(BaseSource):
    """Pexels 壁纸源"""

    def __init__(self):
        super().__init__("pexels")

    def search(self, keyword, page=1, per_page=80):
        search_term = KEYWORD_MAP.get(keyword, keyword)

        headers = {
            "Authorization": PEXELS_API_KEY,
        }

        params = {
            "query": search_term,
            "page": page,
            "per_page": min(per_page, 80),
            "orientation": "landscape",
            "size": "large",
        }

        resp = requests.get(
            f"{PEXELS_API}/search",
            headers=headers,
            params=params,
            timeout=15,
        )

        if resp.status_code in (401, 403):
            print(f"[Pexels] API 认证失败或限频，跳过")
            return []

        resp.raise_for_status()
        data = resp.json()

        items = []
        for img in data.get("photos", []):
            src = img.get("src", {})

            items.append({
                "source_id": str(img.get("id", "")),
                "source": "pexels",
                "title": img.get("alt") or "Untitled",
                "picurl": src.get("original", ""),
                "description": f"Photo by {img.get('photographer', '')} on Pexels",
                "nickname": img.get("photographer", ""),
                "tabs": self._parse_keywords(search_term),
                "width": img.get("width", 0),
                "height": img.get("height", 0),
            })

        return items

    def _parse_keywords(self, search_term):
        """简单地将搜索词拆分为标签"""
        return [w.strip() for w in search_term.split() if len(w.strip()) > 2]
