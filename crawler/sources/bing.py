"""
Bing 每日壁纸采集器
无需 API Key，直接解析 Bing 的 JSON 接口

接口: https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8
  - idx: 偏移天数（0=今天, 1=昨天, ..., 最多7）
  - n:   返回数量（最多8）
"""
import requests
from sources import BaseSource

BING_API = "https://www.bing.com/HPImageArchive.aspx"


class BingSource(BaseSource):
    """Bing 每日壁纸"""

    def __init__(self):
        super().__init__("bing")

    def fetch_daily(self, days=8):
        """
        获取最近 N 天的每日壁纸

        Args:
            days: 获取天数（最多8天为一个批次，idx=0~7）

        Returns:
            list[dict]: 壁纸元数据列表
        """
        items = []
        # Bing 每次最多返回8条，idx 表示从第几天开始
        for start_idx in range(0, days, 8):
            batch_size = min(8, days - start_idx)
            params = {
                "format": "js",
                "idx": start_idx,
                "n": batch_size,
                "mkt": "zh-CN"     # 中文地区，获取中文标题
            }
            resp = requests.get(BING_API, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            for img in data.get("images", []):
                # 原图URL：拼接 baseUrl
                base_url = "https://www.bing.com" + img["urlbase"]
                # 1920x1080 分辨率
                picurl = base_url + "_UHD.jpg"

                items.append({
                    "source_id": img.get("hsh", ""),
                    "source": "bing",
                    "title": img.get("title", ""),
                    "picurl": picurl,
                    "description": img.get("copyright", ""),
                    "nickname": "Bing",
                    "tabs": self._extract_tabs(img.get("copyright", "")),
                    "width": 1920,
                    "height": 1080,
                })

        return items

    def search(self, keyword, page=1, per_page=24):
        # Bing 不支持按关键词搜索，返回空
        return []

    def _extract_tabs(self, copyright_text):
        """从版权信息中简单提取标签"""
        tabs = ["风景", "摄影"]
        if any(w in copyright_text for w in ["山", "雪山", "山脉"]):
            tabs.append("山")
        if any(w in copyright_text for w in ["海", "湖", "河", "水"]):
            tabs.append("水")
        if any(w in copyright_text for w in ["动物", "鸟", "猫", "狗"]):
            tabs.append("动物")
        if any(w in copyright_text for w in ["城市", "建筑"]):
            tabs.append("建筑")
        return tabs
