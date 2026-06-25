# crawler/ — Python 壁纸采集器

This file provides guidance to Claude Code when working in the `crawler/` sub-project.

## 定位

Python 命令行工具，从多个壁纸源自动采集、下载、处理、上传并导入壁纸数据到 uniCloud 数据库。

## 开发进度

> 同步自根 [CLAUDE.md](../CLAUDE.md)

| 状态 | 说明 |
|------|------|
| **当前阶段** | 待命（阶段一~二不涉及采集器） |
| **已完成** | 4 源 5 阶段流水线，203 张壁纸 |
| **下一步** | wallpaper/uniCloudWallPaper 阶段二完成后，阶段三开始：API Key 配置化 + 云端去重 |

## 目录结构

```
crawler/
├── main.py                 # 主流程编排（命令行入口）
├── config.py               # 全局配置（路径、API Key、云对象 URL）
├── classify_map.py         # 分类映射表（10 个分类 + 搜索词）
├── downloader.py           # 图片下载模块（流式 + 重试 + 断点续传）
├── thumbnail.py            # 缩略图生成模块（Pillow, 300px webp）
├── uploader.py             # 云存储上传模块（base64 → adminUpload）
├── importer.py             # 批量导入模块（adminBatchImport / JSON 导出）
├── requirements.txt        # requests>=2.28.0, Pillow>=9.0.0
├── sources/                # 壁纸数据源
│   ├── __init__.py         #   BaseSource 抽象基类
│   ├── bing.py             #   Bing 每日壁纸（免费，~8张/天）
│   ├── wallhaven.py        #   Wallhaven API（免费，24张/页）
│   ├── unsplash.py         #   Unsplash API（需 Access Key）
│   └── pexels.py           #   Pexels API（需 API Key）
├── downloads/              # 本地图片存储（按分类存放）
│   ├── 风景/originals/     #   原图
│   ├── 风景/thumbnails/    #   缩略图
│   └── ...
└── exports/                # JSON 导出目录（离线模式）
```

## 五阶段流水线

```
main.py → sources → downloader → thumbnail → uploader → importer
 (编排)    (采集)     (下载)       (缩略图)     (上传)      (导入)
```

1. **采集**（sources/）：调用壁纸源 API，获取图片元数据（URL、标题、标签）
2. **下载**（downloader.py）：流式下载原图，3 次重试 + 指数退避，自动去重
3. **缩略图**（thumbnail.py）：Pillow 缩放至 300px 宽，WebP 80% 质量，处理 RGBA/CMYK
4. **上传**（uploader.py）：base64 编码 → 调用 `adminUpload` 上传到云存储
5. **导入**（importer.py）：每批 50 条调用 `adminBatchImport`，支持离线 JSON 导出

## 命令行用法

```bash
# 查看帮助
python main.py --help

# 列出所有分类和数据源
python main.py --list-categories
python main.py --list-sources

# 本地测试（只下载+缩略图，不上传导入）
python main.py -c 风景 -n 5 -s bing --local

# 正式采集（全流程）
python main.py -c 风景 动漫 -n 20 -s bing wallhaven

# 全量采集所有分类
python main.py -n 50
```

## 10 个分类映射

| 分类 | classify_id | 英文搜索词 |
|------|------------|-----------|
| 风景 | `6a12c88...3059` | nature, landscape, mountain, ocean |
| 动漫 | `6a12c88...3066` | anime, anime girl, anime scenery |
| 游戏 | `6a12c88...3075` | game art, video game, gaming wallpaper |
| 美女 | `6a12c88...3086` | model, girl, portrait |
| 汽车 | `6a12c88...3094` | car, vehicle, sports car |
| 动物 | `6a12c88...30a2` | animal, wildlife, cat, dog |
| 建筑 | `6a12c88...30ba` | architecture, city, building |
| 太空 | `6a12c88...30d2` | space, universe, planet, galaxy |
| 抽象 | `6a12c88...30e2` | abstract, digital art, gradient |
| 自然 | `6a12c88...30f5` | nature wallpaper, flower, forest |

## 数据源特性

| 源 | 需要 Key | 每次返回 | 质量 | 适用分类 |
|----|---------|---------|------|---------|
| Bing | ❌ 免费 | 8 张/天 | 高（摄影为主） | 风景、动物、建筑、自然 |
| Wallhaven | ❌ 免费 | 24 张/页 | 高（二次元/游戏多） | 动漫、游戏、太空、抽象 |
| Unsplash | ✅ Access Key | 30 张/页 | 高（摄影为主） | 美女、汽车、建筑 |
| Pexels | ✅ API Key | 80 张/页 | 中高 | 全分类兜底 |

## 关键约定

- 缩略图：300px 宽、等比缩放、WebP 80% 质量
- 文件命名：`{uuid}_small.webp`（缩略图）、`{uuid}.jpg`（原图）
- 云存储路径：`wallpaper/{filename}`
- 批量导入每批 50 条
- 导入壁纸默认 status=1（已发布）
- 类目名用中文，传给 API 时通过 `KEYWORD_MAP` 映射为英文
