# uniCloudWallPaper/ — 云端后端

This file provides guidance to Claude Code when working in the `uniCloudWallPaper/` sub-project.

## 定位

果果壁纸后端 — uniCloud 支付宝云项目，包含云对象、数据库 Schema、uni-id 用户体系、uni-admin 后台管理。负责全部业务逻辑和数据存取。

## 开发进度

> 同步自根 [CLAUDE.md](../CLAUDE.md)

| 状态 | 说明 |
|------|------|
| **当前阶段** | 阶段一~四 ✅ 已部署测试，阶段五（运营能力）待开始 |
| **已完成** | uni-id/Schema/互动API/admin/去重，云对象已部署（单文件合并版 1019行 62方法） |
| **下一步** | 阶段五：定时触发器 + uni-push 推送方法 |
| **架构** | 10模块源文件 + 1个合并部署文件 + 10张Schema + 62个云对象方法 |

## 目录结构

```
uniCloudWallPaper/
├── uniCloud-alipay/
│   ├── cloudfunctions/wallpaper/
│   │   ├── index.obj.js          #   云对象主入口（32 个方法，~868 行）
│   │   └── package.json          #   timeout: 30s, 依赖 uni-cloud-jql
│   └── database/                 #   6 个 Schema 文件
│       ├── wallpaper-banner.schema.json
│       ├── wallpaper-classify.schema.json
│       ├── wallpaper-list.schema.json          # 核心表
│       ├── wallpaper-news.schema.json
│       ├── wallpaper-user-score.schema.json
│       └── wallpaper-download-record.schema.json
├── uni_modules/
│   ├── uni-config-center/        #   配置中心 v0.0.3（uni-id 依赖）
│   └── uni-id-common/            #   uni-id 公共库 v1.0.19（已安装，待配置）
├── pages/index/index.vue         #   默认首页（占位）
└── manifest.json                 #   项目配置（appid: __UNI__A72DEF1）
```

## 云对象架构（当前）

单文件 `index.obj.js`（868 行），包含：
- `_before` 钩子：提取 `deviceId` 作为用户标识
- `mergeData()` 辅助函数：URL 化时合并 query string + POST JSON body
- **12 个前端方法**：getBanner / getRandomWall / getClassify / getWallList / getDetailWall / setupScore / downloadWall / getUserInfo / getUserWallList / getNewsList / getNewsDetail / searchWall
- **20 个后台方法**：admin* 前缀，覆盖轮播图/分类/壁纸/公告/上传/批量导入

## 云对象重构方案（v2.0.0 模块化拆分）

```
uniCloud-alipay/cloudfunctions/wallpaper/
├── index.obj.js          # 主入口 — _before 钩子 + 合并所有模块方法
├── common.js             # 公共工具：db, dbCmd, mergeData, 分页, 敏感词过滤
├── wallpaper.js          # 壁纸/轮播图/分类/公告/搜索/评分/下载（~12 方法）
├── user.js               # 用户统计/历史记录
├── favorite.js           # [NEW] 收藏相关（add/remove/toggle/isFavorited）
├── comment.js            # [NEW] 评论相关（add/get/delete）
├── admin-banner.js       # 后台：轮播图 CRUD
├── admin-classify.js     # 后台：分类 CRUD
├── admin-wallpaper.js    # 后台：壁纸管理（CRUD + 审核 + 上传 + 批量导入）
├── admin-news.js         # 后台：公告 CRUD
├── admin-stats.js        # [NEW] 仪表盘/下载趋势/热门壁纸/评论审核/投稿审核
└── package.json
```

模块间引入方式：`const { db, dbCmd, mergeData } = require('./common')`
主入口合并：`Object.assign(module.exports, wallpaperMod, userMod, ...)`

## 数据库设计

### 现有表（6 张）

| 表名 | 字段 | 索引 | 说明 |
|------|------|------|------|
| `wallpaper-banner` | picurl, target, url, appid, sort, create_time | — | 轮播图 |
| `wallpaper-classify` | name, picurl, updateTime, sort | — | 分类 |
| `wallpaper-list` | classid, smallPicurl, picurl, score, description, tabs, downloadCount, scoreCount, status | idx_classid_status, idx_status_create | 壁纸核心表 |
| `wallpaper-news` | title, content, author, select, view_count | — | 公告 |
| `wallpaper-user-score` | wallId, deviceId, userScore | unique_wall_device (唯一) | 评分记录 |
| `wallpaper-download-record` | wallId, deviceId | idx_wall_device | 下载记录 |

### 待新增表（3 张）

| 表名 | 关键字段 | 索引 |
|------|---------|------|
| `wallpaper-favorites` | wallId, uid | unique_wall_user, idx_uid_time |
| `wallpaper-comments` | wallId, uid, content, status | idx_wall_status, idx_uid_time |
| `wallpaper-user-upload` | uid, picurl, classid, status, review_msg | idx_status_time, idx_uid_time |

### 待迁移字段
- `wallpaper-user-score.deviceId` → 新增 `uid` 字段，逐步迁移
- `wallpaper-download-record.deviceId` → 同上

## uni-id 集成要点

**配置位置**：`uni_modules/uni-config-center/uni-id/config.json`（待创建）

**登录方式**：微信小程序 `uni.login()` + uni-id 微信 OAuth

**`_before` 改造**：
```javascript
_before: function () {
  const clientInfo = this.getClientInfo()
  this.uid = clientInfo.uid || ''           // uni-id 登录后可用
  this.deviceId = clientInfo.deviceId || 'anonymous'  // 兼容未登录
}
```

**数据迁移策略**：
- 新增数据：同时写入 `uid`（如有）和 `deviceId`
- 历史数据：首次登录时后台迁移 `deviceId` → `uid`
- 查询用户数据：`uid` 和 `deviceId` OR 查询，覆盖迁移期

## admin/ 项目

独立的 uni-admin 项目（待创建），关联同一 uniCloud 服务空间，通过注册 Schema 自动生成管理界面。

管理模块：数据仪表盘 / 壁纸管理 / 分类管理 / 轮播图管理 / 公告管理 / 评论管理 / 用户管理 / 投稿审核
