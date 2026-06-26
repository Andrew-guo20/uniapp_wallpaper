/**
 * 后台管理 — 数据统计 / 评论管理 / 投稿审核
 * v2.0 新增方法，支撑 admin 后台仪表盘和内容管理
 */
const { db, dbCmd, mergeData } = require('./common')

module.exports = {

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
			.field('_id, smallPicurl, description, downloadCount, score, favoriteCount')
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
	}
}
