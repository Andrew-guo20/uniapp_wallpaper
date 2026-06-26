/**
 * 壁纸核心方法 — 用户端调用
 * 轮播图 / 推荐 / 分类 / 壁纸列表 / 详情 / 评分 / 下载 / 公告 / 搜索
 */
const { db, dbCmd, mergeData, parsePagination } = require('./common')

module.exports = {

	// ============================================================
	//  轮播图
	// ============================================================
	async getBanner() {
		const result = await db.collection('wallpaper-banner')
			.field('_id, picurl, target, url, appid, sort')
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
			.field('_id, smallPicurl, picurl, classid, score, downloadCount, scoreCount, description, tabs, nickname, create_time')
			.where({ status: 1 }).skip(skip).limit(take).get()
		return { errCode: 0, data: result.data }
	},

	async getClassify(data = {}) {
		data = mergeData.call(this, data)
		const where = {}
		if (data.select === true) where.select = true

		let query = db.collection('wallpaper-classify')
			.field('_id, name, picurl, sort, updateTime')
			.where(where).orderBy('sort', 'asc')
		if (data.pageSize) query = query.limit(data.pageSize)
		const result = await query.get()
		return { errCode: 0, data: result.data }
	},

	async getWallList(data = {}) {
		data = mergeData.call(this, data)
		const { skip, pageSize } = parsePagination(data)
		const result = await db.collection('wallpaper-list')
			.field('_id, smallPicurl, picurl, classid, score, downloadCount, scoreCount, description, tabs, nickname, create_time')
			.where({ classid: data.classid, status: 1 })
			.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get()
		return { errCode: 0, data: result.data }
	},

	async getDetailWall(data = {}) {
		data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-list').where({ _id: data.id }).get()
		if (result.data.length === 0) return { errCode: 400, errMsg: '壁纸不存在' }
		return { errCode: 0, data: [result.data[0]] }
	},

	// ============================================================
	//  评分 & 下载
	// ============================================================
	async setupScore(data = {}) {
		data = mergeData.call(this, data)
		if (!data.wallId || data.userScore === undefined) return { errCode: 400, errMsg: '参数不完整' }
		const wallId = data.wallId
		const userScore = Number(data.userScore)

		// 写入评分记录（双写 uid + deviceId，唯一索引防重复）
		try {
			await db.collection('wallpaper-user-score').add({
				wallId, deviceId: this.deviceId, uid: this.uid || '',
				userScore, create_time: Date.now()
			})
		} catch (e) {
			if (e.code === 11000 || e.message.includes('duplicate'))
				return { errCode: 400, errMsg: '您已经评分过了' }
			throw e
		}

		const wallResult = await db.collection('wallpaper-list').where({ _id: wallId }).get()
		if (wallResult.data.length === 0) return { errCode: 400, errMsg: '壁纸不存在' }

		const wall = wallResult.data[0]
		const oldScore = wall.score || 0
		const oldCount = wall.scoreCount || 0
		const newCount = oldCount + 1
		const newScore = parseFloat(((oldScore * oldCount + userScore) / newCount).toFixed(1))

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
			.field('_id, title, select, author, publish_date, view_count, create_time')
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
		const { pageNum, pageSize } = parsePagination(data)
		const keyword = (data.keyword || '').trim()
		if (!keyword) return { errCode: 0, data: [] }

		const classifyResult = await db.collection('wallpaper-classify').get()
		const classifyMap = {}
		classifyResult.data.forEach(c => { classifyMap[c._id] = c.name })

		const allResult = await db.collection('wallpaper-list')
			.field('_id, smallPicurl, picurl, classid, description, tabs, nickname, create_time')
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
	}
}
