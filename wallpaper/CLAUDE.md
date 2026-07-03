# wallpaper/ — 前端小程序

This file provides guidance to Claude Code when working in the `wallpaper/` sub-project.

## 定位

果果壁纸前端 — uni-app Vue3 跨端小程序，支持微信小程序和 H5。面向终端用户，负责 UI 展示和交互。

## 开发技能

涉及页面 UI 和组件设计时，使用 `/frontend-design` 技能获取设计指导：
- 新页面布局和视觉风格确定
- 组件交互细节（收藏按钮、评论面板、评分弹窗等）
- 确保不套用模板化样式，保持视觉差异性

## 开发进度

> 同步自根 [CLAUDE.md](../CLAUDE.md)

| 状态 | 说明 |
|------|------|
| **当前阶段** | 阶段一~四 ✅ → 阶段五 测试通过 |
| **已完成** | 登录/收藏/评论/推荐/投稿/推送监听，全链路已测试 |
| **下一步** | 性能优化 + 微信小程序审核提交 |
| **新增文件** | `pages/login/login.vue`、`pages/upload/upload.vue`、`utils/auth.js` |
| **改造文件** | `App.vue`、`pages/user/user.vue`、`pages/preview/preview.vue`、`pages/search/search.vue`、`pages/index/index.vue`、`API/apis.js`、`pages.json` |

## 目录结构

```
wallpaper/
├── API/apis.js                   # 统一 API 层（12 个接口 → 云对象调用）
├── App.vue                       # 根组件（全局生命周期 + 登录态检查）
├── main.js                       # 入口文件
├── pages.json                    # 路由配置 + TabBar（3 个 tab）
├── manifest.json                 # 项目配置（微信 appid、uniCloud 模式）
├── uni.scss                      # 全局 SCSS 变量 + 主题
├── index.html                    # H5 入口
├── pages/                        # 页面
│   ├── index/index.vue           #   首页（轮播图 + 每日推荐 + 分类精选 + 公告）
│   ├── classify/classify.vue     #   分类页（10 分类网格）
│   ├── classlist/classlist.vue   #   列表页（分类壁纸 + 触底分页 + 历史记录）
│   ├── preview/preview.vue       #   预览页（全屏轮播 + 评分 + 下载 + 信息弹窗）
│   ├── search/search.vue         #   搜索页（关键词搜索 + 历史 + 热门标签）
│   ├── notice/notice.vue         #   公告列表（空壳，待开发）
│   ├── notice/detail.vue         #   公告详情（mp-html 富文本渲染）
│   └── user/user.vue             #   用户中心（统计 + 功能入口）
├── components/                   # 公共组件
│   ├── common-title/             #   通用标题栏
│   ├── custom-nav-bar/           #   自定义导航栏（状态栏适配）
│   └── theme-item/               #   分类卡片（图片 + 遮罩 + 时间）
├── common/images/                # 本地图片素材
├── common/style/                 # 全局样式
├── utils/
│   ├── common.js                 #   时间格式化、页面跳转
│   └── system.js                 #   系统信息（状态栏/导航栏高度）
├── static/                       # 静态资源（logo、tab 图标）
├── uni_modules/                  # 14 个 uni-app 插件
└── uniCloud-alipay/              # 云服务配置（从 uniCloudWallPaper 同步）
```

## 页面数据流

```
Vue Page → API/apis.js → uniCloud.importObject('wallpaper').xxx() → 云对象 → 数据库
```

- 所有页面通过 `API/apis.js` 统一调用后端，不直接操作数据库
- 页面间传参：首页/列表页 → 预览页通过 `uni.setStorageSync('storageClassList', list)`
- 分享进入：URL 带 `id` 参数，预览页调用 `apiDetailWall({id})`

## API 层（apis.js）

```javascript
const wallpaperObj = uniCloud.importObject('wallpaper')

// 12 个现有 API
apiGetBanner()          → wallpaperObj.getBanner()
apiGetDayRandom()       → wallpaperObj.getRandomWall()
apiGetClassify(data)    → wallpaperObj.getClassify(data)
apiGetClassifyDetail(d) → wallpaperObj.getWallList(d)
apiDetailWall(d)        → wallpaperObj.getDetailWall(d)
apiGetsetupScore(d)     → wallpaperObj.setupScore(d)
apiWriteDownload(d)     → wallpaperObj.downloadWall(d)
apiUserInfo(d)          → wallpaperObj.getUserInfo(d)
apiGetHistoryList(d)    → wallpaperObj.getUserWallList(d)
apiGetNotice(d)         → wallpaperObj.getNewsList(d)
apiNoticeDetail(d)      → wallpaperObj.getNewsDetail(d)
apiSearchData(d)        → wallpaperObj.searchWall(d)

// 待新增（阶段一~三）
apiLogin()              → 微信登录
apiGetUserProfile()     → 获取用户信息
apiAddFavorite(d)       → 收藏
apiRemoveFavorite(d)    → 取消收藏
apiToggleFavorite(d)    → 智能切换收藏
apiIsFavorited(d)       → 批量查询收藏状态
apiAddComment(d)        → 评论
apiGetComments(d)       → 评论列表
apiDeleteComment(d)     → 删除评论
apiSubmitUpload(d)      → 用户投稿
apiGetMyUploads(d)      → 我的投稿
apiGetRecommendWalls()  → 个性化推荐
```

## 关键约定

- **API 签名不可变**：页面已有代码依赖现有接口，只能新增方法，不能修改已有签名
- **返回值格式**：`{ errCode: 0, data: ... }` 或 `{ errCode: 400, errMsg: ... }`
- **图片加载策略**：列表用 `smallPicurl`（缩略图 300px webp），预览页先缩略图后原图
- **分页**：页面 `onReachBottom` 触底加载，`pageNum++` 追加数据
- **导航栏**：`navigationStyle: "custom"`，所有页面使用 `custom-nav-bar` 组件
- **微信 AppID**：`wxedf7c9be266ef39c`（manifest.json mp-weixin 配置）

## 页面改造清单（v2.0.0）

| 页面 | 改造类型 | 内容 |
|------|---------|------|
| `pages/login/login.vue` | **新增** | 微信授权一键登录 |
| `pages/user/user.vue` | 改造 | 微信头像昵称 + 收藏入口 + 投稿入口 |
| `pages/preview/preview.vue` | 改造 | 底部栏加 ❤️ 收藏 + 💬 评论入口 |
| `pages/classlist/classlist.vue` | 改造 | 支持 `type=favorites` 展示收藏列表 |
| `pages/favorites/favorites.vue` | **新增** | 收藏列表页 |
| `pages/upload/upload.vue` | **新增** | 用户投稿页（选图 + 填写信息） |
| `pages/search/search.vue` | 改造 | 云端搜索历史 + 热门搜索词 |
| `App.vue` | 改造 | 启动时登录态检查 |
| `API/apis.js` | 改造 | 新增 11 个 API 方法 |
