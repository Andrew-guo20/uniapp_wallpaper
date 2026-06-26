<template>
	<view class="page">
		<view class="page-header">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">← 返回</navigator>
			<text class="title">评论管理</text>
			<text class="count" v-if="items.length">共 {{items.length}} 条</text>
		</view>
		<view class="list">
			<view class="card" v-for="c in items" :key="c._id">
				<text class="content">{{c.content}}</text>
				<view class="meta-row">
					<text class="meta">用户 {{c.uid?.substring(0,8) || '匿名'}}</text>
					<view class="status-tag" :class="['tag-review','tag-pass','tag-reject'][c.status] || 'tag-review'">
						{{['待审','已通过','已拒绝'][c.status] || '待审'}}
					</view>
				</view>
				<view class="actions" v-if="c.status !== 1">
					<view class="btn pass" @click="review(c._id, 1)">通过</view>
					<view class="btn reject" @click="review(c._id, 2)">拒绝</view>
				</view>
			</view>
		</view>
		<view class="empty" v-if="!items.length"><text class="empty-icon">💬</text><text>暂无评论</text></view>
	</view>
</template>
<script>
export default {
	data() { return { items: [] } },
	async mounted() { await this.loadData() },
	methods: {
		async loadData() { const obj = uniCloud.importObject('wallpaper'); const res = await obj.adminGetComments({ pageSize: 50 }); if (res.errCode === 0) this.items = res.data.list },
		async review(id, status) { const obj = uniCloud.importObject('wallpaper'); const res = await obj.adminReviewComment({ _id: id, status }); if (res.errCode === 0) { uni.showToast({ title: '已处理' }); this.loadData() } }
	}
}
</script>
<style lang="scss" scoped>
$bg: #f0f2f5; $card: #fff; $text: #1a1a2e; $sub: #6b7280; $green: #28B389; $amber: #f59e0b; $red: #ef4444;
.page { padding: 30rpx; min-height: 100vh; background: $bg; }
.page-header { display: flex; align-items: baseline; gap: 20rpx; margin-bottom: 30rpx; }
.back { font-size: 26rpx; color: $sub; }
.title { font-size: 36rpx; font-weight: 700; color: $text; }
.count { font-size: 24rpx; color: $green; }
.card { background: $card; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03); }
.content { font-size: 28rpx; color: $text; display: block; line-height: 1.5; }
.meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 14rpx; }
.meta { font-size: 22rpx; color: $sub; }
.status-tag { font-size: 20rpx; padding: 4rpx 14rpx; border-radius: 10rpx; &.tag-pass { background: rgba($green,0.1); color: $green; } &.tag-review { background: rgba($amber,0.1); color: $amber; } &.tag-reject { background: rgba($red,0.1); color: $red; } }
.actions { display: flex; gap: 16rpx; margin-top: 16rpx; }
.btn { font-size: 22rpx; font-weight: 600; padding: 10rpx 24rpx; border-radius: 20rpx; &.pass { background: rgba($green,0.1); color: $green; } &.reject { background: rgba($red,0.08); color: $red; } }
.empty { text-align: center; padding: 120rpx 0; color: $sub; .empty-icon { font-size: 56rpx; display: block; margin-bottom: 16rpx; } }
</style>
