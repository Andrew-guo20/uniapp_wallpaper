/**
 * 用户认证工具 — Token 管理 + 登录状态
 * v2.0 接入 uni-id 微信登录后使用
 */

const TOKEN_KEY = 'uni_id_token'
const USER_KEY = 'user_info'

/**
 * 保存登录信息
 */
export function saveLogin(token, userInfo = {}) {
	uni.setStorageSync(TOKEN_KEY, token)
	uni.setStorageSync(USER_KEY, userInfo)
}

/**
 * 获取 token
 */
export function getToken() {
	return uni.getStorageSync(TOKEN_KEY) || ''
}

/**
 * 获取缓存的用户信息
 */
export function getUserInfo() {
	return uni.getStorageSync(USER_KEY) || {}
}

/**
 * 是否已登录
 */
export function isLoggedIn() {
	return !!getToken()
}

/**
 * 清除登录状态（退出登录）
 */
export function logout() {
	uni.removeStorageSync(TOKEN_KEY)
	uni.removeStorageSync(USER_KEY)
}

/**
 * 更新用户信息缓存
 */
export function updateUserInfo(info) {
	const current = getUserInfo()
	uni.setStorageSync(USER_KEY, Object.assign(current, info))
}
