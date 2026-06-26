/**
 * 个性化推荐 — 基于用户行为标签权重
 */
const { db, mergeData } = require('./common')

module.exports = {

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
					.field('wallId').limit(100).get(),
				db.collection('wallpaper-user-score')
					.where(db.command.or([{ uid: this.uid }, { deviceId: this.deviceId }]))
					.field('wallId, userScore').limit(100).get(),
				this.uid ? db.collection('wallpaper-favorites').where({ uid: this.uid }).field('wallId').limit(100).get()
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
					.field('tabs').limit(100).get()

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
						.field('_id, smallPicurl, picurl, classid, score, downloadCount, scoreCount, description, tabs, nickname, create_time')
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
			.field('_id, smallPicurl, picurl, classid, score, downloadCount, scoreCount, description, tabs, nickname, create_time')
			.where({ status: 1 }).skip(skip).limit(take).get()

		return { errCode: 0, data: result.data }
	}
}
