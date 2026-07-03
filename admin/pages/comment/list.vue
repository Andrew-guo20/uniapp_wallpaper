<template>
	<view class="page">
		<view class="topbar">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">返回</navigator>
			<view>
				<text class="title">评论管理</text>
				<text class="subtitle">共 {{items.length}} 条评论</text>
			</view>
		</view>

		<view class="list" v-if="items.length">
			<view class="card" v-for="c in items" :key="c._id">
				<text class="content">{{c.content}}</text>
				<view class="meta-row">
					<text class="meta">用户 {{shortUid(c.uid)}}</text>
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

		<view class="empty" v-else>
			<text class="empty-title">暂无评论</text>
			<text class="empty-text">需要审核的评论会显示在这里</text>
		</view>
	</view>
</template>

<script>
export default {
	data() { return { items: [] } },
	async mounted() { await this.loadData() },
	methods: {
		shortUid(uid) { return uid ? uid.substring(0, 8) : '匿名' },
		async loadData() {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminGetComments({ pageSize: 50 })
			if (res.errCode === 0) this.items = res.data.list
		},
		async review(id, status) {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminReviewComment({ _id: id, status })
			if (res.errCode === 0) { uni.showToast({ title: '已处理' }); this.loadData() }
		}
	}
}
</script>

<style lang="scss" scoped>
$ink: #111827;
$paper: #eef2f5;
$panel: #fff;
$muted: #687386;
$line: #dce3ea;
$green: #12b981;
$amber: #f59e0b;
$red: #ef4444;

.page { min-height: 100vh; padding: 28rpx; background: $paper; color: $ink; }
.topbar {
	display: flex; align-items: center; gap: 22rpx;
	margin: -28rpx -28rpx 24rpx; padding: 28rpx;
	background: #101827; color: #fff;
}
.back { padding: 8rpx 14rpx; border: 1rpx solid rgba(255,255,255,.18); border-radius: 999rpx; font-size: 22rpx; color: #cbd5e1; }
.title { display: block; font-size: 34rpx; font-weight: 800; }
.subtitle { display: block; margin-top: 4rpx; font-size: 21rpx; color: #a8b5c6; }
.card {
	padding: 22rpx; margin-bottom: 16rpx; border-radius: 8rpx;
	background: $panel; border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.content { display: block; font-size: 28rpx; line-height: 1.55; font-weight: 700; }
.meta-row { display: flex; justify-content: space-between; align-items: center; gap: 16rpx; margin-top: 16rpx; }
.meta { font-size: 22rpx; color: $muted; }
.status-tag { padding: 6rpx 14rpx; border-radius: 999rpx; font-size: 21rpx; font-weight: 800; }
.tag-pass { background: rgba($green,.12); color: $green; }
.tag-review { background: rgba($amber,.15); color: #a86200; }
.tag-reject { background: rgba($red,.1); color: $red; }
.actions { display: flex; gap: 14rpx; margin-top: 18rpx; }
.btn { min-width: 90rpx; padding: 9rpx 16rpx; border-radius: 999rpx; text-align: center; font-size: 22rpx; font-weight: 800; }
.pass { background: rgba($green,.12); color: $green; }
.reject { background: rgba($red,.1); color: $red; }
.empty { padding: 120rpx 0; text-align: center; }
.empty-title { display: block; font-size: 30rpx; font-weight: 800; }
.empty-text { display: block; margin-top: 8rpx; font-size: 22rpx; color: $muted; }
</style>
