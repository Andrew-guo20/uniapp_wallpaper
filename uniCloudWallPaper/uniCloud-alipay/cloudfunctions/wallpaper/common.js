/**
 * 公共工具模块 — 云对象共享函数
 * v2.0 模块化拆分
 */
const db = uniCloud.database()
const dbCmd = db.command
const uniIdCommon = require('uni-id-common')

/**
 * 合并 HTTP 请求参数
 * 云对象 URL 化时，query string 参数会被自动解析到 data 中，
 * 但 POST JSON body 需要手动从 getHttpInfo 中解析。
 */
function mergeData(data) {
	const httpInfo = this.getHttpInfo ? this.getHttpInfo() : null
	let bodyData = {}
	if (httpInfo && httpInfo.body) {
		try {
			bodyData = typeof httpInfo.body === 'string'
				? JSON.parse(httpInfo.body)
				: httpInfo.body
		} catch (e) {}
	}
	return Object.assign({}, bodyData, data)
}

/**
 * 包装分页参数
 */
function parsePagination(data = {}, defaultPageSize = 12) {
	const pageNum = Math.max(1, parseInt(data.pageNum) || 1)
	const pageSize = Math.min(100, Math.max(1, parseInt(data.pageSize) || defaultPageSize))
	const skip = (pageNum - 1) * pageSize
	return { pageNum, pageSize, skip }
}

/**
 * 简易敏感词检测（本地兜底，生产环境应接入微信 msgSecCheck）
 */
const SENSITIVE_WORDS = []

function hasSensitiveWord(text) {
	const lower = (text || '').toLowerCase()
	return SENSITIVE_WORDS.some(word => lower.includes(word.toLowerCase()))
}

module.exports = {
	db,
	dbCmd,
	uniIdCommon,
	mergeData,
	parsePagination,
	hasSensitiveWord
}
