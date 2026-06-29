import { getToken } from '@/utils/auth.js'

function getWallpaperObj() {
  const wallpaperObj = uniCloud.importObject('wallpaper')
  if (!wallpaperObj) {
    throw new Error('uniCloud service space is not active. Re-link it in HBuilderX and run again.')
  }
  return wallpaperObj
}

function withToken(data = {}) {
  const token = getToken()
  return token ? Object.assign({}, data, { uniIdToken: token }) : data
}

// 首页轮播图
export function apiGetBanner() {
  return getWallpaperObj().getBanner(withToken())
}

// 随机9张壁纸
export function apiGetDayRandom() {
  return getWallpaperObj().getRandomWall(withToken())
}

// 壁纸分类
export function apiGetClassify(data = {}) {
  return getWallpaperObj().getClassify(withToken(data))
}

// 分类下壁纸列表
export function apiGetClassifyDetail(data = {}) {
  return getWallpaperObj().getWallList(withToken(data))
}

// 壁纸详情
export function apiDetailWall(data = {}) {
  return getWallpaperObj().getDetailWall(withToken(data))
}

// 壁纸评分
export function apiGetsetupScore(data = {}) {
  return getWallpaperObj().setupScore(withToken(data))
}

// 记录下载
export function apiWriteDownload(data = {}) {
  return getWallpaperObj().downloadWall(withToken(data))
}

// 用户信息
export function apiUserInfo(data = {}) {
  return getWallpaperObj().getUserInfo(withToken(data))
}

// 用户下载/评分历史
export function apiGetHistoryList(data = {}) {
  return getWallpaperObj().getUserWallList(withToken(data))
}

// 公告列表
export function apiGetNotice(data = {}) {
  return getWallpaperObj().getNewsList(withToken(data))
}

// 公告详情
export function apiNoticeDetail(data = {}) {
  return getWallpaperObj().getNewsDetail(withToken(data))
}

// 搜索壁纸
export function apiSearchData(data = {}) {
  return getWallpaperObj().searchWall(withToken(data))
}

// ============================================================
//  v2.0 新增：用户体系
// ============================================================

// 微信登录
export function apiLogin(code) {
  return getWallpaperObj().userLogin({ code })
}

// 获取当前用户微信信息（昵称、头像）
export function apiGetUserProfile() {
  return getWallpaperObj().getUserProfile(withToken())
}

// 校验登录状态
export function apiCheckToken(token) {
  return getWallpaperObj().checkToken({ token })
}

// ============================================================
//  v2.0 新增：互动功能
// ============================================================

// ---- 收藏 ----
export function apiToggleFavorite(wallId) {
  return getWallpaperObj().toggleFavorite(withToken({ wallId }))
}
export function apiIsFavorited(wallIds) {
  return getWallpaperObj().isFavorited(withToken({ wallIds }))
}

// ---- 评论 ----
export function apiAddComment(wallId, content) {
  return getWallpaperObj().addComment(withToken({ wallId, content }))
}
export function apiGetComments(wallId, pageNum = 1, pageSize = 10) {
  return getWallpaperObj().getComments(withToken({ wallId, pageNum, pageSize }))
}
export function apiDeleteComment(commentId) {
  return getWallpaperObj().deleteComment(withToken({ commentId }))
}

// ---- 推荐 ----
export function apiGetRecommendWalls() {
  return getWallpaperObj().getRecommendWalls(withToken())
}

// ---- 投稿 ----
export function apiSubmitUpload(data) {
  return getWallpaperObj().submitUpload(withToken(data))
}
export function apiGetMyUploads(pageNum = 1, pageSize = 10) {
  return getWallpaperObj().getMyUploads(withToken({ pageNum, pageSize }))
}

// ---- 搜索增强 ----
export function apiGetHotSearchKeywords() {
  return getWallpaperObj().getHotSearchKeywords(withToken())
}
export function apiGetSearchHistory() {
  return getWallpaperObj().getSearchHistory(withToken())
}
export function apiClearSearchHistory() {
  return getWallpaperObj().clearSearchHistory(withToken())
}
