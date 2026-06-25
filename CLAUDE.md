# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

果果壁纸 — uni-app (Vue3) 跨端壁纸小程序，支持微信小程序和 H5。后端采用 uniCloud 支付宝云，包含 6 张数据库表、32 个云对象方法，以及 Python 壁纸采集器。

## 项目结构

```
uniapp_wallpaper/
├── wallpaper/                  # 前端小程序（uni-app Vue3）
│   ├── API/apis.js             #   统一 API 层（cloud object import）
│   ├── pages/                  #   8 个页面（index/classify/classlist/preview/search/user/notice）
│   ├── components/             #   公共组件（common-title/custom-nav-bar/theme-item）
│   ├── common/images/          #   本地素材
│   ├── common/style/           #   全局样式
│   ├── utils/                  #   工具函数（common.js/system.js）
│   ├── uni_modules/            #   14 个 uni-app 插件（mp-html/uni-rate/uni-search-bar...）
│   └── uniCloud-alipay/        #   云服务副本（从 uniCloudWallPaper 同步）
│       ├── cloudfunctions/wallpaper/index.obj.js
│       └── database/           #   6 个 Schema 文件
│
├── uniCloudWallPaper/          # 云端项目（主副本 — 在此开发云对象和数据库）
│   ├── uniCloud-alipay/
│   │   ├── cloudfunctions/wallpaper/
│   │   │   ├── index.obj.js    #   云对象（32 个方法，~868 行）
│   │   │   └── package.json    #   timeout: 30s
│   │   └── database/           #   6 个 Schema 文件
│   └── uni_modules/
│       ├── uni-config-center/  #   配置中心（uni-id 依赖）
│       └── uni-id-common/      #   uni-id 公共库（已安装，待配置）
│
├── crawler/                    # Python 壁纸采集器
│   ├── main.py                 #   主编排（5 阶段流水线）
│   ├── sources/                #   4 个数据源（bing/wallhaven/unsplash/pexels）
│   ├── downloader.py           #   流式下载 + 重试
│   ├── thumbnail.py            #   Pillow 缩略图生成（300px webp）
│   ├── uploader.py             #   base64 上传云存储
│   ├── importer.py             #   批量导入（adminBatchImport）
│   ├── classify_map.py         #   10 分类 → 搜索词映射
│   └── requirements.txt        #   requests + Pillow
│
└── admin/                      # [待创建] uni-admin 后台管理
```

## 架构模式

### 数据流
```
Vue Page → API/apis.js → uniCloud.importObject('wallpaper') → 云对象 (index.obj.js) → 数据库
```

- 前端不直接操作数据库，全部通过云对象中转
- 云对象使用传统数据库模式（`db` + `dbCmd`），不使用 JQL
- Schema 权限：内容表只读，用户操作表可读可写，后台操作由云对象绕过

### 数据库表关系
```
wallpaper-classify (分类) ──1:N── wallpaper-list (壁纸核心表) ──1:N── wallpaper-user-score (评分)
                                                                  ──1:N── wallpaper-download-record (下载记录)
wallpaper-banner (轮播图) — 独立
wallpaper-news (公告) — 独立
```

### 云对象方法分组
- **12 个前端方法**：getBanner / getRandomWall / getClassify / getWallList / getDetailWall / setupScore / downloadWall / getUserInfo / getUserWallList / getNewsList / getNewsDetail / searchWall
- **20 个后台方法**：admin* 前缀，覆盖轮播图/分类/壁纸/公告的 CRUD + 批量导入 + 上传

### 关键技术决策
- **deviceId 暂代用户标识**：`_before` 钩子从 `clientInfo.deviceId` 提取，后续迁移到 uni-id uid
- **mergeData()**：URL 化时合并 query string 和 POST body 参数
- **搜索用 JS 过滤**：支付宝云不支持 `dbCmd.regex()`，改为内存匹配
- **评分防重复**：`wallpaper-user-score` 的 `{wallId, deviceId}` 唯一联合索引
- **下载计数原子操作**：`dbCmd.inc(1)`

## 常用命令

### 前端开发
```bash
# 微信小程序编译输出在 wallpaper/unpackage/dist/build/mp-weixin/
# 发行：HBuilderX → 发行 → 小程序-微信

# 关联服务空间（首次）
# HBuilderX 中右键 wallpaper → 关联 uniCloud 服务空间
```

### 爬虫
```bash
cd crawler

# 查看帮助
python main.py --help

# 本地测试（只下载+缩略图）
python main.py -c 风景 -n 5 -s bing --local

# 正式采集（全流程）
python main.py -c 风景 动漫 -n 20 -s bing wallhaven

# 全量采集所有分类
python main.py -n 50
```

### 云对象部署
```
HBuilderX → uniCloudWallPaper/uniCloud-alipay/cloudfunctions/wallpaper → 右键 → 上传部署
```

## 关键约定

