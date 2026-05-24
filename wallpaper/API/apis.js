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
