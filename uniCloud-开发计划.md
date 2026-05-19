# uniCloud Wallpaper 开发计划

> 从零搭建壁纸小程序后端：数据库设计 → 云对象CRUD → 数据采集 → 前端接入
>
> **当前阶段：纯后端 CRUD + 前端展示，uni-id 用户体系后续再开发**

---

## 目录

1. [项目现状](#一项目现状)
2. [数据库表设计](#二数据库表设计)
3. [云对象设计](#三云对象设计)
4. [数据采集方案](#四数据采集方案)
5. [前端改造](#五前端改造)
6. [实施步骤](#六实施步骤)
7. [后续规划](#七后续规划)

---

## 一、项目现状

### 当前架构

```
[前端] wallpaper/ (uni-app Vue3)
    │  uni.request() + access-key
    ▼
[第三方API] tea.qingnian8.com/api/bizhi/  ← 替换目标
```

### 目标架构（当前阶段）

```
[前端] wallpaper/ (uni-app Vue3)
    │  uniCloud.importObject('wallpaper')
    ▼
[云对象] wallpaper/index.obj.js
    │  uniCloud.database()
    ▼
[数据库] 6 张表
```

> **暂不引入 uni-id**：用户标识使用设备 ID（`clientInfo.deviceId`），后台管理方法暂不做权限校验，后续再接入 uni-id 用户体系和 uni-admin 后台。

### 已完成

- 6 张表的 schema 文件已创建
- 云对象骨架已创建（空壳 `index.obj.js`）
- 前端项目完整，12 个 API 调用点已梳理清楚

### 需要修复

- `wallpaper-banner.schema.json` 结构有误：`sort` 和 `create_time` 被错误嵌套在 `picurl` 属性块内

---

## 二、数据库表设计

### 2.1 wallpaper-banner（轮播图）

```json
{
  "bsonType": "object",
  "required": ["picurl", "sort"],
  "permission": {
    "read": true,
    "create": false,
    "update": false,
    "delete": false
  },
  "properties": {
    "_id":         { "description": "系统自动生成" },
    "picurl":      { "bsonType": "string",  "description": "轮播图云存储URL" },
    "target":      { "bsonType": "string",  "description": "跳转类型：miniProgram / page", "enum": ["miniProgram", "page"] },
    "url":         { "bsonType": "string",  "description": "跳转地址（page传classid，miniProgram传path）" },
    "appid":       { "bsonType": "string",  "description": "小程序appid（target=miniProgram时必填）" },
    "sort":        { "bsonType": "int",     "description": "排序（升序）" },
    "create_time": { "bsonType": "timestamp", "description": "创建时间" }
  }
}
```

### 2.2 wallpaper-classify（分类）

```json
{
  "bsonType": "object",
  "required": ["name", "picurl"],
  "permission": {
    "read": true,
    "create": false,
    "update": false,
    "delete": false
  },
  "properties": {
    "_id":         { "description": "分类ID" },
    "name":        { "bsonType": "string",  "description": "分类名称" },
    "picurl":      { "bsonType": "string",  "description": "分类封面图云存储URL" },
    "updateTime":  { "bsonType": "timestamp", "description": "最后更新时间" },
    "sort":        { "bsonType": "int",     "description": "排序（升序）" }
  }
}
```

### 2.3 wallpaper-list（壁纸详情，核心表）

```json
{
  "bsonType": "object",
  "required": ["classid", "smallPicurl", "picurl", "status"],
  "permission": {
    "read": true,
    "create": false,
    "update": false,
    "delete": false
  },
  "properties": {
    "_id":           { "description": "壁纸ID" },
    "classid":       { "bsonType": "string",  "description": "关联分类ID" },
    "smallPicurl":   { "bsonType": "string",  "description": "缩略图URL（_small.webp）" },
    "picurl":        { "bsonType": "string",  "description": "原图URL" },
    "nickname":      { "bsonType": "string",  "description": "发布者昵称" },
    "score":         { "bsonType": "double",  "description": "综合评分(0-5，支持半分)" },
    "description":   { "bsonType": "string",  "description": "壁纸简介" },
    "tabs":          { "bsonType": "array",   "description": "标签数组", "arrayType": "string" },
    "downloadCount": { "bsonType": "int",     "description": "累计下载次数" },
    "scoreCount":    { "bsonType": "int",     "description": "评分人数" },
    "create_time":   { "bsonType": "timestamp", "description": "上传时间" },
    "status":        { "bsonType": "int",     "description": "状态：0=待审核 1=已发布 2=已下架", "enum": [0, 1, 2] }
  },
  "index": [
    { "name": "idx_classid_status", "fieldList": { "classid": 1, "status": 1 } },
    { "name": "idx_status_create",  "fieldList": { "status": 1, "create_time": -1 } }
  ]
}
```

### 2.4 wallpaper-news（公告/新闻）

```json
{
  "bsonType": "object",
  "required": ["title", "content"],
  "permission": {
    "read": true,
    "create": false,
    "update": false,
    "delete": false
  },
  "properties": {
    "_id":          { "description": "公告ID" },
    "title":        { "bsonType": "string",  "description": "公告标题" },
    "content":      { "bsonType": "string",  "description": "公告内容（HTML富文本）" },
    "author":       { "bsonType": "string",  "description": "作者" },
    "select":       { "bsonType": "bool",    "description": "是否置顶" },
    "view_count":   { "bsonType": "int",     "description": "浏览次数" },
    "publish_date": { "bsonType": "timestamp", "description": "发布时间" },
    "create_time":  { "bsonType": "timestamp", "description": "创建时间" }
  }
}
```

### 2.5 wallpaper-user-score（用户评分记录）

```json
{
  "bsonType": "object",
  "required": ["wallId", "deviceId", "userScore"],
  "permission": {
    "read": true,
    "create": true,
    "update": false,
    "delete": false
  },
  "properties": {
    "_id":         { "description": "系统自动生成" },
    "wallId":      { "bsonType": "string",  "description": "壁纸ID" },
    "deviceId":    { "bsonType": "string",  "description": "设备ID（暂代用户标识，后续迁移到openid）" },
    "userScore":   { "bsonType": "double",  "description": "用户评分(0-5)" },
    "create_time": { "bsonType": "timestamp", "description": "评分时间" }
  },
  "index": [
    { "name": "unique_wall_device", "unique": true, "fieldList": { "wallId": 1, "deviceId": 1 } }
  ]
}
```

### 2.6 wallpaper-download-record（用户下载记录）

```json
{
  "bsonType": "object",
  "required": ["wallId", "deviceId"],
  "permission": {
    "read": true,
    "create": true,
    "update": false,
    "delete": false
  },
  "properties": {
    "_id":         { "description": "系统自动生成" },
    "wallId":      { "bsonType": "string",  "description": "壁纸ID" },
    "deviceId":    { "bsonType": "string",  "description": "设备ID（暂代用户标识，后续迁移到openid）" },
    "create_time": { "bsonType": "timestamp", "description": "下载时间" }
  },
  "index": [
    { "name": "idx_wall_device", "fieldList": { "wallId": 1, "deviceId": 1 } }
  ]
}
```

### 表关系图

```
wallpaper-classify (分类)
    │ 1:N
    ▼
wallpaper-list (壁纸)
    │ 1:N
    ├── wallpaper-user-score (评分记录)
    └── wallpaper-download-record (下载记录)

wallpaper-banner (轮播图) —— 独立
wallpaper-news (公告) —— 独立
```

> **关于 deviceId**：当前阶段用设备 ID 代替用户标识。后续接入 uni-id 时，只需将 `deviceId` 字段替换为 `openid`，索引同步更新即可。评分和下载的去重逻辑（唯一索引）依赖这个字段。

---

## 三、云对象设计

云对象文件：`uniCloud-alipay/cloudfunctions/wallpaper/index.obj.js`

### 3.1 _before 预处理（简化版）

```javascript
_before: function () {
  const clientInfo = this.getClientInfo()
  // 获取设备ID作为用户标识（后续接入 uni-id 后改为 clientInfo.uid）
  this.deviceId = clientInfo.deviceId || 'anonymous'
}
```

不需要 token 校验，不需要 uni-id 依赖。只管从客户端信息中提取设备 ID。

### 3.2 前端调用方法（12个，对应原 API）

| 方法名 | 对应原API | 功能 | 实现要点 |
|--------|----------|------|---------|
| `getBanner()` | homeBanner | 获取轮播图 | 按 `sort` 升序返回全部 |
| `getRandomWall()` | randomWall | 每日推荐9张随机 | `aggregate().sample(9)` |
| `getClassify(data)` | classify | 分类列表 | 支持 `select:true` 全量，按 `sort` 排序 |
| `getWallList(data)` | wallList | 分类下壁纸分页 | `where({classid, status:1})`，`orderBy('create_time','desc')` |
| `getDetailWall(data)` | detailWall | 壁纸详情 | `where({_id})` 单条查询 |
| `setupScore(data)` | setupScore | 用户评分 | `add` 到 `wallpaper-user-score`（唯一索引防重复），原子更新 `wallpaper-list` 的 `score` 和 `scoreCount` |
| `downloadWall(data)` | downloadWall | 记录下载 | `add` 到 `wallpaper-download-record`，`dbCmd.inc(1)` 更新 `downloadCount` |
| `getUserInfo(data)` | userInfo | 用户信息 | 聚合查询：该设备的下载记录数 + 评分记录数 |
| `getUserWallList(data)` | userWallList | 用户下载/评分历史 | 根据 `type` 关联查下载/评分记录，lookup 连 `wallpaper-list` |
| `getNewsList(data)` | wallNewsList | 公告列表 | 支持 `select:true` 仅置顶，分页查询 |
| `getNewsDetail(data)` | wallNewsDetail | 公告详情 | 单条查询 + `dbCmd.inc(1)` 更新 `view_count` |
| `searchWall(data)` | searchWall | 搜索壁纸 | 正则模糊匹配 `description` 和 `tabs`，分页返回 |

### 3.3 后台管理方法（CRUD）

> 当前阶段不做权限校验，后续接入 uni-id 后加上管理员身份验证。

#### 轮播图管理

| 方法名 | 功能 | 实现 |
|--------|------|------|
| `adminGetBanners(data)` | 获取全部轮播图 | 按 `sort` 排序，支持分页 |
| `adminCreateBanner(data)` | 新增轮播图 | 上传图片到云存储 → 写入数据库 |
| `adminUpdateBanner(data)` | 编辑轮播图 | `where({_id}).update(data)` |
| `adminDeleteBanner(data)` | 删除轮播图 | `where({_id}).remove()` + 删除云存储文件 |

#### 分类管理

| 方法名 | 功能 | 实现 |
|--------|------|------|
| `adminGetClassifies(data)` | 获取所有分类 | 按 `sort` 排序 |
| `adminCreateClassify(data)` | 新增分类 | 上传封面图 → 写入数据库 |
| `adminUpdateClassify(data)` | 编辑分类 | 更新字段，有新图则替换旧文件 |
| `adminDeleteClassify(data)` | 删除分类 | 删除封面图（检查关联壁纸） |

#### 壁纸管理

| 方法名 | 功能 | 实现 |
|--------|------|------|
| `adminGetWalls(data)` | 壁纸列表（含待审核/已下架） | 按 `classid`、`status` 筛选，分页 |
| `adminCreateWall(data)` | 新增壁纸 | 上传原图 + 生成缩略图 → 写入数据库 |
| `adminUpdateWall(data)` | 编辑壁纸 | 更新字段 |
| `adminDeleteWall(data)` | 删除壁纸 | 删除原图+缩略图 + 关联评分下载记录 |
| `adminBatchUpload(files)` | 批量上传 | 接收多文件，批量生成缩略图，批量写入 |
| `adminReviewWall(data)` | 审核壁纸 | 批量更新 `status` |
| `adminBatchImport(data)` | 批量导入 | `{ walls: [...] }` 批量写入（供爬虫调用） |

#### 公告管理

| 方法名 | 功能 | 实现 |
|--------|------|------|
| `adminGetNews(data)` | 获取所有公告 | 分页查询 |
| `adminCreateNews(data)` | 新增公告 | 支持 HTML 富文本 |
| `adminUpdateNews(data)` | 编辑公告 | `where({_id}).update(data)` |
| `adminDeleteNews(data)` | 删除公告 | `where({_id}).remove()` |

---

## 四、数据采集方案

壁纸图片来源不能手动一张张保存。推荐 Python 爬虫批量采集：

### 技术栈

- **requests** — HTTP 请求
- **Pillow** — 图片处理和缩略图生成（宽度 300px，webp 格式）
- **云对象 URL 化** — 通过 HTTP 调用 `adminBatchImport` 写入数据库

### 采集流程

```
[Python 爬虫]
  1. 从壁纸源站抓取元数据（wallhaven, unsplash, pexels）
  2. 下载原图
  3. 用 Pillow 生成缩略图（xxx_small.webp）
  4. 上传到云存储
  5. 调用 adminBatchImport 批量写入数据库
```

### 推荐壁纸源

| 来源 | 特点 | API |
|------|------|-----|
| **Wallhaven** | 动漫/游戏/风景丰富 | 免费 API |
| **Unsplash** | 高质量摄影 | 官方 API（限频） |
| **Pexels** | 免费图片视频 | 官方 API |
| **Bing 每日壁纸** | 每日更新高分辨率 | 直接解析 JSON |

### 图片存储规范

```
云存储目录：
wallpaper/
├── originals/          # 原图 {uuid}.jpg
├── thumbnails/         # 缩略图 {uuid}_small.webp
├── banners/            # 轮播图
├── classify/           # 分类封面
└── news/               # 公告插图
```

### 数据量目标

每个分类至少 50 张壁纸，保证前端列表有足够内容。

### 批量导入接口

```javascript
// adminBatchImport(data)
// 参数：{ walls: [{ classid, picurl, smallPicurl, nickname, description, tabs[], status }] }
// 供爬虫脚本 / 数据迁移使用
adminBatchImport(data) {
  const { walls } = data
  return db.collection('wallpaper-list').add(walls)
}
```

---

## 五、前端改造

### 5.1 删除
- `wallpaper/utils/request.js` — 不再需要 uni.request 封装

### 5.2 重写 API/apis.js

```javascript
const wallpaperObj = uniCloud.importObject('wallpaper')

export function apiGetBanner()          { return wallpaperObj.getBanner() }
export function apiGetDayRandom()       { return wallpaperObj.getRandomWall() }
export function apiGetClassify(data)    { return wallpaperObj.getClassify(data) }
export function apiGetClassifyDetail(d) { return wallpaperObj.getWallList(d) }
export function apiDetailWall(d)        { return wallpaperObj.getDetailWall(d) }
export function apiGetsetupScore(d)     { return wallpaperObj.setupScore(d) }
export function apiWriteDownload(d)     { return wallpaperObj.downloadWall(d) }
export function apiUserInfo(d)          { return wallpaperObj.getUserInfo(d) }
export function apiGetHistoryList(d)    { return wallpaperObj.getUserWallList(d) }
export function apiGetNotice(d)         { return wallpaperObj.getNewsList(d) }
export function apiNoticeDetail(d)      { return wallpaperObj.getNewsDetail(d) }
export function apiSearchData(d)        { return wallpaperObj.searchWall(d) }
```

### 5.3 兼容性保证

- 所有函数签名不变
- 返回值格式保持 `{ errCode: 0, data: [...] }`
- 8 个页面 Vue 文件**无需修改**

---

## 六、实施步骤

### 阶段一：修复 Schema + 部署数据库

- [ ] **1.1** 修复 `wallpaper-banner.schema.json` 结构（`sort`、`create_time` 不应嵌套在 `picurl` 内）
- [ ] **1.2** 将 `wallpaper-user-score` 和 `wallpaper-download-record` 的 `openid` 改为 `deviceId`（暂不依赖 uni-id）
- [ ] **1.3** 补充 `wallpaper-list` 索引（`classid+status`、`status+create_time`）
- [ ] **1.4** 上传所有 schema 到 uniCloud 服务空间
- [ ] **1.5** 配置云存储目录结构

### 阶段二：云对象 — 前端调用方法（12个）

- [ ] **2.1** `getBanner()` — 按 sort 升序查询
- [ ] **2.2** `getClassify(data)` — 支持 select / pageSize
- [ ] **2.3** `getWallList(data)` — classid + status=1 筛选分页
- [ ] **2.4** `getDetailWall(data)` — _id 单条
- [ ] **2.5** `getRandomWall()` — aggregate().sample(9)
- [ ] **2.6** `getNewsList(data)` — 分页 + select 置顶
- [ ] **2.7** `getNewsDetail(data)` — 单条 + inc 浏览计数
- [ ] **2.8** `searchWall(data)` — 正则模糊搜索分页
- [ ] **2.9** `setupScore(data)` — 唯一索引防重复 + 原子更新 score
- [ ] **2.10** `downloadWall(data)` — 记录 + inc 下载计数
- [ ] **2.11** `getUserInfo(data)` — 聚合统计
- [ ] **2.12** `getUserWallList(data)` — lookup 联表查历史

### 阶段三：前端接入

- [ ] **3.1** 重写 `API/apis.js`（改为 `uniCloud.importObject('wallpaper')`）
- [ ] **3.2** 删除 `utils/request.js`
- [ ] **3.3** 逐页测试：首页 → 分类 → 列表 → 预览 → 搜索 → 用户中心
- [ ] **3.4** 测试评分和下载流程

### 阶段四：后台管理方法（CRUD）

- [ ] **4.1** 轮播图 CRUD（4个方法）
- [ ] **4.2** 分类 CRUD（4个方法）
- [ ] **4.3** 壁纸 CRUD + 批量 + 审核（7个方法）
- [ ] **4.4** 公告 CRUD（4个方法）
- [ ] **4.5** `adminBatchImport(data)` — 批量导入（供爬虫用）

### 阶段五：数据采集

- [ ] **5.1** 编写 Python 爬虫脚本
- [ ] **5.2** 确定壁纸来源（建议 Wallhaven + Unsplash）
- [ ] **5.3** 每个分类至少采集 50 张
- [ ] **5.4** 准备轮播图 3-5 张
- [ ] **5.5** 准备公告数据（订阅更新、常见问题）

### 阶段六：上线前检查

- [ ] **6.1** 云对象超时处理
- [ ] **6.2** 数据库权限验证
- [ ] **6.3** 云存储权限验证
- [ ] **6.4** 全流程回归测试

---

## 七、后续规划

当前阶段完成后，按以下顺序逐步迭代：

### 7.1 接入 uni-id 用户体系

- 配置 `uni-config-center/uni-id/config.json`
- 微信小程序登录（`uni.login` + uni-id 登录）
- H5/App 端设备 ID 兜底
- `deviceId` → `openid` 迁移（评分和下载记录表）
- 用户收藏功能

### 7.2 uni-admin 后台管理系统

- 创建 uni-admin 项目关联服务空间
- 注册 schema，自动生成可视化 CRUD 界面
- 替代云对象的手动 admin 调用

### 7.3 功能增强

- 壁纸收藏
- 评论功能
- 上传壁纸（用户投稿）
- 消息推送（uni-push）
- 定时同步壁纸（云函数定时触发器）

---

## 工作量估算

| 阶段 | 内容 | 预估 |
|------|------|------|
| 阶段一 | 修复 Schema + 部署 | 0.5 天 |
| 阶段二 | 前端调用方法（12个） | 2 天 |
| 阶段三 | 前端接入验证 | 0.5 天 |
| 阶段四 | 后台管理 CRUD（20个） | 2 天 |
| 阶段五 | 数据采集 | 2 天 |
| 阶段六 | 上线检查 | 0.5 天 |
| **总计** | | **7.5 天** |

---

## 附录：原 API 对照表

| 原 API 路径 | 新云对象方法 |
|------------|------------|
| `homeBanner` | `getBanner()` |
| `randomWall` | `getRandomWall()` |
| `classify` | `getClassify(data)` |
| `wallList` | `getWallList(data)` |
| `detailWall` | `getDetailWall(data)` |
| `setupScore` | `setupScore(data)` |
| `downloadWall` | `downloadWall(data)` |
| `userInfo` | `getUserInfo(data)` |
| `userWallList` | `getUserWallList(data)` |
| `wallNewsList` | `getNewsList(data)` |
| `wallNewsDetail` | `getNewsDetail(data)` |
| `searchWall` | `searchWall(data)` |
