# UniCloud 壁纸项目后端开发计划

> 基于 `wallpaper` 前端项目，使用 uniCloud 自建 API 接口

---

## 一、项目现状分析

### 当前架构

前端 `wallpaper/` 项目使用了一个第三方 API：

```
BASE_URL = https://tea.qingnian8.com/api/bizhi/
access-key = 244576
```

通过 `utils/request.js` 封装的 `uni.request()` 发起 HTTP 请求，所有接口返回 `{ errCode: 0, data: [...] }` 格式。

### 需要替换的 API 接口

| 原接口 | 方法 | 功能 | 调用页面 |
|---|---|---|---|
| `homeBanner` | GET | 首页轮播图 | index.vue |
| `randomWall` | GET | 每日推荐随机9张壁纸 | index.vue |
| `classify` | GET | 获取壁纸分类 | index.vue, classify.vue |
| `wallList` | GET | 分类下壁纸列表（分页） | classlist.vue |
| `detailWall` | GET | 单张壁纸详情 | preview.vue（分享入口） |
| `setupScore` | GET | 壁纸评分 | preview.vue |
| `downloadWall` | GET | 壁纸下载计数 | preview.vue |
| `userInfo` | GET | 当前用户信息 | user.vue |
| `userWallList` | GET | 用户评分/下载历史（分页） | classlist.vue |
| `wallNewsList` | GET | 公告列表 | index.vue |
| `wallNewsDetail` | GET | 公告详情 | notice/detail.vue |
| `searchWall` | GET | 搜索壁纸（分页） | search.vue |

现有骨架代码位于 `uniCloudWallPaper/` 目录，已包含：
- `uniCloud-alipay/cloudfunctions/wallpaper/` — 空壳云对象
- `uniCloud-alipay/database/user.schema.json` — 基础 schema
- `uni_modules/uni-id-common/` — 用户认证模块

---

## 二、数据库设计（共6张表）

### 1. `wallpaper-banner` — 轮播图表

```javascript
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
    "_id":         { "description": "ID，系统自动生成" },
    "picurl":      { "bsonType": "string", "description": "图片URL" },
    "target":      { "bsonType": "string", "description": "跳转类型: miniProgram / page", "enum": ["miniProgram", "page"] },
    "url":         { "bsonType": "string", "description": "跳转地址（page传classid，miniProgram传路径）" },
    "appid":       { "bsonType": "string", "description": "小程序appid" },
    "sort":        { "bsonType": "int", "description": "排序序号，升序排列" },
    "create_time": { "bsonType": "timestamp", "description": "创建时间" }
  }
}
```

### 2. `wallpaper-classify` — 壁纸分类表

```javascript
{
  "bsonType": "object",
  "required": ["name", "picurl"],
  "permission": { "read": true, "create": false, "update": false, "delete": false },
  "properties": {
    "_id":         { "description": "分类ID" },
    "name":        { "bsonType": "string", "description": "分类名称" },
    "picurl":      { "bsonType": "string", "description": "分类封面图URL" },
    "updateTime":  { "bsonType": "timestamp", "description": "最后更新时间（用于显示\"X天前更新\"）" },
    "sort":        { "bsonType": "int", "description": "排序序号" }
  }
}
```

### 3. `wallpaper-list` — 壁纸详情表（核心表）

```javascript
{
  "bsonType": "object",
  "required": ["classid", "smallPicurl", "picurl", "status"],
  "permission": { "read": true, "create": false, "update": false, "delete": false },
  "properties": {
    "_id":           { "description": "壁纸ID" },
    "classid":       { "bsonType": "string", "description": "关联 wallpaper-classify._id" },
    "smallPicurl":   { "bsonType": "string", "description": "缩略图URL（_small.webp）" },
    "picurl":        { "bsonType": "string", "description": "原图大图URL" },
    "nickname":      { "bsonType": "string", "description": "发布者名称" },
    "score":         { "bsonType": "double", "description": "综合评分(0-5，允许半星)" },
    "description":   { "bsonType": "string", "description": "壁纸摘要描述" },
    "tabs":          { "bsonType": "array", "description": "标签数组", "array": [{ "bsonType": "string" }] },
    "downloadCount": { "bsonType": "int", "description": "累计下载次数" },
    "scoreCount":    { "bsonType": "int", "description": "评分人数" },
    "create_time":   { "bsonType": "timestamp", "description": "上传时间" },
    "status":        { "bsonType": "int", "description": "状态: 0=待审核 1=已上架 2=已下架", "enum": [0, 1, 2] }
  }
}
```

### 4. `wallpaper-news` — 公告表

