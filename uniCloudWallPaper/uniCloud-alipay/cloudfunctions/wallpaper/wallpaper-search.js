/**
 * 搜索增强方法 — 热门搜索词 / 搜索历史
 */
const { db, dbCmd, mergeData } = require('./common')

// 搜索词统计缓存集合（存于 wallpaper-search-stats 集合）
const SEARCH_COLLECTION = 'wallpaper-search-history'

module.exports = {

	/**
	 * 获取热门搜索词 TOP 10（近7天）
	 */
	async getHotSearchKeywords(data = {}) {
		data = mergeData.call(this, data)
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
	},

	/**
	 * 获取当前用户搜索历史（最近20条）
	 */
	async getSearchHistory(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid && !this.deviceId) return { errCode: 0, data: [] }

		const where = this.uid
			? { uid: this.uid }
			: { deviceId: this.deviceId }

		const result = await db.collection(SEARCH_COLLECTION)
			.where(where)
			.orderBy('create_time', 'desc')
			.limit(20)
			.get()

		return { errCode: 0, data: result.data.map(item => item.keyword) }
	},

	/**
	 * 清除搜索历史
	 */
	async clearSearchHistory(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid && !this.deviceId) return { errCode: 400, errMsg: '无法识别用户' }

		const where = this.uid
			? { uid: this.uid }
			: { deviceId: this.deviceId }

		await db.collection(SEARCH_COLLECTION).where(where).remove()
		return { errCode: 0, data: { cleared: true } }
	}
}
