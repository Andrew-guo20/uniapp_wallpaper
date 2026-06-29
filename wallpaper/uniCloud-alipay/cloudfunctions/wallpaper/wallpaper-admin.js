/**
 * 后台管理方法 — 轮播图 / 分类 / 壁纸 / 公告 CRUD + 上传 + 批量导入 + 统计
 */
const { db, dbCmd, mergeData } = require('./common')

module.exports = {

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
	}
}
