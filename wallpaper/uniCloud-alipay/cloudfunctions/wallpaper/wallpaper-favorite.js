/**
 * 收藏相关方法 — add / remove / toggle / isFavorited
 */
const { db, dbCmd, mergeData } = require('./common')

module.exports = {

	async addFavorite(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }

		try {
			await db.collection('wallpaper-favorites').add({
				wallId: data.wallId, uid: this.uid, create_time: Date.now()
			})
			await db.collection('wallpaper-list').where({ _id: data.wallId })
				.update({ favoriteCount: dbCmd.inc(1) })
			return { errCode: 0, data: { favorited: true } }
		} catch (e) {
			if (e.code === 11000 || e.message.includes('duplicate'))
				return { errCode: 0, data: { favorited: true, msg: '已收藏' } }
			throw e
		}
	},

	async removeFavorite(data = {}) {
		data = mergeData.call(this, data)
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
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }

		const exist = await db.collection('wallpaper-favorites')
			.where({ wallId: data.wallId, uid: this.uid }).count()

		if (exist.total > 0) return this.removeFavorite(data)
		return this.addFavorite(data)
	},

	async isFavorited(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid || !data.wallIds || !data.wallIds.length)
			return { errCode: 0, data: {} }

		const result = await db.collection('wallpaper-favorites')
			.where({ uid: this.uid, wallId: dbCmd.in(data.wallIds) })
			.field({ wallId: true }).get()

		const favoritedMap = {}
		result.data.forEach(item => { favoritedMap[item.wallId] = true })
		return { errCode: 0, data: favoritedMap }
	}
}
