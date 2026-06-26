<template>
	<view class="page">
		<view class="header"><text class="title">分类管理</text></view>
		<view class="list">
			<view class="item" v-for="cat in items" :key="cat._id">
				<image :src="cat.picurl" mode="aspectFill" class="thumb"></image>
				<view class="info">
					<text class="name">{{cat.name}}</text>
					<text class="meta">排序: {{cat.sort}}</text>
				</view>
			</view>
		</view>
		<view class="empty" v-if="!items.length"><text>暂无数据</text></view>
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
.page { padding: 30rpx; background: #f5f5f5; min-height: 100vh; }
.header { padding-bottom: 30rpx; }
.title { font-size: 36rpx; font-weight: 700; color: #333; }
.item { display: flex; background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; gap: 20rpx; }
.thumb { width: 80rpx; height: 80rpx; border-radius: 8rpx; }
.info { flex: 1; }
.name { font-size: 28rpx; color: #333; }
.meta { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.empty { text-align: center; padding: 100rpx 0; color: #ccc; }
</style>
