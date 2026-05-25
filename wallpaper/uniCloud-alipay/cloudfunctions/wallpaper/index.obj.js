// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
//
// 语法选择说明：
//   全部使用传统数据库语法 (db) + dbCmd，不使用 JQL。
//   原因：
//   1. JQL 受 schema 权限限制（schema 设 create:false 会阻止云对象写入）
//   2. JQL 不支持 dbCmd.inc() / regex() / in() 等高级操作
//   3. JQL 不支持数组元素的精确更新
//   云对象是服务端代码，理应拥有完整数据库权限；schema 权限用于约束客户端。
const db = uniCloud.database()
const dbCmd = db.command

/**
 * 合并 HTTP 请求参数
 * 云对象 URL 化时，query string 参数会被自动解析到 data 中，
 * 但 POST JSON body 需要手动从 getHttpInfo 中解析。
 * 此函数取两个来源的并集，优先使用 data（query string）。
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

module.exports = {
	_before: function () {
		const clientInfo = this.getClientInfo()
		// 获取设备ID作为用户标识（后续接入 uni-id 后改为 clientInfo.uid）
		this.deviceId = clientInfo.deviceId || 'anonymous'
	},

	// ============================================================
	//  前端调用方法
	// ============================================================

	/**
	 * 获取轮播图列表
	 */
	async getBanner() {
		const result = await db.collection('wallpaper-banner')
			.field('_id, picurl, target, url, appid, sort')
			.orderBy('sort', 'asc')
			.get()
		return { errCode: 0, data: result.data }
	},

	/**
	 * 每日推荐 —— 随机9张已发布壁纸
	 */
	async getRandomWall() {
		const countResult = await db.collection('wallpaper-list')
			.where({ status: 1 })
			.count()
		const total = countResult.total

		if (total === 0) return { errCode: 0, data: [] }

		// 随机跳过一定数量，取9条
		const take = Math.min(9, total)
		const maxSkip = total - take
		const skip = maxSkip > 0 ? Math.floor(Math.random() * maxSkip) : 0

		const result = await db.collection('wallpaper-list')
			.field('_id, smallPicurl, picurl, classid, score, downloadCount, scoreCount, description, tabs, nickname, create_time')
			.where({ status: 1 })
			.skip(skip)
			.limit(take)
			.get()

		return { errCode: 0, data: result.data }
	},

	/**
	 * 获取分类列表
	 * @param {Object} data  { select, pageSize }
	 */
	async getClassify(data = {}) {
			data = mergeData.call(this, data)
		const where = {}
		if (data.select === true) {
			where.select = true
		}

		let query = db.collection('wallpaper-classify')
			.field('_id, name, picurl, sort, updateTime')
			.where(where)
			.orderBy('sort', 'asc')

		if (data.pageSize) {
			query = query.limit(data.pageSize)
		}

		const result = await query.get()
		return { errCode: 0, data: result.data }
	},

	/**
	 * 获取分类下的壁纸列表（分页）
	 * @param {Object} data  { classid, pageNum, pageSize }
	 */
	async getWallList(data = {}) {
			data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1
		const pageSize = data.pageSize || 12
		const skip = (pageNum - 1) * pageSize

		const result = await db.collection('wallpaper-list')
			.field('_id, smallPicurl, picurl, classid, score, downloadCount, scoreCount, description, tabs, nickname, create_time')
			.where({
				classid: data.classid,
				status: 1
			})
			.orderBy('create_time', 'desc')
			.skip(skip)
			.limit(pageSize)
			.get()

		return { errCode: 0, data: result.data }
	},

	/**
	 * 获取单个壁纸详情
	 * @param {Object} data  { id }
	 */
	async getDetailWall(data = {}) {
			data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-list')
			.where({ _id: data.id })
			.get()

		if (result.data.length === 0) {
			return { errCode: 400, errMsg: '壁纸不存在' }
		}
		return { errCode: 0, data: [result.data[0]] }
	},

	/**
	 * 用户评分
	 * @param {Object} data  { wallId, userScore }
	 */
	async setupScore(data = {}) {
			data = mergeData.call(this, data)
		if (!data.wallId || data.userScore === undefined) {
			return { errCode: 400, errMsg: '参数不完整' }
		}
		const wallId = data.wallId
		const userScore = Number(data.userScore)

		// 1. 尝试写入评分记录（唯一索引防重复）
		try {
			await db.collection('wallpaper-user-score').add({
				wallId,
				deviceId: this.deviceId,
				userScore,
				create_time: Date.now()
			})
		} catch (e) {
			// 唯一索引冲突 = 已经评分过
			if (e.code === 11000 || e.message.includes('duplicate')) {
				return { errCode: 400, errMsg: '您已经评分过了' }
			}
			throw e
		}

		// 2. 更新壁纸评分
		const wallResult = await db.collection('wallpaper-list')
			.where({ _id: wallId })
			.get()

		if (wallResult.data.length === 0) {
			return { errCode: 400, errMsg: '壁纸不存在' }
		}

		const wall = wallResult.data[0]
		const oldScore = wall.score || 0
		const oldCount = wall.scoreCount || 0
		const newCount = oldCount + 1
		const newScore = parseFloat(((oldScore * oldCount + userScore) / newCount).toFixed(1))

		await db.collection('wallpaper-list')
			.where({ _id: wallId })
			.update({
				score: newScore,
				scoreCount: newCount
			})

		return { errCode: 0, data: { score: newScore, scoreCount: newCount } }
	},

	/**
	 * 记录下载
	 * @param {Object} data  { wallId }
	 */
	async downloadWall(data = {}) {
			data = mergeData.call(this, data)
		if (!data.wallId) {
			return { errCode: 400, errMsg: '参数不完整' }
		}
		const wallId = data.wallId

		// 1. 写入下载记录
		await db.collection('wallpaper-download-record').add({
			wallId,
			deviceId: this.deviceId,
			create_time: Date.now()
		})

		// 2. 下载次数 +1
		const result = await db.collection('wallpaper-list')
			.where({ _id: wallId })
			.update({
				downloadCount: dbCmd.inc(1)
			})

		return { errCode: 0, data: { updated: result.updated } }
	},

	/**
	 * 获取当前用户信息（下载数 + 评分数）
	 */
	async getUserInfo(data = {}) {
			data = mergeData.call(this, data)
		const [downloadResult, scoreResult] = await Promise.all([
			db.collection('wallpaper-download-record')
				.where({ deviceId: this.deviceId })
				.count(),
			db.collection('wallpaper-user-score')
				.where({ deviceId: this.deviceId })
				.count()
		])

		return {
			errCode: 0,
			data: {
				downloadSize: downloadResult.total,
				scoreSize: scoreResult.total
			}
		}
	},

	/**
	 * 获取用户下载 / 评分历史列表（分页）
	 * @param {Object} data  { type: 'download'|'score', pageNum, pageSize }
	 */
	async getUserWallList(data = {}) {
			data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1
		const pageSize = data.pageSize || 12
		const skip = (pageNum - 1) * pageSize

		let collectionName
		if (data.type === 'download') {
			collectionName = 'wallpaper-download-record'
		} else if (data.type === 'score') {
			collectionName = 'wallpaper-user-score'
		} else {
			return { errCode: 400, errMsg: 'type 参数错误' }
		}

		const result = await db.collection(collectionName)
			.aggregate()
			.match({ deviceId: this.deviceId })
			.sort({ create_time: -1 })
			.skip(skip)
			.limit(pageSize)
			.lookup({
				from: 'wallpaper-list',
				localField: 'wallId',
				foreignField: '_id',
				as: 'wallDetail'
			})
			.end()

		// 展平 lookup 结果，保持与前端 smallPicurl 兼容
		const dataList = result.data.map(item => {
			const wall = (item.wallDetail && item.wallDetail[0]) || {}
			return Object.assign({}, wall, {
				create_time: item.create_time
			})
		})

		return { errCode: 0, data: dataList }
	},

	/**
	 * 获取公告列表（分页）
	 * @param {Object} data  { select, pageNum, pageSize }
	 */
	async getNewsList(data = {}) {
			data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1
		const pageSize = data.pageSize || 10
		const skip = (pageNum - 1) * pageSize

		const where = {}
		if (data.select === true) {
			where.select = true
		}

		const result = await db.collection('wallpaper-news')
			.field('_id, title, select, author, publish_date, view_count, create_time')
			.where(where)
			.orderBy('publish_date', 'desc')
			.skip(skip)
			.limit(pageSize)
			.get()

		return { errCode: 0, data: result.data }
	},

	/**
	 * 获取公告详情
	 * @param {Object} data  { id }
	 */
	async getNewsDetail(data = {}) {
			data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-news')
			.where({ _id: data.id })
			.get()

		if (result.data.length === 0) {
			return { errCode: 400, errMsg: '公告不存在' }
		}

		// 浏览次数 +1
		await db.collection('wallpaper-news')
			.where({ _id: data.id })
			.update({
				view_count: dbCmd.inc(1)
			})

		const news = result.data[0]
		news.view_count = (news.view_count || 0) + 1

		return { errCode: 0, data: news }
	},

		/**
		 * 搜索壁纸（支付宝云不支持 dbCmd.regex，改用 JS 过滤）
		 * @param {Object} data  { keyword, pageNum, pageSize }
		 */
		async searchWall(data = {}) {
				data = mergeData.call(this, data)
			const pageNum = data.pageNum || 1
			const pageSize = data.pageSize || 12
			const keyword = (data.keyword || '').trim()

			if (!keyword) {
				return { errCode: 0, data: [] }
			}

			// 拉取分类名映射（用于按分类名搜索）
			const classifyResult = await db.collection('wallpaper-classify').get()
			const classifyMap = {}
			classifyResult.data.forEach(c => { classifyMap[c._id] = c.name })

			// 拉取全部已发布壁纸，在 JS 中模糊匹配
			const allResult = await db.collection('wallpaper-list')
				.field('_id, smallPicurl, picurl, classid, description, tabs, nickname, create_time')
				.where({ status: 1 })
				.orderBy('create_time', 'desc')
				.limit(200)
				.get()

			const lowerKeyword = keyword.toLowerCase()
			const matched = allResult.data.filter(item => {
				const desc = (item.description || '').toLowerCase()
				const nick = (item.nickname || '').toLowerCase()
				const tabs = (item.tabs || []).join(' ').toLowerCase()
				const cname = (classifyMap[item.classid] || '').toLowerCase()
				return desc.includes(lowerKeyword) ||
				       nick.includes(lowerKeyword) ||
				       tabs.includes(lowerKeyword) ||
				       cname.includes(lowerKeyword)
			})

			const skip = (pageNum - 1) * pageSize
			const paged = matched.slice(skip, skip + pageSize)

			return { errCode: 0, data: paged }
		},


	// ============================================================
	//  后台管理方法 —— 轮播图
	// ============================================================

	/**
	 * 获取所有轮播图
	 */
	async adminGetBanners(data = {}) {
			data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-banner')
			.orderBy('sort', 'asc')
			.get()
		return { errCode: 0, data: result.data }
	},

	/**
	 * 新增轮播图
	 * @param {Object} data  { picurl, target, url, appid, sort }
	 */
	async adminCreateBanner(data = {}) {
			data = mergeData.call(this, data)
		if (!data.picurl) {
			return { errCode: 400, errMsg: '请上传轮播图' }
		}
		const result = await db.collection('wallpaper-banner').add({
			picurl: data.picurl,
			target: data.target || 'page',
			url: data.url || '',
			appid: data.appid || '',
			sort: data.sort || 0,
			create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},

	/**
	 * 编辑轮播图
	 * @param {Object} data  { _id, ... }
	 */
	async adminUpdateBanner(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		const id = data._id
		delete data._id

		await db.collection('wallpaper-banner')
			.where({ _id: id })
			.update(data)
		return { errCode: 0, data: { updated: true } }
	},

	/**
	 * 删除轮播图
	 * @param {Object} data  { _id }
	 */
	async adminDeleteBanner(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		await db.collection('wallpaper-banner')
			.where({ _id: data._id })
			.remove()
		return { errCode: 0, data: { removed: true } }
	},


	// ============================================================
	//  后台管理方法 —— 分类
	// ============================================================

	/**
	 * 获取所有分类（含壁纸数量统计）
	 */
	async adminGetClassifies(data = {}) {
			data = mergeData.call(this, data)
		const result = await db.collection('wallpaper-classify')
			.orderBy('sort', 'asc')
			.get()
		return { errCode: 0, data: result.data }
	},

	/**
	 * 新增分类
	 * @param {Object} data  { name, picurl, sort }
	 */
	async adminCreateClassify(data = {}) {
			data = mergeData.call(this, data)
		if (!data.name || !data.picurl) {
			return { errCode: 400, errMsg: '名称和封面图为必填项' }
		}
		const result = await db.collection('wallpaper-classify').add({
			name: data.name,
			picurl: data.picurl,
			sort: data.sort || 0,
			select: data.select || false,
			updateTime: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},

	/**
	 * 编辑分类
	 * @param {Object} data  { _id, ... }
	 */
	async adminUpdateClassify(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		const id = data._id
		delete data._id

		data.updateTime = Date.now()

		await db.collection('wallpaper-classify')
			.where({ _id: id })
			.update(data)
		return { errCode: 0, data: { updated: true } }
	},

	/**
	 * 删除分类
	 * @param {Object} data  { _id }
	 */
	async adminDeleteClassify(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		// 检查分类下是否还有壁纸
		const wallCount = await db.collection('wallpaper-list')
			.where({ classid: data._id })
			.count()

		if (wallCount.total > 0) {
			return { errCode: 400, errMsg: `该分类下还有 ${wallCount.total} 张壁纸，请先删除壁纸` }
		}

		await db.collection('wallpaper-classify')
			.where({ _id: data._id })
			.remove()
		return { errCode: 0, data: { removed: true } }
	},


	// ============================================================
	//  后台管理方法 —— 壁纸
	// ============================================================

	/**
	 * 获取壁纸列表（含待审核 / 已下架）
	 * @param {Object} data  { classid, status, pageNum, pageSize }
	 */
	async adminGetWalls(data = {}) {
			data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1
		const pageSize = data.pageSize || 20
		const skip = (pageNum - 1) * pageSize

		const where = {}
		if (data.classid) where.classid = data.classid
		if (data.status !== undefined && data.status !== '') where.status = data.status

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-list')
				.where(where)
				.orderBy('create_time', 'desc')
				.skip(skip)
				.limit(pageSize)
				.get(),
			db.collection('wallpaper-list')
				.where(where)
				.count()
		])

		return {
			errCode: 0,
			data: {
				list: listResult.data,
				total: countResult.total,
				pageNum,
				pageSize
			}
		}
	},

	/**
	 * 新增壁纸
	 * @param {Object} data  { classid, smallPicurl, picurl, nickname, description, tabs, status }
	 */
	async adminCreateWall(data = {}) {
			data = mergeData.call(this, data)
		if (!data.classid || !data.picurl || !data.smallPicurl) {
			return { errCode: 400, errMsg: '分类、原图和缩略图为必填项' }
		}
		const result = await db.collection('wallpaper-list').add({
			classid: data.classid,
			smallPicurl: data.smallPicurl,
			picurl: data.picurl,
			nickname: data.nickname || '',
			score: 0,
			description: data.description || '',
			tabs: data.tabs || [],
			downloadCount: 0,
			scoreCount: 0,
			create_time: Date.now(),
			status: data.status !== undefined ? data.status : 1
		})
		return { errCode: 0, data: { id: result.id } }
	},

	/**
	 * 编辑壁纸
	 * @param {Object} data  { _id, ... }
	 */
	async adminUpdateWall(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		const id = data._id
		delete data._id

		await db.collection('wallpaper-list')
			.where({ _id: id })
			.update(data)
		return { errCode: 0, data: { updated: true } }
	},

	/**
	 * 删除壁纸（同时删除关联的评分和下载记录）
	 * @param {Object} data  { _id }
	 */
	async adminDeleteWall(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		const wallId = data._id

		// 删除壁纸本身
		await db.collection('wallpaper-list')
			.where({ _id: wallId })
			.remove()

		// 删除关联的评分记录和下载记录
		await Promise.all([
			db.collection('wallpaper-user-score')
				.where({ wallId })
				.remove(),
			db.collection('wallpaper-download-record')
				.where({ wallId })
				.remove()
		])

		return { errCode: 0, data: { removed: true } }
	},

	/**
	 * 审核壁纸（批量更新状态）
	 * @param {Object} data  { ids: [], status: 0|1|2 }
	 */
	async adminReviewWall(data = {}) {
			data = mergeData.call(this, data)
		if (!data.ids || !data.ids.length) {
			return { errCode: 400, errMsg: '请选择壁纸' }
		}
		if (![0, 1, 2].includes(data.status)) {
			return { errCode: 400, errMsg: '状态值无效' }
		}

		await db.collection('wallpaper-list')
			.where({ _id: dbCmd.in(data.ids) })
			.update({ status: data.status })

		return { errCode: 0, data: { updated: true } }
	},

	/**
	 * 壁纸统计
	 */
	async adminGetWallStats() {
		const [totalResult, statusResult, classResult] = await Promise.all([
			db.collection('wallpaper-list').count(),

			db.collection('wallpaper-list')
				.aggregate()
				.group({
					_id: '$status',
					count: { $sum: 1 }
				})
				.end(),

			db.collection('wallpaper-list')
				.aggregate()
				.group({
					_id: '$classid',
					count: { $sum: 1 }
				})
				.end()
		])

		// 按状态统计
		const byStatus = { published: 0, review: 0, offline: 0 }
		statusResult.data.forEach(item => {
			if (item._id === 0) byStatus.review = item.count
			if (item._id === 1) byStatus.published = item.count
			if (item._id === 2) byStatus.offline = item.count
		})

		return {
			errCode: 0,
			data: {
				total: totalResult.total,
				byStatus,
				byClassify: classResult.data
			}
		}
	},

	/**
	 * 上传图片到云存储（供爬虫使用）
	 * @param {Object} data  { fileName, base64 }
	 * @returns {Object}  { errCode: 0, data: { fileID, cloudURL } }
	 */
	async adminUpload(data = {}) {
			data = mergeData.call(this, data)
		if (!data.fileName || !data.base64) {
			return { errCode: 400, errMsg: 'fileName 和 base64 为必填项' }
		}

		const result = await uniCloud.uploadFile({
			cloudPath: `wallpaper/${data.fileName}`,
			fileContent: Buffer.from(data.base64, 'base64')
		})

		// 获取临时URL（公开读权限下可长期访问）
		const urlResult = await uniCloud.getTempFileURL({
			fileList: [result.fileID]
		})

		return {
			errCode: 0,
			data: {
				fileID: result.fileID,
				cloudURL: urlResult.fileList[0].tempFileURL || result.fileID
			}
		}
	},

	/**
	 * 批量导入壁纸（供爬虫使用）
	 * @param {Object} data  { walls: [{ classid, picurl, smallPicurl, ... }] }
	 */
	async adminBatchImport(data = {}) {
			data = mergeData.call(this, data)
		if (!data.walls || !data.walls.length) {
			return { errCode: 400, errMsg: 'walls 数组为空' }
		}

		const walls = data.walls.map(w => ({
			classid: w.classid,
			smallPicurl: w.smallPicurl,
			picurl: w.picurl,
			nickname: w.nickname || '',
			score: 0,
			description: w.description || '',
			tabs: w.tabs || [],
			downloadCount: 0,
			scoreCount: 0,
			create_time: Date.now(),
			status: w.status !== undefined ? w.status : 1
		}))

		const result = await db.collection('wallpaper-list').add(walls)

		return {
			errCode: 0,
			data: {
				inserted: result.inserted
			}
		}
	},


	// ============================================================
	//  后台管理方法 —— 公告
	// ============================================================

	/**
	 * 获取所有公告
	 * @param {Object} data  { pageNum, pageSize }
	 */
	async adminGetNews(data = {}) {
			data = mergeData.call(this, data)
		const pageNum = data.pageNum || 1
		const pageSize = data.pageSize || 20
		const skip = (pageNum - 1) * pageSize

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-news')
				.orderBy('publish_date', 'desc')
				.skip(skip)
				.limit(pageSize)
				.get(),
			db.collection('wallpaper-news').count()
		])

		return {
			errCode: 0,
			data: {
				list: listResult.data,
				total: countResult.total,
				pageNum,
				pageSize
			}
		}
	},

	/**
	 * 新增公告
	 * @param {Object} data  { title, content, author, select }
	 */
	async adminCreateNews(data = {}) {
			data = mergeData.call(this, data)
		if (!data.title || !data.content) {
			return { errCode: 400, errMsg: '标题和内容为必填项' }
		}
		const result = await db.collection('wallpaper-news').add({
			title: data.title,
			content: data.content,
			author: data.author || '',
			select: data.select || false,
			view_count: 0,
			publish_date: Date.now(),
			create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},

	/**
	 * 编辑公告
	 * @param {Object} data  { _id, ... }
	 */
	async adminUpdateNews(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		const id = data._id
		delete data._id

		await db.collection('wallpaper-news')
			.where({ _id: id })
			.update(data)
		return { errCode: 0, data: { updated: true } }
	},

	/**
	 * 删除公告
	 * @param {Object} data  { _id }
	 */
	async adminDeleteNews(data = {}) {
			data = mergeData.call(this, data)
		if (!data._id) {
			return { errCode: 400, errMsg: '缺少_id' }
		}
		await db.collection('wallpaper-news')
			.where({ _id: data._id })
			.remove()
		return { errCode: 0, data: { removed: true } }
	}
}
