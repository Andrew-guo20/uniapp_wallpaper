<template>
	<view class="page">
		<view class="topbar">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">返回</navigator>
			<view>
				<text class="title">公告管理</text>
				<text class="subtitle">用户可见的运营消息</text>
			</view>
		</view>

		<view class="list" v-if="items.length">
			<view class="item" v-for="n in items" :key="n._id">
				<view class="notice-mark" :class="{ pinned: n.select }"></view>
				<view class="notice-body">
					<text class="name">{{n.title}}</text>
					<text class="meta">浏览 {{n.view_count || 0}} · {{n.select ? '置顶' : '普通'}}</text>
				</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-title">暂无公告</text>
			<text class="empty-text">发布公告后会在这里集中管理</text>
		</view>
	</view>
</template>

<script>
export default {
	data() { return { items: [] } },
	async mounted() {
		const obj = uniCloud.importObject('wallpaper')
		const res = await obj.adminGetNews({ pageSize: 50 })
		if (res.errCode === 0) this.items = res.data.list
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

.page { min-height: 100vh; padding: 28rpx; background: $paper; color: $ink; }
.topbar {
	display: flex; align-items: center; gap: 22rpx;
	margin: -28rpx -28rpx 24rpx; padding: 28rpx;
	background: #101827; color: #fff;
}
.back { padding: 8rpx 14rpx; border: 1rpx solid rgba(255,255,255,.18); border-radius: 999rpx; font-size: 22rpx; color: #cbd5e1; }
.title { display: block; font-size: 34rpx; font-weight: 800; }
.subtitle { display: block; margin-top: 4rpx; font-size: 21rpx; color: #a8b5c6; }
.item {
	display: flex; gap: 18rpx; align-items: center;
	padding: 22rpx; margin-bottom: 16rpx;
	border-radius: 8rpx; background: $panel; border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.notice-mark { width: 10rpx; align-self: stretch; border-radius: 999rpx; background: $green; }
.notice-mark.pinned { background: $amber; }
.notice-body { min-width: 0; flex: 1; }
.name { display: block; font-size: 28rpx; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: block; margin-top: 8rpx; font-size: 22rpx; color: $muted; }
.empty { padding: 120rpx 0; text-align: center; }
.empty-title { display: block; font-size: 30rpx; font-weight: 800; }
.empty-text { display: block; margin-top: 8rpx; font-size: 22rpx; color: $muted; }
</style>
