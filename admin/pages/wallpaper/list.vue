<template>
	<view class="wallpaper-list">
		<!-- 筛选栏 -->
		<view class="filter-bar">
			<picker :range="statusOptions" :value="statusIndex" @change="onStatusChange">
				<view class="filter-item">{{statusOptions[statusIndex]}}</view>
			</picker>
			<view class="filter-item" @click="loadData">
				<text>刷新</text>
			</view>
		</view>

		<!-- 统计概览 -->
		<view class="stats-bar" v-if="wallStats">
			<text>共 {{wallStats.total}} 张 | 已发布 {{wallStats.byStatus?.published || 0}} | 待审核 {{wallStats.byStatus?.review || 0}} | 已下架 {{wallStats.byStatus?.offline || 0}}</text>
		</view>

		<!-- 列表 -->
		<view class="list" v-if="items.length">
			<view class="item" v-for="item in items" :key="item._id">
				<image :src="item.smallPicurl" mode="aspectFill" class="thumb"></image>
				<view class="info">
					<text class="desc">{{item.description || '无描述'}}</text>
					<text class="meta">评分 {{item.score}} | 下载 {{item.downloadCount}} | 收藏 {{item.favoriteCount || 0}}</text>
					<view class="actions">
						<view class="btn pass" v-if="item.status !== 1" @click="reviewItem(item._id, 1)">通过</view>
						<view class="btn reject" v-if="item.status !== 2" @click="reviewItem(item._id, 2)">下架</view>
						<view class="btn delete" @click="deleteItem(item._id)">删除</view>
					</view>
				</view>
			</view>
		</view>
		<view class="empty" v-else>
			<text>暂无数据</text>
		</view>

		<!-- 分页 -->
		<view class="pager" v-if="total > pageSize">
			<view class="page-btn" @click="prevPage" :class="{disabled: pageNum <= 1}">上一页</view>
			<text>{{pageNum}} / {{Math.ceil(total / pageSize)}}</text>
			<view class="page-btn" @click="nextPage" :class="{disabled: pageNum * pageSize >= total}">下一页</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			items: [],
			wallStats: null,
			pageNum: 1,
			pageSize: 20,
			total: 0,
			statusIndex: 0,
			statusOptions: ['全部', '已发布', '待审核', '已下架'],
			statusMap: { 0: '', 1: 1, 2: 0, 3: 2 }
		}
	},
	async mounted() {
		await this.loadData()
	},
	methods: {
		async loadData() {
			uni.showLoading({ title: '加载中' })
			try {
				const obj = uniCloud.importObject('wallpaper')
				const status = this.statusMap[this.statusIndex]
				const [listRes, statsRes] = await Promise.all([
					obj.adminGetWalls({ pageNum: this.pageNum, pageSize: this.pageSize, status }),
					obj.adminGetWallStats()
				])
				if (listRes.errCode === 0) {
					this.items = listRes.data.list
					this.total = listRes.data.total
				}
				if (statsRes.errCode === 0) this.wallStats = statsRes.data
			} catch (e) { console.error(e) }
			uni.hideLoading()
		},
		onStatusChange(e) {
			this.statusIndex = e.detail.value
			this.pageNum = 1
			this.loadData()
		},
		async reviewItem(id, status) {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminReviewWall({ ids: [id], status })
			if (res.errCode === 0) {
				uni.showToast({ title: '操作成功', icon: 'success' })
				this.loadData()
			}
		},
		async deleteItem(id) {
			const res = await uni.showModal({ title: '确认删除', content: '删除后不可恢复' })
			if (!res.confirm) return
			const obj = uniCloud.importObject('wallpaper')
			const r = await obj.adminDeleteWall({ _id: id })
			if (r.errCode === 0) {
				uni.showToast({ title: '已删除', icon: 'success' })
				this.loadData()
			}
		},
		prevPage() { if (this.pageNum > 1) { this.pageNum--; this.loadData() } },
		nextPage() { if (this.pageNum * this.pageSize < this.total) { this.pageNum++; this.loadData() } }
	}
}
</script>

<style lang="scss" scoped>
.wallpaper-list { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }
.filter-bar { display: flex; padding: 20rpx 0; gap: 20rpx; }
.filter-item { background: #fff; padding: 14rpx 28rpx; border-radius: 32rpx; font-size: 26rpx; color: #333; }
.stats-bar { padding: 10rpx 0 20rpx; font-size: 24rpx; color: #999; }
.item { display: flex; background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; gap: 20rpx; }
.thumb { width: 160rpx; height: 120rpx; border-radius: 8rpx; flex-shrink: 0; }
.info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.desc { font-size: 28rpx; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { font-size: 22rpx; color: #999; }
.actions { display: flex; gap: 16rpx; margin-top: 8rpx; }
.btn { font-size: 22rpx; padding: 8rpx 20rpx; border-radius: 20rpx; }
.btn.pass { background: #e8f5e9; color: #28B389; }
.btn.reject { background: #fff3e0; color: #f0ad4e; }
.btn.delete { background: #ffebee; color: #dd524d; }
.empty { text-align: center; padding: 100rpx 0; color: #ccc; }
.pager { display: flex; justify-content: center; align-items: center; gap: 30rpx; padding: 30rpx 0; font-size: 26rpx; }
.page-btn { padding: 10rpx 24rpx; background: #fff; border-radius: 20rpx; }
.page-btn.disabled { opacity: 0.3; }
</style>
