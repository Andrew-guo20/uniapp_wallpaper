<template>
	<view class="page">
		<view class="page-header">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">← 返回</navigator>
			<text class="title">分类管理</text>
			<text class="count" v-if="items.length">{{items.length}} 个分类</text>
		</view>

		<view class="card-list">
			<view class="card" v-for="cat in items" :key="cat._id">
				<image :src="cat.picurl" mode="aspectFill" class="cover"></image>
				<view class="info">
					<text class="name">{{cat.name}}</text>
					<text class="meta">排序位置 {{cat.sort}}</text>
				</view>
				<view class="sort-badge">#{{cat.sort}}</view>
			</view>
		</view>

		<view class="empty" v-if="!items.length">
			<text class="empty-icon">📂</text>
			<text>暂无分类</text>
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
$bg: #f0f2f5; $card: #fff; $text: #1a1a2e; $sub: #6b7280; $green: #28B389;
.page { padding: 30rpx; min-height: 100vh; background: $bg; }
.page-header { display: flex; align-items: baseline; gap: 20rpx; margin-bottom: 30rpx; }
.back { font-size: 26rpx; color: $sub; }
.title { font-size: 36rpx; font-weight: 700; color: $text; }
.count { font-size: 24rpx; color: $green; }
.card { display: flex; align-items: center; background: $card; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; gap: 20rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03); }
.cover { width: 80rpx; height: 80rpx; border-radius: 12rpx; flex-shrink: 0; }
.info { flex: 1; }
.name { font-size: 28rpx; font-weight: 600; color: $text; display: block; }
.meta { font-size: 22rpx; color: $sub; display: block; margin-top: 6rpx; }
.sort-badge { font-size: 22rpx; color: $sub; background: $bg; padding: 6rpx 16rpx; border-radius: 12rpx; }
.empty { text-align: center; padding: 120rpx 0; color: $sub; .empty-icon { font-size: 56rpx; display: block; margin-bottom: 16rpx; } }
</style>
