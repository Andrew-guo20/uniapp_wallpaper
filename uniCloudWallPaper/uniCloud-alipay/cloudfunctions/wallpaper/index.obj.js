// 果果壁纸 — 云对象（单文件合并版 v2.0）
// 支付宝云不支持 require('./xxx') 同目录模块引用，部署前合并为单文件
// 模块源码见同名 .js 文件的 module.exports 部分

const db = uniCloud.database()
const dbCmd = db.command

let uniIdCommon = {}
try { uniIdCommon = require('uni-id-common') } catch(e) {}
let uniConfigCenter = null
try { uniConfigCenter = require('uni-config-center') } catch(e) {}

function getUniIdConfig(clientInfo = {}) {
	if (!uniConfigCenter) return {}
	const config = uniConfigCenter({ pluginId: 'uni-id' }).config()
	if (!Array.isArray(config)) return config
	return config.find(item => item.dcloudAppid === clientInfo.appId) ||
		config.find(item => item.isDefaultConfig) ||
		config[0] ||
		{}
}

function getLoginErrorMessage(error) {
	return error && (error.errMsg || error.message) || 'unknown error'
}

async function applyTokenContext(context, data = {}) {
	if (context.uid) return
	const token = data.uniIdToken || data.token || ''
	if (!token || !uniIdCommon || typeof uniIdCommon.createInstance !== 'function') return
	try {
		const uniID = uniIdCommon.createInstance({ clientInfo: normalizeClientInfo(context.getClientInfo()) })
		const result = await uniID.checkToken(token)
		if (result.errCode === 0 && result.uid) context.uid = result.uid
	} catch (e) {}
}

function normalizeClientInfo(clientInfo = {}) {
	return Object.assign({}, clientInfo, {
		appId: clientInfo.appId || clientInfo.APPID || 'wxedf7c9be266ef39c',
		platform: clientInfo.platform || clientInfo.PLATFORM || 'mp-weixin',
		locale: clientInfo.locale || clientInfo.LOCALE || 'zh-Hans',
		clientIP: clientInfo.clientIP || clientInfo.CLIENTIP || '',
		deviceId: clientInfo.deviceId || clientInfo.DEVICEID || 'anonymous'
	})
}

async function code2Session(code, clientInfo = {}) {
	clientInfo = normalizeClientInfo(clientInfo)
	const config = getUniIdConfig(clientInfo)
	const oauth = config['mp-weixin'] && config['mp-weixin'].oauth && config['mp-weixin'].oauth.weixin
	if (!oauth || !oauth.appid || !oauth.appsecret || oauth.appsecret.includes('<')) {
		return { errCode: 500, errMsg: '微信登录配置未完成' }
	}

	const result = await uniCloud.httpclient.request('https://api.weixin.qq.com/sns/jscode2session', {
		method: 'GET',
		dataType: 'json',
		data: {
			appid: oauth.appid,
			secret: oauth.appsecret,
			js_code: code,
			grant_type: 'authorization_code'
		}
	})
	const session = result.data || {}
	if (session.errcode) return { errCode: session.errcode, errMsg: session.errmsg || '微信登录失败' }
	if (!session.openid) return { errCode: 500, errMsg: '微信登录未返回openid' }
	return { errCode: 0, data: session }
}

async function findOrCreateWeixinUser(openid, clientInfo = {}) {
	const now = Date.now()
	const users = db.collection('uni-id-users')
	const where = { 'wx_openid.mp-weixin': openid }
	const result = await users.where(where).limit(1).get()
	if (result.data.length > 0) {
		const user = result.data[0]
		await users.doc(user._id).update({
			last_login_date: now,
			last_login_ip: clientInfo.clientIP || ''
		})
		return user
	}

	const addResult = await users.add({
		wx_openid: { 'mp-weixin': openid },
		nickname: '壁纸用户',
		avatar: '',
		status: 0,
		token: [],
		register_date: now,
		register_ip: clientInfo.clientIP || '',
		last_login_date: now,
		last_login_ip: clientInfo.clientIP || ''
	})
	return { _id: addResult.id, nickname: '壁纸用户', avatar: '' }
}

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

function parsePagination(data = {}, defaultPageSize = 12) {
	const pageNum = Math.max(1, parseInt(data.pageNum) || 1)
	const pageSize = Math.min(100, Math.max(1, parseInt(data.pageSize) || defaultPageSize))
	const skip = (pageNum - 1) * pageSize
	return { pageNum, pageSize, skip }
}

const SENSITIVE_WORDS = []
function hasSensitiveWord(text) {
	const lower = (text || '').toLowerCase()
	return SENSITIVE_WORDS.some(word => lower.includes(word.toLowerCase()))
}

