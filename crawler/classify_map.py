"""
分类映射表

定义壁纸分类及对应的各数据源搜索词。
classify_id 来自数据库 wallpaper-classify 表中对应的 _id
"""
import os

# ============================================================
# 分类定义
# classify_id: 数据库 wallpaper-classify 表中对应的 _id
# ============================================================

CLASSIFY_MAP = {
    "风景": {
        "classify_id": "6a12c8807c40be03108a3059",
        "sort": 1,
        "priority_source": "wallhaven",
        "search_terms": {
            "wallhaven": "风景",
            "unsplash":  "风景",
            "pexels":    "风景",
        },
        "bing_category": "nature",
    },
    "动漫": {
        "classify_id": "6a12c8817c40be03108a3066",
        "sort": 2,
        "priority_source": "wallhaven",
        "search_terms": {
            "wallhaven": "动漫",
            "unsplash":  "动漫",
            "pexels":    "动漫",
        },
    },
    "游戏": {
        "classify_id": "6a12c8817c40be03108a3075",
        "sort": 3,
        "priority_source": "wallhaven",
        "search_terms": {
            "wallhaven": "游戏",
            "unsplash":  "游戏",
            "pexels":    "游戏",
        },
    },
    "美女": {
        "classify_id": "6a12c8827c40be03108a3086",
        "sort": 4,
        "priority_source": "wallhaven",
        "search_terms": {
            "wallhaven": "美女",
            "unsplash":  "美女",
            "pexels":    "美女",
        },
    },
    "汽车": {
        "classify_id": "6a12c8827c40be03108a3094",
        "sort": 5,
        "priority_source": "unsplash",
        "search_terms": {
            "wallhaven": "汽车",
            "unsplash":  "汽车",
            "pexels":    "汽车",
        },
    },
    "动物": {
        "classify_id": "6a12c8837c40be03108a30a2",
        "sort": 6,
        "priority_source": "unsplash",
        "search_terms": {
            "wallhaven": "动物",
            "unsplash":  "动物",
            "pexels":    "动物",
        },
    },
    "建筑": {
        "classify_id": "6a12c8847c40be03108a30ba",
        "sort": 7,
        "priority_source": "unsplash",
        "search_terms": {
            "wallhaven": "建筑",
            "unsplash":  "建筑",
            "pexels":    "建筑",
        },
    },
    "太空": {
        "classify_id": "6a12c8857c40be03108a30d2",
        "sort": 8,
        "priority_source": "wallhaven",
        "search_terms": {
            "wallhaven": "太空",
            "unsplash":  "太空",
            "pexels":    "太空",
        },
    },
    "抽象": {
        "classify_id": "6a12c8857c40be03108a30e2",
        "sort": 9,
        "priority_source": "wallhaven",
        "search_terms": {
            "wallhaven": "抽象",
            "unsplash":  "抽象",
            "pexels":    "抽象",
        },
    },
    "自然": {
        "classify_id": "6a12c8867c40be03108a30f5",
        "sort": 10,
        "priority_source": "unsplash",
        "search_terms": {
            "wallhaven": "自然",
            "unsplash":  "自然",
            "pexels":    "自然",
        },
    },
}


def get_classify_names():
    """获取所有分类名称列表"""
    return list(CLASSIFY_MAP.keys())


def get_classify_info(category_name):
    """获取单个分类的配置"""
    return CLASSIFY_MAP.get(category_name)


def get_enabled_categories():
    """获取已配置 classify_id 的分类（已创建数据库记录的分类）"""
    enabled = []
    for name, info in CLASSIFY_MAP.items():
        if info["classify_id"]:
            enabled.append(name)
    return enabled
