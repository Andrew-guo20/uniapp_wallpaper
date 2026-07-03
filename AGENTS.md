# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
| `AGENTS.md`（根） | 阶段状态 + 各板块进度 + 下一步 |
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

| 子项目 | 目录 | AGENTS.md | 开发计划 | 说明 |
|--------|------|-----------|---------|------|
| 前端小程序 | `wallpaper/` | [wallpaper/AGENTS.md](wallpaper/AGENTS.md) | [wallpaper/开发计划.md](wallpaper/开发计划.md) | uni-app Vue3，8 个页面 |
| 云端后端 | `uniCloudWallPaper/` | [uniCloudWallPaper/AGENTS.md](uniCloudWallPaper/AGENTS.md) | [uniCloudWallPaper/开发计划.md](uniCloudWallPaper/开发计划.md) | 云对象 + 数据库 + uni-admin |
| 数据采集器 | `crawler/` | [crawler/AGENTS.md](crawler/AGENTS.md) | [crawler/开发计划.md](crawler/开发计划.md) | Python 壁纸采集 |

## 当前开发进度

> 版本 2.0.0 | 更新于 2026-06-29

### 整体状态：✅ 微信小程序真机回归通过，待发布准备

| 根阶段 | 内容 | wallpaper/ | uniCloudWallPaper/ | crawler/ |
|--------|------|:---:|:---:|:---:|
| **阶段一** | 用户体系 | ✅ 阶段一 完成 | ✅ 阶段一 完成 | — |
| **阶段二** | 功能增强/架构重构 | ✅ 阶段二+三 完成 | ✅ 阶段二+三 完成 | ✅ 阶段一 完成 |
| **阶段三** | 后台管理 | — | ✅ 阶段四 完成 | ✅ 阶段二 完成 |
| **阶段四** | 运营能力 | ✅ 阶段四 完成 | ⬜ 阶段五 2天 | ✅ 阶段三 完成 |
| **阶段五** | 测试发布 | ✅ 真机回归通过 | ⬜ 阶段六发布准备 | — |

### 各板块进度

| 板块 | 当前阶段 | 状态 | 下一步任务 |
|------|---------|------|-----------|
| **wallpaper/** | 阶段一~五 ✅ | 登录+互动+投稿+搜索+真机回归通过 | 发布前包体/隐私协议/体验版上传检查 |
| **uniCloudWallPaper/** | 阶段一~四 ✅ → 阶段五/六 | uni-id+互动API+云对象真机验证通过，admin已就绪 | 生产发布前确认公共模块、Schema、云对象最终部署；定时触发器/推送后续增强 |
| **crawler/** | ✅ 全部完成 | 去重+headless+健康检查+智能采集 | 配合后端阶段五对接定时触发器 |
| **admin/** | ✅ 完成 | 9 个注册页面已补齐（含壁纸编辑、用户管理） | 配合后端阶段五，部署后复测管理闭环 |

### 交付清单

| 板块 | 交付内容 |
|------|---------|
| **uniCloudWallPaper/** | uni-id 配置、Schema 迁移、_before 双写、OR 查询兼容、迁移脚本、登录方法、模块化拆分（10模块）、10张Schema、收藏/评论/推荐/投稿/搜索 13 方法、admin-stats 10 方法、adminCheckWallExists 去重方法 |
| **wallpaper/** | 登录页、Token 管理、全局登录态+推送监听、用户中心改造、API 层 26 方法、预览页收藏按钮+评论面板、投稿页、搜索页云端 API、/frontend-design 重设计 |
| **crawler/** | API Key 配置化、云端去重、headless 无交互模式、JSON 输出、健康检查、目标数量智能策略 |
| **admin/** | 仪表盘（4色统计卡+7快捷入口）、壁纸管理（状态Tab+审核+分页+编辑）、分类/轮播图/公告/用户/评论管理、投稿审核（通过自动发布） |

### 部署状态

| 项目 | 状态 | 说明 |
|------|:---:|------|
| 云对象 | ✅ 真机验证通过 | 当前云端调试/真机回归通过；发布前需确认最终版本已上传 |
| 数据库 Schema | ✅ 已用于真机测试 | 发布前复核 10 个 Schema 均为最新版本 |
| uni-id 公共模块 | ✅ 真机登录验证通过 | 发布前复核 uni-config-center + uni-id-common 均为最新版本 |
| 前端 wallpaper/ | ✅ 微信真机测试通过 | 下一步上传体验版/提交审核前检查 |
| 后台 admin/ | ⬜ 待发布前复核 | 运行到浏览器 H5，配合后端管理功能复测 |

**部署顺序：** 公共模块 → Schema → 云对象 → 前端运行

### 文档状态

| 文档 | 状态 |
|------|------|
| [PRD.md](PRD.md) | ✅ 已完成 |
| [开发计划.md](开发计划.md) | ✅ 已完成（总计划） |
| [CHANGELOG.md](CHANGELOG.md) | ✅ 已完成 |
| [wallpaper/开发计划.md](wallpaper/开发计划.md) | ✅ 前端任务 |
| [uniCloudWallPaper/开发计划.md](uniCloudWallPaper/开发计划.md) | ✅ 后端任务 |
| [crawler/开发计划.md](crawler/开发计划.md) | ✅ 采集器任务 |
