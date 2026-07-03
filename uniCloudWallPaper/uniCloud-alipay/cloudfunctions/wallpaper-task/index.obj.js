// 一壁之力 — 定时任务云对象
// v2.0 自动化运营：搜索词统计刷新 / 数据快照

const db = uniCloud.database()
const dbCmd = db.command

module.exports = {
	_timing: async function () {
		const now = new Date()
		const hour = now.getHours()
		const dayOfWeek = now.getDay()
		console.log('[wallpaper-task] tick:', now.toISOString())

		// 每小时：刷新热门搜索词
		await refreshHotKeywords()

		// 每天 03:00：数据快照
		if (hour === 3) {
			await takeDataSnapshot()
		}

		return { errCode: 0, data: { time: now.toISOString() } }
	}
}

async function refreshHotKeywords() {
	const since = Date.now() - 7 * 24 * 60 * 60 * 1000
	try {
		const result = await db.collection('wallpaper-search-history')
			.aggregate()
			.match({ create_time: dbCmd.gte(since) })
			.group({ _id: '$keyword', count: { $sum: 1 } })
			.sort({ count: -1 })
			.limit(20)
			.end()
		console.log('[task] 热门词:', result.data.length)
	} catch (e) {
		console.error('[task] 热门词失败:', e.message)
	}
}

async function takeDataSnapshot() {
	try {
		const [wallCount, dlCount, cmtCount] = await Promise.all([
			db.collection('wallpaper-list').where({ status: 1 }).count(),
			db.collection('wallpaper-download-record').count(),
			db.collection('wallpaper-comments').count()
		])
		await db.collection('wallpaper-data-snapshot').add({
			date: new Date().toISOString().split('T')[0],
			wallCount: wallCount.total,
			downloadCount: dlCount.total,
			commentCount: cmtCount.total,
			create_time: Date.now()
		})
		console.log('[task] 快照已保存')
	} catch (e) {
		console.error('[task] 快照失败:', e.message)
	}
}
