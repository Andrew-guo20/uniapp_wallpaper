<template>
	<view class="page">
		<view class="topbar">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">返回</navigator>
			<view>
				<text class="title">轮播图管理</text>
				<text class="subtitle">首页第一屏内容位</text>
			</view>
		</view>

		<view class="list" v-if="items.length">
			<view class="card" v-for="b in items" :key="b._id">
				<image :src="b.picurl" mode="aspectFill" class="img"></image>
				<view class="info">
					<text class="rank">排序 {{b.sort}}</text>
					<text class="meta">跳转 {{b.target === 'page' ? '页面' : '小程序'}}</text>
				</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-title">暂无轮播图</text>
			<text class="empty-text">首页会缺少首屏推荐内容</text>
		</view>
	</view>
</template>

<script>
export default {
	data() { return { items: [] } },
	async mounted() {
		const obj = uniCloud.importObject('wallpaper')
		const res = await obj.adminGetBanners()
		if (res.errCode === 0) this.items = res.data
	}
}
</script>

<style lang="scss" scoped>
$ink: #111827;
$paper: #eef2f5;
$panel: #fff;
$muted: #687386;
$line: #dce3ea;
$amber: #f59e0b;

.page {
	min-height: 100vh;
	padding: 28rpx;
	background: $paper;
	color: $ink;
}
.topbar {
	display: flex;
	align-items: center;
	gap: 22rpx;
	margin: -28rpx -28rpx 24rpx;
	padding: 28rpx;
	background: #101827;
	color: #fff;
}
.back {
	padding: 8rpx 14rpx;
	border: 1rpx solid rgba(255,255,255,.18);
	border-radius: 999rpx;
	font-size: 22rpx;
	color: #cbd5e1;
}
.title {
	display: block;
	font-size: 34rpx;
	font-weight: 800;
}
.subtitle {
	display: block;
	margin-top: 4rpx;
	font-size: 21rpx;
	color: #a8b5c6;
}
.card {
	position: relative;
	padding: 16rpx;
	margin-bottom: 18rpx;
	border-radius: 8rpx;
	background: $panel;
	border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.img {
	width: 100%;
	height: 250rpx;
	border-radius: 6rpx;
	background: #d9e2ea;
}
.info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 14rpx;
}
.rank {
	padding: 6rpx 14rpx;
	border-radius: 999rpx;
	background: rgba($amber,.15);
	color: #a86200;
	font-size: 22rpx;
	font-weight: 800;
}
.meta {
	font-size: 22rpx;
	color: $muted;
}
.empty {
	padding: 120rpx 0;
	text-align: center;
}
.empty-title {
	display: block;
	font-size: 30rpx;
	font-weight: 800;
}
.empty-text {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: $muted;
}
</style>
