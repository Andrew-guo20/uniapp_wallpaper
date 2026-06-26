/**
 * 评论相关方法 — add / get / delete
 */
const { db, mergeData, hasSensitiveWord, parsePagination } = require('./common')

module.exports = {

	async addComment(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.wallId || !data.content) return { errCode: 400, errMsg: '参数不完整' }

		const content = (data.content || '').trim()
		if (content.length === 0) return { errCode: 400, errMsg: '评论内容不能为空' }
		if (content.length > 500) return { errCode: 400, errMsg: '评论内容不能超过500字' }
		if (hasSensitiveWord(content)) return { errCode: 400, errMsg: '评论包含不当内容，请修改后重试' }

		const result = await db.collection('wallpaper-comments').add({
			wallId: data.wallId, uid: this.uid, content,
			status: 1, create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},

	async getComments(data = {}) {
		data = mergeData.call(this, data)
		if (!data.wallId) return { errCode: 400, errMsg: '参数不完整' }
		const { pageNum, pageSize, skip } = parsePagination(data, 10)

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-comments')
				.where({ wallId: data.wallId, status: 1 })
				.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-comments')
				.where({ wallId: data.wallId, status: 1 }).count()
		])

		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	},

	async deleteComment(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.commentId) return { errCode: 400, errMsg: '参数不完整' }

		const result = await db.collection('wallpaper-comments')
			.where({ _id: data.commentId, uid: this.uid }).remove()
		if (result.deleted === 0) return { errCode: 400, errMsg: '评论不存在或无权删除' }
		return { errCode: 0, data: { removed: true } }
	}
}
