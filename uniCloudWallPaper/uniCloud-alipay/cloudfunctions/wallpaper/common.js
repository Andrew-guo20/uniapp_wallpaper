/**
 * 公共工具模块 — 云对象共享函数
 * v2.0 模块化拆分
 */
const db = uniCloud.database()
const dbCmd = db.command
let uniIdCommon = {}
try { uniIdCommon = require('uni-id-common') } catch(e) {}

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

// ============================================================
//  微信内容安全 API（msgSecCheck / imgSecCheck）
// ============================================================

/** uni-id 配置缓存 */
let uniConfigCenter = null
try { uniConfigCenter = require('uni-config-center') } catch(e) {}

/** access_token 缓存（7200s 有效期，提前 300s 刷新） */
let accessTokenCache = { token: '', expiresAt: 0 }

function getUniIdOAuth() {
	if (!uniConfigCenter) return null
	try {
		const config = uniConfigCenter({ pluginId: 'uni-id' }).config()
		const conf = Array.isArray(config)
			? (config.find(item => item.dcloudAppid === '__UNI__A72DEF1') ||
			   config.find(item => item.isDefaultConfig) ||
			   config[0] || {})
			: config
		const oauth = conf['mp-weixin'] && conf['mp-weixin'].oauth && conf['mp-weixin'].oauth.weixin
		return (oauth && oauth.appid && oauth.appsecret && !oauth.appsecret.includes('<')) ? oauth : null
	} catch(e) { return null }
}

async function getWeixinAccessToken() {
	const now = Date.now()
	if (accessTokenCache.token && now < accessTokenCache.expiresAt - 300000) {
		return accessTokenCache.token
	}
	const oauth = getUniIdOAuth()
	if (!oauth) { console.error('[security] uni-id oauth 配置不可用'); return '' }

	try {
		const result = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${oauth.appid}&secret=${oauth.appsecret}`,
			{ method: 'GET', dataType: 'json' }
		)
		const data = result.data || {}
		if (data.access_token) {
			accessTokenCache = { token: data.access_token, expiresAt: now + (data.expires_in || 7200) * 1000 }
			return accessTokenCache.token
		}
		console.error('[security] 获取 access_token 失败:', data.errcode, data.errmsg)
		return ''
	} catch(e) {
		console.error('[security] getAccessToken 异常:', e.message)
		return ''
	}
}

/**
 * 微信文本安全检测
 * @param {string} content - 待检测文本
 * @param {string} [openid] - 用户 openid（可选）
 * @returns {{ pass: boolean, suggest: string, label: number }}
 *   suggest: "pass" 通过 / "review" 人工审核 / "block" 违规
 */
async function msgSecCheck(content, openid = '') {
	const text = (content || '').trim()
	if (!text) return { pass: true, suggest: 'pass', label: 0 }

	const token = await getWeixinAccessToken()
	if (!token) {
		console.warn('[security] msgSecCheck 无 access_token，降级放行')
		return { pass: true, suggest: 'pass', label: 0 } // 无 token 时降级放行，避免阻塞正常功能
	}

	try {
		const result = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${token}`,
			{
				method: 'POST',
				dataType: 'json',
				headers: { 'Content-Type': 'application/json' },
				data: { content: text, version: 2, scene: 2, openid }
			}
		)
		const body = result.data || {}
		if (body.errcode === 0 && body.result) {
			const suggest = body.result.suggest || 'pass'
			const label = body.result.label || 0
			if (suggest === 'block') {
				console.warn('[security] msgSecCheck BLOCK:', JSON.stringify(body.result))
			}
			return { pass: suggest !== 'block', suggest, label }
		}
		console.warn('[security] msgSecCheck 异常响应:', JSON.stringify(body))
		return { pass: true, suggest: 'pass', label: 0 } // 异常时降级放行
	} catch(e) {
		console.error('[security] msgSecCheck 调用异常:', e.message)
		return { pass: true, suggest: 'pass', label: 0 } // 网络异常时降级放行
	}
}

/**
 * 微信图片安全检测
 * @param {Buffer|ArrayBuffer} imageBuffer - 图片二进制数据
 * @returns {{ pass: boolean, suggest: string, label: number }}
 */
async function imgSecCheck(imageBuffer) {
	if (!imageBuffer || !imageBuffer.length) return { pass: true, suggest: 'pass', label: 0 }

	const token = await getWeixinAccessToken()
	if (!token) {
		console.warn('[security] imgSecCheck 无 access_token，降级放行')
		return { pass: true, suggest: 'pass', label: 0 }
	}

	try {
		const result = await uniCloud.httpclient.request(
			`https://api.weixin.qq.com/wxa/img_sec_check?access_token=${token}`,
			{
				method: 'POST',
				dataType: 'json',
				files: { media: imageBuffer },
				data: {}
			}
		)
		const body = result.data || {}
		if (body.errcode === 0 && body.result) {
			const suggest = body.result.suggest || 'pass'
			const label = body.result.label || 0
			if (suggest === 'block') {
				console.warn('[security] imgSecCheck BLOCK:', JSON.stringify(body.result))
			}
			return { pass: suggest !== 'block', suggest, label }
		}
		console.warn('[security] imgSecCheck 异常响应:', JSON.stringify(body))
		return { pass: true, suggest: 'pass', label: 0 }
	} catch(e) {
		console.error('[security] imgSecCheck 调用异常:', e.message)
		return { pass: true, suggest: 'pass', label: 0 }
	}
}

/**
 * 内容安全综合检测（本地敏感词 + 微信 API 双保险）
 * 本地过滤为快速前置检查，微信 API 为权威判定
 * @returns {{ pass: boolean, reason: string }}
 */
async function checkContentSafe(content, openid = '') {
	const text = (content || '').trim()
	if (!text) return { pass: true, reason: '' }

	// 第一关：本地敏感词快速过滤
	if (hasSensitiveWord(text)) {
		return { pass: false, reason: '内容包含不当信息，请修改后重试' }
	}

	// 第二关：微信 msgSecCheck
	const check = await msgSecCheck(text, openid)
	if (!check.pass) {
		return { pass: false, reason: '内容包含不当信息，请修改后重试' }
	}

	return { pass: true, reason: '' }
}

// ============================================================
//  本地敏感词库（第一关快速过滤，减少 API 调用）
// ============================================================
const SENSITIVE_WORDS = [
	// 政治敏感
	'六四', '天安门', '法轮功', 'flg', '达赖', '藏独', '疆独', '台独',
	// 色情
	'裸体', '色情', '成人', 'av', 'porn', 'sex', 'fuck', 'hentai',
	// 赌博
	'赌博', '博彩', '彩票', '赌场', 'casino', 'bet',
	// 暴恐
	'恐怖', '毒品', '枪支', '炸弹',
	// 欺诈/广告
	'兼职', '刷单', '刷信誉', '加微信', '微信号', 'qq号', '联系我',
	'免费领取', '点击领取', '优惠券',
]

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
	hasSensitiveWord,
	msgSecCheck,
	imgSecCheck,
	checkContentSafe,
	getWeixinAccessToken
}
