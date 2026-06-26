<template>
	<view class="page">
		<view class="page-header">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">← 返回</navigator>
			<text class="title">轮播图管理</text>
		</view>
		<view class="list">
			<view class="card" v-for="b in items" :key="b._id">
				<image :src="b.picurl" mode="aspectFill" class="img"></image>
				<view class="info">
					<text class="meta">排序 {{b.sort}} · 跳转 {{b.target === 'page' ? '页面' : '小程序'}}</text>
				</view>
			</view>
		</view>
		<view class="empty" v-if="!items.length"><text class="empty-icon">🎠</text><text>暂无轮播图</text></view>
	</view>
</template>
<script>
export default {
	data() { return { items: [] } },
	async mounted() { const obj = uniCloud.importObject('wallpaper'); const res = await obj.adminGetBanners(); if (res.errCode === 0) this.items = res.data }
}
</script>
<style lang="scss" scoped>
$bg: #f0f2f5; $card: #fff; $text: #1a1a2e; $sub: #6b7280;
.page { padding: 30rpx; min-height: 100vh; background: $bg; }
.page-header { display: flex; align-items: baseline; gap: 20rpx; margin-bottom: 30rpx; }
.back { font-size: 26rpx; color: $sub; }
.title { font-size: 36rpx; font-weight: 700; color: $text; }
.card { background: $card; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03); }
.img { width: 100%; height: 240rpx; border-radius: 10rpx; margin-bottom: 12rpx; }
.meta { font-size: 22rpx; color: $sub; }
.empty { text-align: center; padding: 120rpx 0; color: $sub; .empty-icon { font-size: 56rpx; display: block; margin-bottom: 16rpx; } }
</style>
