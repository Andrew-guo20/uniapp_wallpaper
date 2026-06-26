<template>
	<view class="page">
		<view class="header">
			<text class="title">投稿审核</text>
			<text class="count" v-if="total">待审核 {{pendingCount}} / 共 {{total}}</text>
		</view>
		<view class="list">
			<view class="item" v-for="u in items" :key="u._id">
				<image :src="u.smallPicurl" mode="aspectFill" class="thumb"></image>
				<view class="info">
					<text class="desc">{{u.description || '无描述'}}</text>
					<text class="meta">状态: {{['待审核','已通过','已拒绝'][u.status] || u.status}}</text>
				</view>
				<view class="actions" v-if="u.status === 0">
					<view class="btn pass" @click="review(u._id, 1)">通过</view>
					<view class="btn reject" @click="review(u._id, 2)">拒绝</view>
				</view>
			</view>
		</view>
		<view class="empty" v-if="!items.length"><text>暂无投稿</text></view>
	</view>
</template>

<script>
export default {
	data() { return { items: [], total: 0, pendingCount: 0 } },
	async mounted() { await this.loadData() },
	methods: {
		async loadData() {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminGetUploads({ pageSize: 50, status: '' })
			if (res.errCode === 0) {
				this.items = res.data.list
				this.total = res.data.total
				this.pendingCount = this.items.filter(i => i.status === 0).length
			}
		},
		async review(id, status) {
			const msg = status === 2 ? (await uni.showModal({ title: '拒绝原因', editable: true, placeholderText: '填写拒绝原因...' })).content || '' : ''
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminReviewUpload({ _id: id, status, review_msg: msg })
			if (res.errCode === 0) { uni.showToast({ title: '操作成功' }); this.loadData() }
		}
	}
}
</script>

<style lang="scss" scoped>
.page { padding: 30rpx; background: #f5f5f5; min-height: 100vh; }
.header { padding-bottom: 30rpx; display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 36rpx; font-weight: 700; color: #333; }
.count { font-size: 24rpx; color: #28B389; }
.item { display: flex; background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; gap: 20rpx; align-items: center; }
.thumb { width: 120rpx; height: 90rpx; border-radius: 8rpx; flex-shrink: 0; }
.info { flex: 1; }
.desc { font-size: 26rpx; color: #333; display: block; }
.meta { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.actions { display: flex; flex-direction: column; gap: 10rpx; }
.btn { font-size: 22rpx; padding: 8rpx 16rpx; border-radius: 20rpx; text-align: center; }
.btn.pass { background: #e8f5e9; color: #28B389; }
.btn.reject { background: #ffebee; color: #dd524d; }
.empty { text-align: center; padding: 100rpx 0; color: #ccc; }
</style>
