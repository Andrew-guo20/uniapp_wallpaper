/**
 * 用户相关方法 — 用户统计 / 历史记录 / 登录 / 迁移
 */
const { db, dbCmd, uniIdCommon, mergeData, parsePagination } = require('./common')
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

module.exports = {

	// ============================================================
	//  用户统计
	// ============================================================
	async getUserInfo(data = {}) {
		data = mergeData.call(this, data)
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
			return Object.assign({}, wall, { create_time: item.create_time })
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
	}
}
