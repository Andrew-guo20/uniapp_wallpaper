const wallpaperObj = uniCloud.importObject('wallpaper')

// 首页轮播图
export function apiGetBanner() {
  return wallpaperObj.getBanner()
}

// 随机9张壁纸
export function apiGetDayRandom() {
  return wallpaperObj.getRandomWall()
}

// 壁纸分类
export function apiGetClassify(data = {}) {
  return wallpaperObj.getClassify(data)
}

// 分类下壁纸列表
export function apiGetClassifyDetail(data = {}) {
  return wallpaperObj.getWallList(data)
}

// 壁纸详情
export function apiDetailWall(data = {}) {
  return wallpaperObj.getDetailWall(data)
}

// 壁纸评分
export function apiGetsetupScore(data = {}) {
  return wallpaperObj.setupScore(data)
}

// 记录下载
export function apiWriteDownload(data = {}) {
  return wallpaperObj.downloadWall(data)
}

// 用户信息
export function apiUserInfo(data = {}) {
  return wallpaperObj.getUserInfo(data)
}

// 用户下载/评分历史
export function apiGetHistoryList(data = {}) {
  return wallpaperObj.getUserWallList(data)
}

// 公告列表
export function apiGetNotice(data = {}) {
  return wallpaperObj.getNewsList(data)
}

// 公告详情
export function apiNoticeDetail(data = {}) {
  return wallpaperObj.getNewsDetail(data)
}

// 搜索壁纸
export function apiSearchData(data = {}) {
  return wallpaperObj.searchWall(data)
}

// ============================================================
//  v2.0 新增：用户体系
// ============================================================

// 微信登录
export function apiLogin(code) {
  return wallpaperObj.userLogin({ code })
}

// 获取当前用户微信信息（昵称、头像）
export function apiGetUserProfile() {
  return wallpaperObj.getUserProfile()
}

// 校验登录状态
export function apiCheckToken(token) {
  return wallpaperObj.checkToken({ token })
}

// ============================================================
//  v2.0 新增：互动功能
// ============================================================

// ---- 收藏 ----
export function apiToggleFavorite(wallId) {
  return wallpaperObj.toggleFavorite({ wallId })
}
export function apiIsFavorited(wallIds) {
  return wallpaperObj.isFavorited({ wallIds })
}

// ---- 评论 ----
export function apiAddComment(wallId, content) {
  return wallpaperObj.addComment({ wallId, content })
}
export function apiGetComments(wallId, pageNum = 1, pageSize = 10) {
  return wallpaperObj.getComments({ wallId, pageNum, pageSize })
}
export function apiDeleteComment(commentId) {
  return wallpaperObj.deleteComment({ commentId })
}

// ---- 推荐 ----
export function apiGetRecommendWalls() {
  return wallpaperObj.getRecommendWalls()
}

// ---- 投稿 ----
export function apiSubmitUpload(data) {
  return wallpaperObj.submitUpload(data)
}
export function apiGetMyUploads(pageNum = 1, pageSize = 10) {
  return wallpaperObj.getMyUploads({ pageNum, pageSize })
}

// ---- 搜索增强 ----
export function apiGetHotSearchKeywords() {
  return wallpaperObj.getHotSearchKeywords()
}
export function apiGetSearchHistory() {
  return wallpaperObj.getSearchHistory()
}
export function apiClearSearchHistory() {
  return wallpaperObj.clearSearchHistory()
}
