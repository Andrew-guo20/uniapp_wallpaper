"""
壁纸源基类
所有壁纸数据源需继承此类，实现 search() 方法
"""
from abc import ABC, abstractmethod


class BaseSource(ABC):
    """壁纸源基类"""

    def __init__(self, name):
        self.name = name

    @abstractmethod
    def search(self, keyword, page=1, per_page=24):
        """
        搜索壁纸

        Args:
            keyword: 搜索关键词
            page: 页码
            per_page: 每页数量

        Returns:
            list[dict]: 标准化壁纸元数据列表
                {
                    "source_id": str,     # 源站唯一ID
                    "source": str,         # 来源名称
                    "title": str,          # 标题
                    "picurl": str,         # 原图URL
                    "description": str,    # 描述
                    "nickname": str,       # 作者
                    "tabs": list[str],     # 标签
                    "width": int,          # 宽度
                    "height": int,         # 高度
                }
        """
        pass

    def search_all_pages(self, keyword, target_count=50, per_page=24):
        """
        自动翻页搜索直到达到目标数量

        Args:
            keyword: 搜索关键词
            target_count: 目标采集数量
            per_page: 每页数量

        Returns:
            list[dict]: 壁纸元数据列表
        """
        all_items = []
        page = 1
        while len(all_items) < target_count:
            items = self.search(keyword, page=page, per_page=per_page)
            if not items:
                break
            all_items.extend(items)
            page += 1
        return all_items[:target_count]