```javascript
{
  "bsonType": "object",
  "required": ["title", "content"],
  "permission": { "read": true, "create": false, "update": false, "delete": false },
  "properties": {
    "_id":          { "description": "公告ID" },
    "title":        { "bsonType": "string", "description": "公告标题" },
    "content":      { "bsonType": "string", "description": "公告内容（HTML富文本）" },
    "author":       { "bsonType": "string", "description": "作者" },
    "select":       { "bsonType": "bool", "description": "是否置顶" },
    "view_count":   { "bsonType": "int", "description": "阅读次数" },
    "publish_date": { "bsonType": "timestamp", "description": "发布时间" },
    "create_time":  { "bsonType": "timestamp", "description": "创建时间" }
  }
}
```

### 5. `wallpaper-user-score` — 用户评分记录表

```javascript
{
  "bsonType": "object",
  "required": ["wallId", "openid", "userScore"],
  "permission": { "read": true, "create": true, "update": false, "delete": false },
  "properties": {
    "_id":         { "description": "系统自动生成" },
    "wallId":      { "bsonType": "string", "description": "壁纸ID，关联 wallpaper-list._id" },
    "openid":      { "bsonType": "string", "description": "用户标识（openid / 设备ID）" },
    "userScore":   { "bsonType": "double", "description": "用户评分(0-5)" },
    "create_time": { "bsonType": "timestamp", "description": "评分时间" }
  },
  "index": [
    { "name": "unique_wall_user", "unique": true, "fieldList": { "wallId": 1, "openid": 1 } }
  ]
}
```

### 6. `wallpaper-download-record` — 下载记录表

```javascript
{
  "bsonType": "object",
  "required": ["wallId", "openid"],
  "permission": { "read": true, "create": true, "update": false, "delete": false },
  "properties": {
    "_id":          { "description": "系统自动生成" },
    "wallId":       { "bsonType": "string", "description": "壁纸ID，关联 wallpaper-list._id" },
    "openid":       { "bsonType": "string", "description": "用户标识" },
    "create_time":  { "bsonType": "timestamp", "description": "下载时间" }
  },
  "index": [
    { "name": "idx_wall_download", "fieldList": { "wallId": 1, "openid": 1 } }
  ]
}
```

---

## 三、云对象设计

**云对象文件**: `uniCloud-alipay/cloudfunctions/wallpaper/index.obj.js`

### 整体结构

```javascript
const db = uniCloud.database();
const dbCmd = db.command;
const $$ = dbCmd.aggregate;

module.exports = {
  _before: function () {
    // 通用预处理器：获取用户标识
    const clientInfo = this.getClientInfo();
    this.openid = clientInfo.uniIdToken
      ? this.getUniIdToken()?.uid
      : clientInfo.deviceId || 'anonymous';
  },

  // ===== 首页 =====
  async getBanner() { /* 查 wallpaper-banner，按 sort 升序 */ },
  async getRandomWall() { /* aggregate.sample(9) 随机取9张 */ },
  async getClassify(params) { /* select=true取前6条，否则分页 */ },

  // ===== 分类壁纸 =====
  async getWallList(params) { /* 按classid分页查询 */ },
  async getDetailWall(params) { /* doc(id) 查单条 */ },

  // ===== 用户交互 =====
  async setupScore(params) { /* 写入评分 + 重算均分 */ },
  async downloadWall(params) { /* 写入下载记录 + 累加计数 */ },

  // ===== 用户中心 =====
  async getUserInfo() { /* 统计下载数、评分数 */ },
  async getUserWallList(params) { /* 联表查询下载/评分历史 */ },

  // ===== 公告 =====
  async getNewsList(params) { /* 置顶公告 或 全部分页 */ },
  async getNewsDetail(params) { /* 查单条 + view_count+1 */ },

  // ===== 搜索 =====
  async searchWall(params) { /* 多字段正则模糊匹配 + 分页 */ },
}
```

### 各方法关键说明

| 方法 | 核心逻辑 |
|---|---|
| `getBanner` | `db.collection('wallpaper-banner').orderBy('sort', 'asc').get()` |
| `getRandomWall` | `.aggregate().match({status:1}).sample({size:9}).end()` |
| `getClassify` | `select=true` 仅取6条；否则 `skip+limit` 分页 |
| `getWallList` | `where({classid, status:1}).orderBy('create_time','desc').skip().limit()` |
| `getDetailWall` | `doc(id).get()` |
| `setupScore` | 唯一索引防重复评分 → 插入记录 → 聚合重算 `wallpaper-list.score` |
| `downloadWall` | 插入 `download-record` + `wallpaper-list.doc(wallId).update({downloadCount: dbCmd.inc(1)})` |
| `getUserInfo` | 统计当前 openid 的 `download-record` 和 `user-score` 数量 |
| `getUserWallList` | `lookup` 联表 `wallpaper-list`，按 type=download/score 过滤 |
| `getNewsList` | `select=true` 只取置顶公告；否则全部分页 |
| `getNewsDetail` | 查单条 + `view_count: dbCmd.inc(1)` |
| `searchWall` | `dbCmd.or([{description: RegExp(keyword)}, {tabs: keyword}])` |

