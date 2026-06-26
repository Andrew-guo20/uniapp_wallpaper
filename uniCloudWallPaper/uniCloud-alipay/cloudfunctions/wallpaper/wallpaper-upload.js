/**
 * 用户投稿相关方法
 */
const { db, mergeData, parsePagination } = require('./common')

module.exports = {

	/**
	 * 提交投稿
	 */
	async submitUpload(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.classid || !data.picurl || !data.smallPicurl)
			return { errCode: 400, errMsg: '分类、原图和缩略图为必填项' }

		const result = await db.collection('wallpaper-user-upload').add({
			uid: this.uid, picurl: data.picurl, smallPicurl: data.smallPicurl,
			classid: data.classid, description: data.description || '',
			tabs: data.tabs || [], status: 0, create_time: Date.now()
		})
		return { errCode: 0, data: { id: result.id } }
	},

	/**
	 * 我的投稿列表及审核状态
	 */
	async getMyUploads(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		const { pageNum, pageSize, skip } = parsePagination(data, 10)

		const [listResult, countResult] = await Promise.all([
			db.collection('wallpaper-user-upload')
				.where({ uid: this.uid })
				.orderBy('create_time', 'desc').skip(skip).limit(pageSize).get(),
			db.collection('wallpaper-user-upload').where({ uid: this.uid }).count()
		])

		return { errCode: 0, data: { list: listResult.data, total: countResult.total, pageNum, pageSize } }
	}
}
