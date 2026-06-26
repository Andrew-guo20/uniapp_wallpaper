<template>
	<view class="page">
		<view class="header"><text class="title">公告管理</text></view>
		<view class="list">
			<view class="item" v-for="n in items" :key="n._id">
				<text class="name">{{n.title}}</text>
				<text class="meta">浏览 {{n.view_count}} | {{n.select ? '置顶' : '普通'}}</text>
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
		const res = await obj.adminGetNews({ pageSize: 50 })
		if (res.errCode === 0) this.items = res.data.list
	}
}
</script>

<style lang="scss" scoped>
.page { padding: 30rpx; background: #f5f5f5; min-height: 100vh; }
.header { padding-bottom: 30rpx; }
.title { font-size: 36rpx; font-weight: 700; color: #333; }
.item { background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.name { font-size: 28rpx; color: #333; display: block; }
.meta { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.empty { text-align: center; padding: 100rpx 0; color: #ccc; }
</style>
