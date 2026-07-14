/**
 * 用户投稿相关方法
 */
const { db, mergeData, hasSensitiveWord, msgSecCheck, parsePagination } = require('./common')

module.exports = {

	/**
	 * 提交投稿
	 */
	async submitUpload(data = {}) {
		data = mergeData.call(this, data)
		if (!this.uid) return { errCode: 401, errMsg: '请先登录' }
		if (!data.classid || !data.picurl || !data.smallPicurl)
			return { errCode: 400, errMsg: '分类、原图和缩略图为必填项' }

		// 检测描述文本安全
		const desc = (data.description || '').trim()
		if (desc) {
			if (hasSensitiveWord(desc)) return { errCode: 400, errMsg: '描述包含不当内容，请修改后重试' }
			const check = await msgSecCheck(desc)
			if (!check.pass) return { errCode: 400, errMsg: '描述内容违反平台规范，请修改后重试' }
		}

		// 检测标签文本安全
		const tabs = data.tabs || []
		if (tabs.length) {
			const tabsText = tabs.join(' ')
			if (hasSensitiveWord(tabsText)) return { errCode: 400, errMsg: '标签包含不当内容，请修改后重试' }
			const check = await msgSecCheck(tabsText)
			if (!check.pass) return { errCode: 400, errMsg: '标签内容违反平台规范，请修改后重试' }
		}

		const result = await db.collection('wallpaper-user-upload').add({
			uid: this.uid, picurl: data.picurl, smallPicurl: data.smallPicurl,
			classid: data.classid, description: desc,
			tabs: tabs, status: 0, create_time: Date.now()
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
