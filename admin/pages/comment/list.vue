<template>
	<view class="page">
		<view class="header"><text class="title">评论管理</text></view>
		<view class="list">
			<view class="item" v-for="c in items" :key="c._id">
				<text class="content">{{c.content}}</text>
				<view class="meta">
					<text>用户: {{c.uid?.substring(0,8)}} | 状态: {{['待审','已通过','已拒绝'][c.status] || c.status}}</text>
				</view>
				<view class="actions" v-if="c.status !== 1">
					<view class="btn pass" @click="review(c._id, 1)">通过</view>
					<view class="btn del" @click="review(c._id, 2)">拒绝</view>
				</view>
			</view>
		</view>
		<view class="empty" v-if="!items.length"><text>暂无评论</text></view>
	</view>
</template>

<script>
export default {
	data() { return { items: [] } },
	async mounted() { await this.loadData() },
	methods: {
		async loadData() {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminGetComments({ pageSize: 50 })
			if (res.errCode === 0) this.items = res.data.list
		},
		async review(id, status) {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminReviewComment({ _id: id, status })
			if (res.errCode === 0) { uni.showToast({ title: '操作成功' }); this.loadData() }
		}
	}
}
</script>

<style lang="scss" scoped>
.page { padding: 30rpx; background: #f5f5f5; min-height: 100vh; }
.header { padding-bottom: 30rpx; }
.title { font-size: 36rpx; font-weight: 700; color: #333; }
.item { background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.content { font-size: 28rpx; color: #333; display: block; }
.meta { font-size: 22rpx; color: #999; display: block; margin: 8rpx 0; }
.actions { display: flex; gap: 16rpx; }
.btn { font-size: 22rpx; padding: 8rpx 20rpx; border-radius: 20rpx; }
.btn.pass { background: #e8f5e9; color: #28B389; }
.btn.del { background: #ffebee; color: #dd524d; }
.empty { text-align: center; padding: 100rpx 0; color: #ccc; }
</style>