module.exports = {
	_before: function () {
		const clientInfo = this.getClientInfo()
		this.uid = clientInfo.uid || ''
		this.deviceId = clientInfo.deviceId || 'anonymous'
	},

	// ==== 壁纸核心方法 (wallpaper-core.js) ====
	// ============================================================
	//  轮播图
	// ============================================================
	async getBanner() {
		const result = await db.collection('wallpaper-banner')
			.field({ _id: true, picurl: true, target: true, url: true, appid: true, sort: true })
			.orderBy('sort', 'asc')
			.get()
		return { errCode: 0, data: result.data }
	},

	// ============================================================
	//  壁纸查询
	// ============================================================
	async getRandomWall() {
		const countResult = await db.collection('wallpaper-list')
			.where({ status: 1 }).count()
		const total = countResult.total
		if (total === 0) return { errCode: 0, data: [] }

		const take = Math.min(9, total)
		const maxSkip = total - take
		const skip = maxSkip > 0 ? Math.floor(Math.random() * maxSkip) : 0

		const result = await db.collection('wallpaper-list')
			.field({ _id: true, smallPicurl: true, picurl: true, classid: true, score: true, downloadCount: true, scoreCount: true, description: true, tabs: true, nickname: true, create_time: true })
			.where({ status: 1 }).skip(skip).limit(take).get()
		return { errCode: 0, data: result.data }
	},

	async getClassify(data = {}) {
		data = mergeData.call(this, data)
		const where = {}
		if (data.select === true) where.select = true

		let query = db.collection('wallpaper-classify')
			.field({ _id: true, name: true, picurl: true, sort: true, updateTime: true })
			.where(where).orderBy('sort', 'asc')
		if (data.pageSize) query = query.limit(data.pageSize)
		const result = await query.get()
		return { errCode: 0, data: result.data }
	},

	async getWallList(data = {}) {
		data = mergeData.call(this, data)
		const { skip, pageSize } = parsePagination(data)
		const result = await db.collection('wallpaper-list')
			.field({ _id: true, smallPicurl: true, picurl: true, classid: true, score: true, downloadCount: true, scoreCount: true, description: true, tabs: true, nickname: true, create_time: true })
			.where({ classid: data.classid, status: 1 })
			.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get()
		return { errCode: 0, data: result.data }
	},

	async getDetailWall(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		const result = await db.collection('wallpaper-list').where({ _id: data.id }).get()
		if (result.data.length === 0) return { errCode: 400, errMsg: '壁纸不存在' }
		const wall = result.data[0]
		if (this.uid) {
			const scoreResult = await db.collection('wallpaper-user-score')
				.where({ wallId: data.id, uid: this.uid }).limit(1).get()
			if (scoreResult.data.length) wall.userScore = scoreResult.data[0].userScore
		}
		return { errCode: 0, data: [wall] }
	},

	// ============================================================
	//  评分 & 下载
	// ============================================================
	async setupScore(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: 'please login first' }
		if (!data.wallId || data.userScore === undefined) return { errCode: 400, errMsg: 'invalid params' }
		const wallId = data.wallId
		const userScore = Number(data.userScore)

		const wallResult = await db.collection('wallpaper-list').where({ _id: wallId }).get()
		if (wallResult.data.length === 0) return { errCode: 400, errMsg: 'wallpaper not found' }

		const wall = wallResult.data[0]
		const oldScore = wall.score || 0
		const oldCount = wall.scoreCount || 0
		const scoreMap = {}
		const scoreByUid = await db.collection('wallpaper-user-score')
			.where({ wallId, uid: this.uid }).get()
		scoreByUid.data.forEach(item => { scoreMap[item._id] = item })
		if (this.deviceId) {
			const scoreByDevice = await db.collection('wallpaper-user-score')
				.where({ wallId, deviceId: this.deviceId }).get()
			scoreByDevice.data.forEach(item => { scoreMap[item._id] = item })
		}
		const scoreList = Object.keys(scoreMap).map(id => scoreMap[id])
		const oldUserScoreTotal = scoreList.reduce((sum, item) => sum + (Number(item.userScore) || 0), 0)
		const effectiveOldCount = Math.max(oldCount, scoreList.length)
		const newCount = scoreList.length ? Math.max(1, effectiveOldCount - scoreList.length + 1) : oldCount + 1
		const totalScore = scoreList.length
			? oldScore * effectiveOldCount - oldUserScoreTotal + userScore
			: oldScore * oldCount + userScore
		const newScore = parseFloat((totalScore / newCount).toFixed(1))

		if (scoreList.length) {
			await db.collection('wallpaper-user-score').doc(scoreList[0]._id).update({
				userScore,
				uid: this.uid,
				deviceId: this.deviceId,
				create_time: Date.now()
			})
			await Promise.all(scoreList.slice(1).map(item =>
				db.collection('wallpaper-user-score').doc(item._id).remove()
			))
		} else {
			await db.collection('wallpaper-user-score').add({
				wallId, deviceId: this.deviceId, uid: this.uid,
				userScore, create_time: Date.now()
			})
		}

		await db.collection('wallpaper-list').where({ _id: wallId })
			.update({ score: newScore, scoreCount: newCount })
		return { errCode: 0, data: { score: newScore, scoreCount: newCount } }
	},
	async downloadWall(data = {}) {
		data = mergeData.call(this, data)
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }
		const wallId = data.wallId

		// 写入下载记录（双写 uid + deviceId）
		await db.collection('wallpaper-download-record').add({
			wallId, deviceId: this.deviceId, uid: this.uid || '', create_time: Date.now()
		})
		const result = await db.collection('wallpaper-list').where({ _id: wallId })
			.update({ downloadCount: dbCmd.inc(1) })
		return { errCode: 0, data: { updated: result.updated } }
	},

	// ============================================================
	//  公告
	// ============================================================
	async getNewsList(data = {}) {
		data = mergeData.call(this, data)
		const { skip, pageSize } = parsePagination(data, 10)
		const where = {}
		if (data.select === true) where.select = true
		const result = await db.collection('wallpaper-news')
			.field({ _id: true, title: true, select: true, author: true, publish_date: true, view_count: true, create_time: true })
			.where(where).orderBy('publish_date', 'desc').skip(skip).limit(pageSize).get()
		return { errCode: 0, data: result.data }
	},

	async getNewsDetail(data = {}) {
		data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-news').where({ _id: data.id }).get()
		if (result.data.length === 0) return { errCode: 400, errMsg: '公告不存在' }

		await db.collection('wallpaper-news').where({ _id: data.id })
			.update({ view_count: dbCmd.inc(1) })
		const news = result.data[0]
		news.view_count = (news.view_count || 0) + 1
		return { errCode: 0, data: news }
	},

	// ============================================================
	//  搜索（支付宝云不支持 dbCmd.regex，改用 JS 过滤）
	// ============================================================
	async searchWall(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		const { pageNum, pageSize } = parsePagination(data)
		const keyword = (data.keyword || '').trim()
		if (!keyword) return { errCode: 0, data: [] }

		// 记录搜索词（异步，不阻塞返回）
		db.collection('wallpaper-search-history').add({
			keyword, deviceId: this.deviceId, uid: this.uid || '', create_time: Date.now()
		}).catch(() => {}) // 静默失败

		const classifyResult = await db.collection('wallpaper-classify').get()
		const classifyMap = {}
		classifyResult.data.forEach(c => { classifyMap[c._id] = c.name })

		const allResult = await db.collection('wallpaper-list')
			.field({ _id: true, smallPicurl: true, picurl: true, classid: true, description: true, tabs: true, nickname: true, create_time: true })
			.where({ status: 1 }).orderBy('create_time', 'desc').limit(200).get()

		const lowerKeyword = keyword.toLowerCase()
		const matched = allResult.data.filter(item => {
			const desc = (item.description || '').toLowerCase()
			const nick = (item.nickname || '').toLowerCase()
			const tabs = (item.tabs || []).join(' ').toLowerCase()
			const cname = (classifyMap[item.classid] || '').toLowerCase()
			return desc.includes(lowerKeyword) || nick.includes(lowerKeyword) ||
			       tabs.includes(lowerKeyword) || cname.includes(lowerKeyword)
		})

		const skip = (pageNum - 1) * pageSize
		return { errCode: 0, data: matched.slice(skip, skip + pageSize) }
	},

	// ==== 用户相关 (wallpaper-user.js) ====
	// ============================================================
	//  用户统计
	// ============================================================
	async getUserInfo(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		const userWhere = this.uid
			? dbCmd.or([{ uid: this.uid }, { deviceId: this.deviceId }])
			: { deviceId: this.deviceId }

		const [downloadResult, scoreResult] = await Promise.all([
			db.collection('wallpaper-download-record').where(userWhere).count(),
			db.collection('wallpaper-user-score').where(userWhere).count()
		])

		let favoriteSize = 0
		if (this.uid) {
			const favResult = await db.collection('wallpaper-favorites')
				.where({ uid: this.uid }).count()
			favoriteSize = favResult.total
		}

		return {
			errCode: 0,
			data: { downloadSize: downloadResult.total, scoreSize: scoreResult.total, favoriteSize }
		}
	},

	// ============================================================
	//  用户历史列表
	// ============================================================
	async getUserWallList(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		const { skip, pageSize } = parsePagination(data)

		let collectionName, matchCondition
		if (data.type === 'download') {
			collectionName = 'wallpaper-download-record'
			matchCondition = this.uid
				? dbCmd.or([{ uid: this.uid }, { deviceId: this.deviceId }])
				: { deviceId: this.deviceId }
		} else if (data.type === 'score') {
			collectionName = 'wallpaper-user-score'
			matchCondition = this.uid
				? dbCmd.or([{ uid: this.uid }, { deviceId: this.deviceId }])
				: { deviceId: this.deviceId }
		} else if (data.type === 'favorite') {
			if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
			collectionName = 'wallpaper-favorites'
			matchCondition = { uid: this.uid }
		} else {
			return { errCode: 400, errMsg: 'type 参数错误' }
		}

		const result = await db.collection(collectionName)
			.aggregate().match(matchCondition).sort({ create_time: -1 })
			.skip(skip).limit(pageSize)
			.lookup({ from: 'wallpaper-list', localField: 'wallId', foreignField: '_id', as: 'wallDetail' })
			.end()

		const dataList = result.data.map(item => {
			const wall = (item.wallDetail && item.wallDetail[0]) || {}
			const extra = { create_time: item.create_time }
			if (data.type === 'score') extra.userScore = item.userScore
			return Object.assign({}, wall, extra)
		})
		return { errCode: 0, data: dataList }
	},

	// ============================================================
	//  登录
	// ============================================================
	async userLogin(data = {}) {
		try {
			data = mergeData.call(this, data)
			if (!data.code) return { errCode: 400, errMsg: '缺少登录凭证code' }

			const clientInfo = normalizeClientInfo(this.getClientInfo())
			const sessionResult = await code2Session(data.code, clientInfo)
			if (sessionResult.errCode !== 0) return sessionResult

			const user = await findOrCreateWeixinUser(sessionResult.data.openid, clientInfo)
			if (!uniIdCommon || typeof uniIdCommon.createInstance !== 'function') {
				return { errCode: 500, errMsg: 'uni-id-common 公共模块未上传或未生效' }
			}
			const uniID = uniIdCommon.createInstance({ clientInfo })
			const loginResult = await uniID.createToken({ uid: user._id })
			if (loginResult.errCode !== 0) return loginResult

			this.uid = user._id
			this.deviceId = clientInfo.deviceId || 'anonymous'
			try {
				await this.migrateDeviceToUid()
			} catch (e) {
				console.error('migrateDeviceToUid failed:', e)
			}

			return {
				errCode: 0,
				data: {
					token: loginResult.token, tokenExpired: loginResult.tokenExpired,
					uid: user._id,
					userInfo: {
						uid: user._id,
						nickname: user.nickname || '壁纸用户',
						avatar: user.avatar_file?.url || user.avatar || ''
					}
				}
			}
		} catch (e) {
			console.error('userLogin failed:', e)
			return { errCode: 500, errMsg: `登录失败：${getLoginErrorMessage(e)}` }
		}
	},

	async getUserProfile(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }

		const result = await db.collection('uni-id-users').doc(this.uid).get()
		if (!result.data.length) return { errCode: 404, errMsg: '用户不存在' }

		const user = result.data[0] || {}
		return {
			errCode: 0,
			data: { uid: this.uid, nickname: user.nickname || '', avatar: user.avatar_file?.url || user.avatar || '' }
		}
	},

	async checkToken(data = {}) {
		data = mergeData.call(this, data)
		if (!data.token && !this.uid) return { errCode: 0, data: { valid: false } }

		const uniID = uniIdCommon.createInstance({ clientInfo: normalizeClientInfo(this.getClientInfo()) })
		try {
			const result = await uniID.checkToken(data.token || '')
			return { errCode: 0, data: { valid: result.errCode === 0, uid: result.uid || '' } }
		} catch (e) {
			return { errCode: 0, data: { valid: false } }
		}
	},

	// ============================================================
	//  数据迁移
	// ============================================================
	async migrateDeviceToUid(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }

		const scoreResult = await db.collection('wallpaper-user-score')
			.where({ deviceId: this.deviceId, uid: '' })
			.update({ uid: this.uid })

		const dlResult = await db.collection('wallpaper-download-record')
			.where({ deviceId: this.deviceId, uid: '' })
			.update({ uid: this.uid })

		return {
			errCode: 0,
			data: { migrated: { score: scoreResult.updated || 0, download: dlResult.updated || 0 } }
		}
	},

	// ==== 收藏相关 (wallpaper-favorite.js) ====
	async addFavorite(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }

		try {
			const exist = await db.collection('wallpaper-favorites')
				.where({ wallId: data.wallId, uid: this.uid }).count()
			if (exist.total > 0) return { errCode: 0, data: { favorited: true } }

			await db.collection('wallpaper-favorites').add({
				wallId: data.wallId, uid: this.uid, create_time: Date.now()
			})
			await db.collection('wallpaper-list').where({ _id: data.wallId })
				.update({ favoriteCount: dbCmd.inc(1) })
			return { errCode: 0, data: { favorited: true } }
		} catch (e) {
			const message = e && (e.message || e.errMsg) || ''
			if (e.code === 11000 || message.includes('duplicate'))
				return { errCode: 0, data: { favorited: true, msg: '已收藏' } }
			console.error('addFavorite failed:', e)
			return { errCode: 500, errMsg: message || 'favorite failed' }
		}
	},

	async removeFavorite(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }

		const result = await db.collection('wallpaper-favorites')
			.where({ wallId: data.wallId, uid: this.uid }).remove()

		if (result.deleted > 0) {
			await db.collection('wallpaper-list').where({ _id: data.wallId })
				.update({ favoriteCount: dbCmd.inc(-1) })
		}
		return { errCode: 0, data: { favorited: false } }
	},

	async toggleFavorite(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }

		try {
			const exist = await db.collection('wallpaper-favorites')
				.where({ wallId: data.wallId, uid: this.uid }).count()

			if (exist.total > 0) {
				const result = await db.collection('wallpaper-favorites')
					.where({ wallId: data.wallId, uid: this.uid }).remove()
				if (result.deleted > 0) {
					await db.collection('wallpaper-list').where({ _id: data.wallId })
						.update({ favoriteCount: dbCmd.inc(-1) })
				}
				return { errCode: 0, data: { favorited: false } }
			}

			await db.collection('wallpaper-favorites').add({
				wallId: data.wallId, uid: this.uid, create_time: Date.now()
			})
			await db.collection('wallpaper-list').where({ _id: data.wallId })
				.update({ favoriteCount: dbCmd.inc(1) })
			return { errCode: 0, data: { favorited: true } }
		} catch (e) {
			const message = e && (e.message || e.errMsg) || ''
			if (e.code === 11000 || message.includes('duplicate')) {
				return { errCode: 0, data: { favorited: true } }
			}
			console.error('toggleFavorite failed:', e)
			return { errCode: 500, errMsg: message || 'favorite failed' }
		}
	},

	async isFavorited(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid || !data.wallIds || !data.wallIds.length)
			return { errCode: 0, data: {} }

		const result = await db.collection('wallpaper-favorites')
			.where({ uid: this.uid, wallId: dbCmd.in(data.wallIds) })
			.field({ wallId: true }).get()

		const favoritedMap = {}
		result.data.forEach(item => { favoritedMap[item.wallId] = true })
		return { errCode: 0, data: favoritedMap }
	},

	// ==== 评论相关 (wallpaper-comment.js) ====
	async addComment(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.wallId || !data.content) return { errCode: 400, errMsg: '参数不完整' }

		const content = (data.content || '').trim()
		if (content.length === 0) return { errCode: 400, errMsg: '评论内容不能为空' }
		if (content.length > 500) return { errCode: 400, errMsg: '评论内容不能超过500字' }
		if (hasSensitiveWord(content)) return { errCode: 400, errMsg: '评论包含不当内容，请修改后重试' }

		const result = await db.collection('wallpaper-comments').add({
			wallId: data.wallId, uid: this.uid, content,
			status: 1, create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},

	async getComments(data = {}) {
		data = mergeData.call(this, data)
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }
		const { pageNum, pageSize, skip } = parsePagination(data, 10)

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-comments')
				.where({ wallId: data.wallId, status: 1 })
				.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-comments')
				.where({ wallId: data.wallId, status: 1 }).count()
		])

		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	},

	async deleteComment(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.commentId) return { errCode: 400, errMsg: '参数不完整' }

		const result = await db.collection('wallpaper-comments')
			.where({ _id: data.commentId, uid: this.uid }).remove()
		if (result.deleted === 0) return { errCode: 400, errMsg: '评论不存在或无权删除' }
		return { errCode: 0, data: { removed: true } }
	},

	// ==== 推荐 (wallpaper-recommend.js) ====
	/**
	 * 获取个性化推荐壁纸
	 * 基于用户浏览/下载/评分/收藏历史的标签权重排序
	 * 无历史数据时冷启动：返回随机高评分壁纸
	 */
	async getRecommendWalls(data = {}) {
		data = mergeData.call(this, data)
		const pageSize = data.pageSize || 9

		if (this.uid) {
			// 收集用户行为数据，提取标签权重
			const [downloads, scores, favorites] = await Promise.all([
				db.collection('wallpaper-download-record')
					.where(db.command.or([{ uid: this.uid }, { deviceId: this.deviceId }]))
					.field({ wallId: true }).limit(100).get(),
				db.collection('wallpaper-user-score')
					.where(db.command.or([{ uid: this.uid }, { deviceId: this.deviceId }]))
					.field({ wallId: true, userScore: true }).limit(100).get(),
				this.uid ? db.collection('wallpaper-favorites').where({ uid: this.uid }).field({ wallId: true }).limit(100).get()
					: Promise.resolve({ data: [] })
			])

			// 收集所有涉及的 wallId
			const wallIds = new Set()
			downloads.data.forEach(d => wallIds.add(d.wallId))
			scores.data.forEach(s => wallIds.add(s.wallId))
			favorites.data.forEach(f => wallIds.add(f.wallId))

			if (wallIds.size > 0) {
				// 查询这些壁纸的标签，统计权重
				const wallsResult = await db.collection('wallpaper-list')
					.where({ _id: db.command.in(Array.from(wallIds)) })
					.field({ tabs: true }).limit(100).get()

				const tagWeights = {}
				wallsResult.data.forEach(w => {
					(w.tabs || []).forEach(tag => {
						tagWeights[tag] = (tagWeights[tag] || 0) + 1
					})
				})

				// 取 TOP 标签
				const topTags = Object.entries(tagWeights)
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5)
					.map(([tag]) => tag)

				// 用标签匹配推荐，排除已交互过的
				if (topTags.length > 0) {
					const result = await db.collection('wallpaper-list')
						.where({
							status: 1,
							tabs: db.command.in(topTags),
							_id: db.command.nin(Array.from(wallIds))
						})
						.field({ _id: true, smallPicurl: true, picurl: true, classid: true, score: true, downloadCount: true, scoreCount: true, description: true, tabs: true, nickname: true, create_time: true })
						.orderBy('score', 'desc').limit(pageSize).get()

					if (result.data.length >= 3) {
						return { errCode: 0, data: result.data }
					}
				}
			}
		}

		// 冷启动兜底：随机返回高评分壁纸
		const countResult = await db.collection('wallpaper-list')
			.where({ status: 1 }).count()
		const total = countResult.total
		if (total === 0) return { errCode: 0, data: [] }

		const take = Math.min(pageSize, total)
		const maxSkip = total - take
		const skip = maxSkip > 0 ? Math.floor(Math.random() * maxSkip) : 0

		const result = await db.collection('wallpaper-list')
			.field({ _id: true, smallPicurl: true, picurl: true, classid: true, score: true, downloadCount: true, scoreCount: true, description: true, tabs: true, nickname: true, create_time: true })
			.where({ status: 1 }).skip(skip).limit(take).get()

		return { errCode: 0, data: result.data }
	},

	// ==== 投稿 (wallpaper-upload.js) ====
	/**
	 * 提交投稿
	 */
	async submitUpload(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.classid || !data.picurl || !data.smallPicurl)
			return { errCode: 400, errMsg: '分类、原图和缩略图为必填项' }

		const result = await db.collection('wallpaper-user-upload').add({
			uid: this.uid, picurl: data.picurl, smallPicurl: data.smallPicurl,
			classid: data.classid, description: data.description || '',
			tabs: data.tabs || [], status: 0, create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},

	/**
	 * 我的投稿列表及审核状态
	 */
	async getMyUploads(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		const { pageNum, pageSize, skip } = parsePagination(data, 10)

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-user-upload')
				.where({ uid: this.uid })
				.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-user-upload').where({ uid: this.uid }).count()
		])

		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	},

	// ==== 搜索增强 (wallpaper-search.js) ====
	/**
	 * 获取热门搜索词 TOP 10（近7天）
	 */
	async getHotSearchKeywords(data = {}) {
		data = mergeData.call(this, data)
		try {
			const since = Date.now() - 7 * 24 * 60 * 60 * 1000

			const result = await db.collection(SEARCH_COLLECTION)
				.aggregate()
				.match({ create_time: dbCmd.gte(since) })
				.group({ _id: '$keyword', count: { $sum: 1 } })
				.sort({ count: -1 })
				.limit(10)
				.end()

			return {
				errCode: 0,
				data: result.data.map(item => ({ keyword: item._id, count: item.count }))
			}
		} catch (e) {
			console.error('getHotSearchKeywords failed:', e)
			return { errCode: 0, data: [] }
		}
	},

	/**
	 * 获取当前用户搜索历史（最近20条）
	 */
	async getSearchHistory(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid && !this.deviceId) return { errCode: 0, data: [] }

		try {
			const where = this.uid
				? { uid: this.uid }
				: { deviceId: this.deviceId }

			const result = await db.collection(SEARCH_COLLECTION)
				.where(where)
				.orderBy('create_time', 'desc')
				.limit(20)
				.get()

			return { errCode: 0, data: result.data.map(item => item.keyword) }
		} catch (e) {
			console.error('getSearchHistory failed:', e)
			return { errCode: 0, data: [] }
		}
	},

	/**
	 * 清除搜索历史
	 */
	async clearSearchHistory(data = {}) {
		data = mergeData.call(this, data)
		await applyTokenContext(this, data)
		if (!this.uid && !this.deviceId) return { errCode: 400, errMsg: '无法识别用户' }

		const where = this.uid
			? { uid: this.uid }
			: { deviceId: this.deviceId }

		await db.collection(SEARCH_COLLECTION).where(where).remove()
		return { errCode: 0, data: { cleared: true } }
	},

	// ==== 后台管理 CRUD (wallpaper-admin.js) ====
	// ============================================================
	//  轮播图 CRUD
	// ============================================================
	async adminGetBanners(data = {}) {
		data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-banner').orderBy('sort', 'asc').get()
		return { errCode: 0, data: result.data }
	},
	async adminCreateBanner(data = {}) {
		data = mergeData.call(this, data)
		if (!data.picurl) return { errCode: 400, errMsg: '请上传轮播图' }
		const result = await db.collection('wallpaper-banner').add({
			picurl: data.picurl, target: data.target || 'page', url: data.url || '',
			appid: data.appid || '', sort: data.sort || 0, create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},
	async adminUpdateBanner(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		const id = data._id; delete data._id
		await db.collection('wallpaper-banner').where({ _id: id }).update(data)
		return { errCode: 0, data: { updated: true } }
	},
	async adminDeleteBanner(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		await db.collection('wallpaper-banner').where({ _id: data._id }).remove()
		return { errCode: 0, data: { removed: true } }
	},

	// ============================================================
	//  分类 CRUD
	// ============================================================
	async adminGetClassifies(data = {}) {
		data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-classify').orderBy('sort', 'asc').get()
		return { errCode: 0, data: result.data }
	},
	async adminCreateClassify(data = {}) {
		data = mergeData.call(this, data)
		if (!data.name || !data.picurl) return { errCode: 400, errMsg: '名称和封面图为必填项' }
		const result = await db.collection('wallpaper-classify').add({
			name: data.name, picurl: data.picurl, sort: data.sort || 0,
			select: data.select || false, updateTime: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},
	async adminUpdateClassify(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		const id = data._id; delete data._id
		data.updateTime = Date.now()
		await db.collection('wallpaper-classify').where({ _id: id }).update(data)
		return { errCode: 0, data: { updated: true } }
	},
	async adminDeleteClassify(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		const wallCount = await db.collection('wallpaper-list').where({ classid: data._id }).count()
		if (wallCount.total > 0) return { errCode: 400, errMsg: `该分类下还有 ${wallCount.total} 张壁纸，请先删除壁纸` }
		await db.collection('wallpaper-classify').where({ _id: data._id }).remove()
		return { errCode: 0, data: { removed: true } }
	},

	// ============================================================
	//  壁纸 CRUD
	// ============================================================
	async adminGetWalls(data = {}) {
		data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1, pageSize = data.pageSize || 20
		const skip = (pageNum - 1) * pageSize
		const where = {}
		if (data.classid) where.classid = data.classid
		if (data.status !== undefined && data.status !== '') where.status = data.status

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-list').where(where).orderBy('create_time', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-list').where(where).count()
		])
		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	},
	async adminCreateWall(data = {}) {
		data = mergeData.call(this, data)
		if (!data.classid || !data.picurl || !data.smallPicurl)
			return { errCode: 400, errMsg: '分类、原图和缩略图为必填项' }
		const result = await db.collection('wallpaper-list').add({
			classid: data.classid, smallPicurl: data.smallPicurl, picurl: data.picurl,
			nickname: data.nickname || '', score: 0, description: data.description || '',
			tabs: data.tabs || [], downloadCount: 0, scoreCount: 0, favoriteCount: 0,
			create_time: Date.now(), status: data.status !== undefined ? data.status : 1
		})
		return { errCode: 0, data: { id: result.id } }
	},
	async adminUpdateWall(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		const id = data._id; delete data._id
		await db.collection('wallpaper-list').where({ _id: id }).update(data)
		return { errCode: 0, data: { updated: true } }
	},
	async adminDeleteWall(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		const wallId = data._id
		await db.collection('wallpaper-list').where({ _id: wallId }).remove()
		await Promise.all([
			db.collection('wallpaper-user-score').where({ wallId }).remove(),
			db.collection('wallpaper-download-record').where({ wallId }).remove(),
			db.collection('wallpaper-favorites').where({ wallId }).remove(),
			db.collection('wallpaper-comments').where({ wallId }).remove()
		])
		return { errCode: 0, data: { removed: true } }
	},
	async adminReviewWall(data = {}) {
		data = mergeData.call(this, data)
		if (!data.ids || !data.ids.length) return { errCode: 400, errMsg: '请选择壁纸' }
		if (![0, 1, 2].includes(data.status)) return { errCode: 400, errMsg: '状态值无效' }
		await db.collection('wallpaper-list').where({ _id: dbCmd.in(data.ids) }).update({ status: data.status })
		return { errCode: 0, data: { updated: true } }
	},
	async adminGetWallStats() {
		const [totalResult, statusResult] = await Promise.all([
			db.collection('wallpaper-list').count(),
			db.collection('wallpaper-list').aggregate().group({ _id: '$status', count: { $sum: 1 } }).end()
		])
		const byStatus = { published: 0, review: 0, offline: 0 }
		statusResult.data.forEach(item => {
			if (item._id === 0) byStatus.review = item.count
			else if (item._id === 1) byStatus.published = item.count
			else if (item._id === 2) byStatus.offline = item.count
		})
		return { errCode: 0, data: { total: totalResult.total, byStatus } }
	},
	async adminUpload(data = {}) {
		data = mergeData.call(this, data)
		if (!data.fileName || !data.base64) return { errCode: 400, errMsg: 'fileName 和 base64 为必填项' }
		const result = await uniCloud.uploadFile({
			cloudPath: `wallpaper/${data.fileName}`, fileContent: Buffer.from(data.base64, 'base64')
		})
		const urlResult = await uniCloud.getTempFileURL({ fileList: [result.fileID] })
		return { errCode: 0, data: { fileID: result.fileID, cloudURL: urlResult.fileList[0].tempFileURL || result.fileID } }
	},
	/**
	 * 检查壁纸 URL 是否已存在（去重用）
	 * @param {Object} data  { picurl }
	 * @returns {Object}  { exists: bool }
	 */
	async adminCheckWallExists(data = {}) {
		data = mergeData.call(this, data)
		if (!data.picurl) return { errCode: 400, errMsg: '缺少picurl' }
		const result = await db.collection('wallpaper-list').where({ picurl: data.picurl }).count()
		return { errCode: 0, data: { exists: result.total > 0 } }
	},

	async adminBatchImport(data = {}) {
		data = mergeData.call(this, data)
		if (!data.walls || !data.walls.length) return { errCode: 400, errMsg: 'walls 数组为空' }
		const walls = data.walls.map(w => ({
			classid: w.classid, smallPicurl: w.smallPicurl, picurl: w.picurl,
			nickname: w.nickname || '', score: 0, description: w.description || '',
			tabs: w.tabs || [], downloadCount: 0, scoreCount: 0, favoriteCount: 0,
			create_time: Date.now(), status: w.status !== undefined ? w.status : 1
		}))
		const result = await db.collection('wallpaper-list').add(walls)
		return { errCode: 0, data: { inserted: result.inserted } }
	},

	// ============================================================
	//  公告 CRUD
	// ============================================================
	async adminGetNews(data = {}) {
		data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1, pageSize = data.pageSize || 20
		const skip = (pageNum - 1) * pageSize
		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-news').orderBy('publish_date', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-news').count()
		])
		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	},
	async adminCreateNews(data = {}) {
		data = mergeData.call(this, data)
		if (!data.title || !data.content) return { errCode: 400, errMsg: '标题和内容为必填项' }
		const result = await db.collection('wallpaper-news').add({
			title: data.title, content: data.content, author: data.author || '',
			select: data.select || false, view_count: 0, publish_date: Date.now(), create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},
	async adminUpdateNews(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		const id = data._id; delete data._id
		await db.collection('wallpaper-news').where({ _id: id }).update(data)
		return { errCode: 0, data: { updated: true } }
	},
	async adminDeleteNews(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		await db.collection('wallpaper-news').where({ _id: data._id }).remove()
		return { errCode: 0, data: { removed: true } }
	},

	// ==== 数据统计/评论审核/投稿审核 (wallpaper-admin-stats.js) ====
	// ============================================================
	//  数据仪表盘
	// ============================================================

	async adminGetDashboardStats(data = {}) {
		data = mergeData.call(this, data)

		const [wallResult, downloadResult, commentResult, uploadResult, todayResult, userResult] = await Promise.all([
			db.collection('wallpaper-list').where({ status: 1 }).count(),
			db.collection('wallpaper-download-record').count(),
			db.collection('wallpaper-comments').count(),
			db.collection('wallpaper-user-upload').where({ status: 0 }).count(),
			db.collection('wallpaper-download-record')
				.where({ create_time: dbCmd.gte(new Date().setHours(0, 0, 0, 0)) }).count(),
			// 估算用户数：评分表 + 下载记录表 去重 deviceId
			(async () => {
				const [scoreUsers, dlUsers] = await Promise.all([
					db.collection('wallpaper-user-score').aggregate().group({ _id: '$deviceId' }).end(),
					db.collection('wallpaper-download-record').aggregate().group({ _id: '$deviceId' }).end()
				])
				const ids = new Set()
				scoreUsers.data.forEach(s => ids.add(s._id))
				dlUsers.data.forEach(d => ids.add(d._id))
				return { total: ids.size }
			})()
		])

		return {
			errCode: 0,
			data: {
				wallCount: wallResult.total,
				userCount: userResult.total,
				todayDownloads: todayResult.total,
				commentCount: commentResult.total,
				uploadPending: uploadResult.total
			}
		}
	},

	async adminGetDownloadTrend(data = {}) {
		data = mergeData.call(this, data)
		const days = data.days || 7
		const since = Date.now() - days * 24 * 60 * 60 * 1000

		const result = await db.collection('wallpaper-download-record')
			.aggregate()
			.match({ create_time: dbCmd.gte(since) })
			.group({
				_id: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$create_time' } } },
				count: { $sum: 1 }
			})
			.sort({ _id: 1 }).end()

		return { errCode: 0, data: result.data }
	},

	async adminGetHotWalls(data = {}) {
		data = mergeData.call(this, data)
		const limit = data.limit || 10
		const result = await db.collection('wallpaper-list')
			.where({ status: 1 })
			.field({ _id: true, smallPicurl: true, description: true, downloadCount: true, score: true, favoriteCount: true })
			.orderBy('downloadCount', 'desc').limit(limit).get()
		return { errCode: 0, data: result.data }
	},

	// ============================================================
	//  评论管理
	// ============================================================

	async adminGetComments(data = {}) {
		data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1, pageSize = data.pageSize || 20
		const skip = (pageNum - 1) * pageSize
		const where = {}
		if (data.status !== undefined && data.status !== '') where.status = data.status

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-comments').where(where)
				.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-comments').where(where).count()
		])
		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	},

	async adminReviewComment(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id || ![1, 2].includes(data.status)) return { errCode: 400, errMsg: '参数无效' }
		await db.collection('wallpaper-comments').where({ _id: data._id }).update({ status: data.status })
		return { errCode: 0, data: { updated: true } }
	},

	async adminDeleteComment(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id) return { errCode: 400, errMsg: '缺少_id' }
		await db.collection('wallpaper-comments').where({ _id: data._id }).remove()
		return { errCode: 0, data: { removed: true } }
	},

	// ============================================================
	//  投稿审核
	// ============================================================

	async adminGetUploads(data = {}) {
		data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1, pageSize = data.pageSize || 20
		const skip = (pageNum - 1) * pageSize
		const where = {}
		if (data.status !== undefined && data.status !== '') where.status = data.status

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-user-upload').where(where)
				.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-user-upload').where(where).count()
		])
		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	},

	async adminReviewUpload(data = {}) {
		data = mergeData.call(this, data)
		if (!data._id || ![1, 2].includes(data.status)) return { errCode: 400, errMsg: '参数无效' }

		await db.collection('wallpaper-user-upload').where({ _id: data._id })
			.update({ status: data.status, review_msg: data.review_msg || '' })

		// 审核通过 → 自动发布到 wallpaper-list
		if (data.status === 1) {
			const upload = await db.collection('wallpaper-user-upload').where({ _id: data._id }).get()
			if (upload.data.length > 0) {
				const u = upload.data[0]
				await db.collection('wallpaper-list').add({
					classid: u.classid, smallPicurl: u.smallPicurl, picurl: u.picurl,
					nickname: '', score: 0, description: u.description || '', tabs: u.tabs || [],
					downloadCount: 0, scoreCount: 0, favoriteCount: 0,
					create_time: Date.now(), status: 1
				})

			// 推送通知：投稿已通过
			this.sendPush({
				uid: upload.data[0].uid,
				title: '投稿审核通过',
				content: '你的壁纸投稿已通过审核，已发布',
				payload: { type: 'upload_review', wallId: upload.data[0]._id }
			}).catch(() => {})
			}
		}
		// 推送通知：投稿被拒绝
		if (data.status === 2) {
			const upload = await db.collection('wallpaper-user-upload').where({ _id: data._id }).get()
			if (upload.data.length > 0) {
				this.sendPush({
					uid: upload.data[0].uid,
					title: '投稿审核结果',
					content: '你的壁纸投稿未通过: ' + (data.review_msg || '不符合要求'),
					payload: { type: 'upload_review' }
				}).catch(() => {})
			}
		}
		return { errCode: 0, data: { updated: true } }
	},

	// ============================================================
	//  用户管理
	// ============================================================

	async adminGetUsers(data = {}) {
		data = mergeData.call(this, data)
		// 从评分和下载记录中聚合用户列表
		const [scoreUsers, dlUsers, favUsers] = await Promise.all([
			db.collection('wallpaper-user-score').aggregate()
				.group({ _id: { deviceId: '$deviceId', uid: '$uid' }, count: { $sum: 1 } }).end(),
			db.collection('wallpaper-download-record').aggregate()
				.group({ _id: { deviceId: '$deviceId', uid: '$uid' }, count: { $sum: 1 } }).end(),
			db.collection('wallpaper-favorites').aggregate()
				.group({ _id: '$uid', count: { $sum: 1 } }).end()
		])

		// 合并去重
		const userMap = {}
		const merge = (list, type) => {
			list.data.forEach(item => {
				const key = item._id.uid || item._id.deviceId || item._id
				if (!userMap[key]) userMap[key] = { id: key, scores: 0, downloads: 0, favorites: 0 }
				if (type === 'score') userMap[key].scores = item.count
				if (type === 'download') userMap[key].downloads = item.count
				if (type === 'favorite') userMap[key].favorites = item.count
			})
		}
		merge(scoreUsers, 'score')
		merge(dlUsers, 'download')
		merge(favUsers, 'favorite')

		return { errCode: 0, data: { list: Object.values(userMap), total: Object.keys(userMap).length } }
	},
	/**
	 * 推送通知（uni-push 2.0）
	 * @param {string} uid 目标用户 uid
	 * @param {string} title 通知标题
	 * @param {string} content 通知内容
	 * @param {object} payload 点击跳转参数 { type, wallId, noticeId }
	 */
	async sendPush(data = {}) {
		data = mergeData.call(this, data)
		if (!data.uid) return { errCode: 400, errMsg: '缺少目标用户' }
		try {
			await uniCloud.sendPushMessage({
				user_id: data.uid,
				title: data.title || '果果壁纸',
				content: data.content || '',
				payload: data.payload || {}
			})
			return { errCode: 0, data: { sent: true } }
		} catch (e) {
			console.error('sendPush error:', e)
			return { errCode: 0, data: { sent: false, msg: e.message } }
		}
	},

}