- 云对象方法返回统一格式：`{ errCode: 0, data: ... }` 或 `{ errCode: 1, errMsg: ... }`
- API 函数签名不可变（前端 8 个页面依赖现有接口）
- 缩略图规范：300px 宽、webp 格式、80% 质量
- 壁纸 `status` 字段：0=待审核 / 1=已发布 / 2=已下架
- 微信小程序 AppID：`wxedf7c9be266ef39c`
- 支付宝云不支持的功能：`dbCmd.regex()`、`aggregate().sample()`

## 开发流程规范

### 基本规则

1. **逐阶段推进**：按照开发计划的五个阶段依次执行，不跳阶段
2. **模块级汇报**：每个阶段中的每个功能模块开发完成后，总结：
   - **做了什么** — 具体改动的文件和方法
   - **怎么做的** — 技术实现方式和关键决策
   - **为什么这样做** — 设计理由和取舍
3. **获取许可**：汇报后等待确认，再进入下一个功能模块或阶段
4. **告知下一步**：每次汇报末尾明确说明接下来要做什么

### 进度同步

每次功能模块完成后，**同步更新**以下文件的进度状态：

| 文件 | 更新内容 |
|------|---------|
| `CLAUDE.md`（根） | 阶段状态 + 各板块进度 + 下一步 |
| `wallpaper/开发计划.md` | 前端任务 checkbox |
| `uniCloudWallPaper/开发计划.md` | 后端任务 checkbox |
| `crawler/开发计划.md` | 采集器任务 checkbox |

### 前端开发

涉及前端 UI 页面和组件开发时，使用 `/frontend-design` 技能获取设计指导，确保视觉风格一致、不套用模板化样式。

### Git 提交

- 每个功能模块完成后提交一次，不跨模块混合提交
- commit message 使用简洁英文，格式：`feat(板块): 描述`
- 不自动 push，除非明确要求

---

## 子项目索引

| 子项目 | 目录 | CLAUDE.md | 开发计划 | 说明 |
|--------|------|-----------|---------|------|
| 前端小程序 | `wallpaper/` | [wallpaper/CLAUDE.md](wallpaper/CLAUDE.md) | [wallpaper/开发计划.md](wallpaper/开发计划.md) | uni-app Vue3，8 个页面 |
| 云端后端 | `uniCloudWallPaper/` | [uniCloudWallPaper/CLAUDE.md](uniCloudWallPaper/CLAUDE.md) | [uniCloudWallPaper/开发计划.md](uniCloudWallPaper/开发计划.md) | 云对象 + 数据库 + uni-admin |
| 数据采集器 | `crawler/` | [crawler/CLAUDE.md](crawler/CLAUDE.md) | [crawler/开发计划.md](crawler/开发计划.md) | Python 壁纸采集 |

## 当前开发进度

> 版本 2.0.0 | 更新于 2025-06-25

### 整体状态：🚀 阶段一完成，阶段二待开始

| 根阶段 | 内容 | wallpaper/ | uniCloudWallPaper/ | crawler/ |
|--------|------|:---:|:---:|:---:|
| **阶段一** | 用户体系 | ✅ 阶段一 完成 | ✅ 阶段一 完成 | — |
| **阶段二** | 功能增强/架构重构 | ⬜ 阶段二 3.5天 | ⬜ 阶段二 1.5天 | ⬜ 阶段一 0.5天 |
| **阶段三** | 后台管理 | — | ⬜ 阶段四 3天 | — |
| **阶段四** | 运营能力 | ⬜ 阶段三+四 1天 | ⬜ 阶段五 2天 | ⬜ 阶段二+三 1天 |
| **阶段五** | 测试发布 | ⬜ 阶段五 1天 | ⬜ 阶段六 1天 | — |

### 各板块进度

| 板块 | 当前阶段 | 状态 | 下一步任务 |
|------|---------|------|-----------|
| **wallpaper/** | 阶段一 ✅ → 阶段二 | 登录+用户中心已接入 | 收藏功能（预览页改造 + API） |
| **uniCloudWallPaper/** | 阶段一 ✅ → 阶段二 | uni-id+schema+登录方法已就绪 | 模块化拆分（common.js + 5个模块） |
| **crawler/** | 待命 | 4源5阶段 | wallpaper 阶段二/三不涉及，后续才开工 |
| **admin/** | — | ❌ 不存在 | uniCloudWallPaper 阶段四时创建 |

### 阶段一交付清单

| 板块 | 交付内容 |
|------|---------|
| **uniCloudWallPaper/** | uni-id 配置、Schema uid/favoriteCount 字段、_before 双写、OR 查询兼容、migrateDeviceToUid 迁移脚本、Schema 权限升级、userLogin/getUserProfile/checkToken 方法 |
| **wallpaper/** | pages/login/login.vue 登录页、utils/auth.js Token 管理、App.vue 全局登录态、pages/user/user.vue 用户中心改造（头像/收藏入口/退出登录）、API/apis.js 3 个登录方法、preview.vue 评分/下载未登录引导 |

### 文档状态

| 文档 | 状态 |
|------|------|
| [PRD.md](PRD.md) | ✅ 已完成 |
| [开发计划.md](开发计划.md) | ✅ 已完成（总计划） |
| [CHANGELOG.md](CHANGELOG.md) | ✅ 已完成 |
| 子项目开发计划 ×3 | ✅ 已完成 |
