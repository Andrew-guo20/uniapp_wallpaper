/**
 * 用户相关方法 — 用户统计 / 历史记录 / 登录 / 迁移
 */
const { db, dbCmd, uniIdCommon, mergeData, parsePagination } = require('./common')

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
		data = mergeData.call(this, data)
		if (!data.code) return { errCode: 400, errMsg: '缺少登录凭证code' }

		const uniID = uniIdCommon.createInstance({ context: this.getUniCloudRequestContext() })
		const loginResult = await uniID.loginByWeixin({ code: data.code })
		if (loginResult.errCode !== 0) return loginResult

		const clientInfo = this.getClientInfo()
		this.uid = loginResult.uid
		this.deviceId = clientInfo.deviceId || 'anonymous'
		await this.migrateDeviceToUid()

		return {
			errCode: 0,
			data: {
				token: loginResult.token, tokenExpired: loginResult.tokenExpired,
				uid: loginResult.uid, userInfo: loginResult.userInfo || {}
			}
		}
	},

	async getUserProfile(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }

		const uniID = uniIdCommon.createInstance({ context: this.getUniCloudRequestContext() })
		const result = await uniID.getUserInfoByUid({ uid: this.uid })
		if (result.errCode !== 0) return result

		const user = result.userInfo || {}
		return {
			errCode: 0,
			data: { uid: this.uid, nickname: user.nickname || '', avatar: user.avatar_file?.url || user.avatar || '' }
		}
	},

	async checkToken(data = {}) {
		data = mergeData.call(this, data)
		if (!data.token && !this.uid) return { errCode: 0, data: { valid: false } }

		const uniID = uniIdCommon.createInstance({ context: this.getUniCloudRequestContext() })
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
			.where({ deviceId: this.deviceId, uid: dbCmd.or([{ $eq: '' }, { $exists: false }]) })
			.update({ uid: this.uid })

		const dlResult = await db.collection('wallpaper-download-record')
			.where({ deviceId: this.deviceId, uid: dbCmd.or([{ $eq: '' }, { $exists: false }]) })
			.update({ uid: this.uid })

		return {
			errCode: 0,
			data: { migrated: { score: scoreResult.updated || 0, download: dlResult.updated || 0 } }
		}
	}
}
