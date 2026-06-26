<template>
	<view class="page">
		<view class="header"><text class="title">轮播图管理</text></view>
		<view class="list">
			<view class="item" v-for="b in items" :key="b._id">
				<image :src="b.picurl" mode="aspectFill" class="thumb"></image>
				<view class="info">
					<text class="meta">排序: {{b.sort}} | 跳转: {{b.target}}</text>
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
		const res = await obj.adminGetBanners()
		if (res.errCode === 0) this.items = res.data
	}
}
</script>

<style lang="scss" scoped>
.page { padding: 30rpx; background: #f5f5f5; min-height: 100vh; }
.header { padding-bottom: 30rpx; }
.title { font-size: 36rpx; font-weight: 700; color: #333; }
.item { background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.thumb { width: 100%; height: 240rpx; border-radius: 8rpx; margin-bottom: 12rpx; }
.meta { font-size: 22rpx; color: #999; }
.empty { text-align: center; padding: 100rpx 0; color: #ccc; }
</style>
