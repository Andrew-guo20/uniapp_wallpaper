// 果果壁纸 — 云对象主入口
// v2.0 模块化架构：功能拆分到独立模块，index.obj.js 负责合并和生命周期
//
// 模块结构：
//   common.js              — 公共工具（db, dbCmd, uniIdCommon, mergeData, 分页）
//   wallpaper-core.js      — 壁纸/轮播图/分类/公告/搜索/评分/下载（12 方法）
//   wallpaper-user.js      — 用户统计/历史/登录/迁移
//   wallpaper-favorite.js  — 收藏（add/remove/toggle/isFavorited）        [v2.0 NEW]
//   wallpaper-comment.js   — 评论（add/get/delete）                       [v2.0 NEW]
//   wallpaper-recommend.js — 个性化推荐                                   [v2.0 NEW]
//   wallpaper-upload.js    — 用户投稿（submit/getMyUploads）              [v2.0 NEW]
//   wallpaper-search.js    — 搜索增强（热门词/搜索历史）                   [v2.0 NEW]
//   wallpaper-admin.js     — 后台管理（轮播图/分类/壁纸/公告 CRUD + 上传 + 批量导入 + 统计）

const wallpaperCore = require('./wallpaper-core')
const wallpaperUser = require('./wallpaper-user')
const wallpaperFavorite = require('./wallpaper-favorite')
const wallpaperComment = require('./wallpaper-comment')
const wallpaperRecommend = require('./wallpaper-recommend')
const wallpaperUpload = require('./wallpaper-upload')
const wallpaperSearch = require('./wallpaper-search')
const wallpaperAdmin = require('./wallpaper-admin')

module.exports = {
	_before: function () {
		const clientInfo = this.getClientInfo()
		this.uid = clientInfo.uid || ''
		this.deviceId = clientInfo.deviceId || 'anonymous'
	},

	// ---- 壁纸核心（12 个用户端方法） ----
	getBanner:      wallpaperCore.getBanner,
	getRandomWall:  wallpaperCore.getRandomWall,
	getClassify:    wallpaperCore.getClassify,
	getWallList:    wallpaperCore.getWallList,
	getDetailWall:  wallpaperCore.getDetailWall,
	setupScore:     wallpaperCore.setupScore,
	downloadWall:   wallpaperCore.downloadWall,
	getNewsList:    wallpaperCore.getNewsList,
	getNewsDetail:  wallpaperCore.getNewsDetail,
	searchWall:     wallpaperCore.searchWall,

	// ---- 用户（统计/历史/登录/迁移） ----
	getUserInfo:         wallpaperUser.getUserInfo,
	getUserWallList:     wallpaperUser.getUserWallList,
	userLogin:           wallpaperUser.userLogin,
	getUserProfile:      wallpaperUser.getUserProfile,
	checkToken:          wallpaperUser.checkToken,
	migrateDeviceToUid:  wallpaperUser.migrateDeviceToUid,

	// ---- 收藏 [NEW] ----
	addFavorite:      wallpaperFavorite.addFavorite,
	removeFavorite:   wallpaperFavorite.removeFavorite,
	toggleFavorite:   wallpaperFavorite.toggleFavorite,
	isFavorited:      wallpaperFavorite.isFavorited,

	// ---- 评论 [NEW] ----
	addComment:       wallpaperComment.addComment,
	getComments:      wallpaperComment.getComments,
	deleteComment:    wallpaperComment.deleteComment,

	// ---- 推荐 [NEW] ----
	getRecommendWalls: wallpaperRecommend.getRecommendWalls,

	// ---- 投稿 [NEW] ----
	submitUpload:     wallpaperUpload.submitUpload,
	getMyUploads:     wallpaperUpload.getMyUploads,

	// ---- 搜索增强 [NEW] ----
	getHotSearchKeywords: wallpaperSearch.getHotSearchKeywords,
	getSearchHistory:     wallpaperSearch.getSearchHistory,
	clearSearchHistory:   wallpaperSearch.clearSearchHistory,

	// ---- 后台管理（轮播图） ----
	adminGetBanners:    wallpaperAdmin.adminGetBanners,
	adminCreateBanner:  wallpaperAdmin.adminCreateBanner,
	adminUpdateBanner:  wallpaperAdmin.adminUpdateBanner,
	adminDeleteBanner:  wallpaperAdmin.adminDeleteBanner,

	// ---- 后台管理（分类） ----
	adminGetClassifies:   wallpaperAdmin.adminGetClassifies,
	adminCreateClassify:  wallpaperAdmin.adminCreateClassify,
	adminUpdateClassify:  wallpaperAdmin.adminUpdateClassify,
	adminDeleteClassify:  wallpaperAdmin.adminDeleteClassify,

	// ---- 后台管理（壁纸） ----
	adminGetWalls:     wallpaperAdmin.adminGetWalls,
	adminCreateWall:   wallpaperAdmin.adminCreateWall,
	adminUpdateWall:   wallpaperAdmin.adminUpdateWall,
	adminDeleteWall:   wallpaperAdmin.adminDeleteWall,
	adminReviewWall:   wallpaperAdmin.adminReviewWall,
	adminGetWallStats: wallpaperAdmin.adminGetWallStats,
	adminUpload:       wallpaperAdmin.adminUpload,
	adminBatchImport:  wallpaperAdmin.adminBatchImport,

	// ---- 后台管理（公告） ----
	adminGetNews:    wallpaperAdmin.adminGetNews,
	adminCreateNews: wallpaperAdmin.adminCreateNews,
	adminUpdateNews: wallpaperAdmin.adminUpdateNews,
	adminDeleteNews: wallpaperAdmin.adminDeleteNews
}