---

## 四、云存储目录结构

```
wallpaper/              # 根目录
  banners/              # 轮播图图片
  classify/             # 分类封面图
  originals/            # 原图大图（对应 picurl 字段）
  thumbnails/           # 缩略图（对应 smallPicurl 字段）
  news/                 # 公告富文本中的插图
```

**缩略图命名约定**：原图 `xxx.jpg` → 缩略图 `xxx_small.webp`，与前端 `preview.vue` 中的替换逻辑保持一致：

```javascript
picurl: item.smallPicurl.replace('_small.webp', '.jpg')
```

---

## 五、用户标识方案

| 运行平台 | 认证方案 |
|---|---|
| 微信小程序 | uni-id + 微信登录 → openid |
| H5 | 设备 UUID（`uni.getDeviceInfo().deviceId`） |
| App | 设备 UUID |

在云对象 `_before` 中获取：

```javascript
_before() {
  const clientInfo = this.getClientInfo();
  this.openid = clientInfo.uniIdToken
    ? this.getUniIdToken()?.uid
    : clientInfo.deviceId || 'anonymous';
}
```

---

## 六、前端改造要点

### 6.1 删除旧 HTTP 请求层

- **删除文件**: `utils/request.js`
- **修改文件**: `API/apis.js`，改为调用云对象

### 6.2 新的 `API/apis.js`

```javascript
const wallpaperObj = uniCloud.importObject('wallpaper')

export function apiGetBanner()           { return wallpaperObj.getBanner() }
export function apiGetDayRandom()        { return wallpaperObj.getRandomWall() }
export function apiGetClassify(d)        { return wallpaperObj.getClassify(d) }
export function apiGetClassifyDetail(d)  { return wallpaperObj.getWallList(d) }
export function apiGetsetupScore(d)      { return wallpaperObj.setupScore(d) }
export function apiWriteDownload(d)      { return wallpaperObj.downloadWall(d) }
export function apiDetailWall(d)         { return wallpaperObj.getDetailWall(d) }
export function apiUserInfo(d)           { return wallpaperObj.getUserInfo() }
export function apiGetHistoryList(d)     { return wallpaperObj.getUserWallList(d) }
export function apiGetNotice(d)          { return wallpaperObj.getNewsList(d) }
export function apiNoticeDetail(d)       { return wallpaperObj.getNewsDetail(d) }
export function apiSearchData(d)         { return wallpaperObj.searchWall(d) }
```

> **保持返回格式兼容**：云对象方法统一返回 `{ errCode: 0, data: [...] }`，前端各页面无需修改。

---

## 七、实施步骤（推荐顺序）

```
Step 1 — 初始化 uniCloud 环境
  在 HBuilderX 中打开 wallpaper 项目
  右键项目 -> 创建uniCloud开发环境 -> 选择阿里云/腾讯云
  关联或创建 uniCloud 服务空间
  上传 uni-id-common 公共模块

Step 2 — 创建数据库表（schema）
  在 uniCloud/database/ 目录创建6个 .schema.json 文件
  上传 schema（或通过 JQL 编辑器运行创建语句）

Step 3 — 编写云对象
  完善 uniCloud-alipay/cloudfunctions/wallpaper/index.obj.js
  写入全部12个公开方法

Step 4 — 上传云函数
  右键 wallpaper 云函数 -> 上传部署

Step 5 — 填充测试数据
  使用 JQL 查询器插入测试数据：
    - 3~5 条轮播图
    - 5~8 个分类
    - 每个分类 10~20 张壁纸
    - 2~3 条公告

Step 6 — 改造前端 API 层
  修改 API/apis.js 改为调用云对象
  删除 utils/request.js
  运行测试所有页面

Step 7 — 上线前检查
  确认 DB schema 的 permission 已按需配置
  确认云函数异常处理和错误返回
  测试分页、搜索、评分、下载等核心功能
```

---

## 八、常见问题与注意事项

1. **云函数超时**：阿里云 uniCloud 云函数默认执行超时 10 秒，复杂聚合可手动设置 `timeout: 30`
2. **数据库查询上限**：单次查询默认最多返回 100 条，分页时注意 `skip + limit` 不要超过这个限制
3. **文件上传**：壁纸图片通过 `uniCloud.uploadFile()` 上传到云存储，获取返回的 URL 存入数据库
4. **权限管理**：开发阶段 schema 中的 `permission` 可以全开 `true`，上线前再严格配置
5. **数据迁移**：如果原来有壁纸数据需要迁移，写一个云函数脚本从旧接口拉取数据后批量写入 uniCloud 数据库
6. **前端无需大改**：`apis.js` 是唯一的改动点，页面逻辑基本不动
