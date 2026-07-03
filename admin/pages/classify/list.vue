<template>
	<view class="page">
		<view class="topbar">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">返回</navigator>
			<view>
				<text class="title">分类管理</text>
				<text class="subtitle">{{items.length}} 个分类，按前台展示顺序排列</text>
			</view>
		</view>

		<view class="card-list" v-if="items.length">
			<view class="card" v-for="cat in items" :key="cat._id">
				<image :src="cat.picurl" mode="aspectFill" class="cover"></image>
				<view class="info">
					<text class="name">{{cat.name}}</text>
					<text class="meta">排序位置 {{cat.sort}}</text>
				</view>
				<view class="sort-badge">#{{cat.sort}}</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-title">暂无分类</text>
			<text class="empty-text">先创建分类后再导入壁纸</text>
		</view>
	</view>
</template>

<script>
export default {
	data() { return { items: [] } },
	async mounted() {
		const obj = uniCloud.importObject('wallpaper')
		const res = await obj.adminGetClassifies()
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
$green: #12b981;

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
	display: grid;
	grid-template-columns: 92rpx 1fr auto;
	gap: 20rpx;
	align-items: center;
	padding: 18rpx;
	margin-bottom: 16rpx;
	border-radius: 8rpx;
	background: $panel;
	border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.cover {
	width: 92rpx;
	height: 92rpx;
	border-radius: 6rpx;
}
.name {
	display: block;
	font-size: 28rpx;
	font-weight: 800;
}
.meta {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: $muted;
}
.sort-badge {
	min-width: 62rpx;
	padding: 8rpx 12rpx;
	border-radius: 999rpx;
	background: #e8f7f1;
	color: $green;
	text-align: center;
	font-size: 22rpx;
	font-weight: 800;
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
