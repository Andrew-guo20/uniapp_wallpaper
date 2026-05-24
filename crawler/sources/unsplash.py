"""
Unsplash 壁纸采集器
API: https://unsplash.com/developers
需要注册获取 Access Key
免费版: 5000 请求/小时
"""
import requests
from sources import BaseSource
from config import UNSPLASH_ACCESS_KEY

UNSPLASH_API = "https://api.unsplash.com"

# Unsplash 搜索词映射
KEYWORD_MAP = {
    "风景":   "nature landscape",
    "动漫":   "anime art",
    "游戏":   "game art",
    "美女":   "portrait model",
    "汽车":   "car vehicle",
    "动物":   "animal wildlife",
    "建筑":   "architecture city",
    "太空":   "space universe",
    "抽象":   "abstract art",
    "自然":   "nature flower ocean",
}


class UnsplashSource(BaseSource):
    """Unsplash 壁纸源"""

    def __init__(self):
        super().__init__("unsplash")

    def search(self, keyword, page=1, per_page=30):
        search_term = KEYWORD_MAP.get(keyword, keyword)

        headers = {
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
            "Accept-Version": "v1",
        }

        params = {
            "query": search_term,
            "page": page,
            "per_page": min(per_page, 30),
            "orientation": "landscape",
        }

        resp = requests.get(
            f"{UNSPLASH_API}/search/photos",
            headers=headers,
            params=params,
            timeout=15,
        )

        if resp.status_code == 403:
            print(f"[Unsplash] API 限频或未配置 Access Key，跳过")
            return []

        resp.raise_for_status()
        data = resp.json()

        items = []
        for img in data.get("results", []):
            urls = img.get("urls", {})
            user = img.get("user", {})

            # 提取标签
            tags = []
            for tag in img.get("tags", []):
                title = tag.get("title", "")
                if title:
                    tags.append(title)
            # 补充用户自定义 tags
            for tag_info in img.get("topic_submissions", {}).values():
                if isinstance(tag_info, dict):
                    name = tag_info.get("name", "")
                    if name:
                        tags.append(name)

            items.append({
                "source_id": img.get("id", ""),
                "source": "unsplash",
                "title": img.get("description") or img.get("alt_description") or "Untitled",
                "picurl": urls.get("full", ""),
                "description": img.get("alt_description") or "",
                "nickname": user.get("name", ""),
                "tabs": list(set(tags))[:6],
                "width": img.get("width", 0),
                "height": img.get("height", 0),
            })

        return items
