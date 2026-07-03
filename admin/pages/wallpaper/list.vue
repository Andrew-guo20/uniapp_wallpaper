<template>
	<view class="wallpaper-page">
		<view class="topbar">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back-link">返回</navigator>
			<view>
				<text class="page-title">壁纸管理</text>
				<text class="page-sub">审片、上下架与快速编辑</text>
			</view>
		</view>

		<view class="filter-tabs">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="filter-tab"
				:class="{ active: activeTab === i }"
				@click="switchTab(i)"
			>
				<text class="tab-label">{{tab.label}}</text>
				<text class="tab-count" v-if="tabCounts[i] !== null">{{tabCounts[i]}}</text>
			</view>
		</view>

		<view class="stats-strip" v-if="wallStats">
			<text>共 {{wallStats.total}} 张</text>
			<text class="dot published"></text>
			<text>已发布 {{statusCount('published')}}</text>
			<text class="dot review"></text>
			<text>待审核 {{statusCount('review')}}</text>
			<text class="dot offline"></text>
			<text>已下架 {{statusCount('offline')}}</text>
		</view>

		<view class="wall-list" v-if="items.length">
			<view class="wall-card" v-for="item in items" :key="item._id">
				<view class="thumb-wrap">
					<image :src="item.smallPicurl" mode="aspectFill"></image>
					<text
						class="status-pill"
						:class="{
							'status-published': item.status === 1,
							'status-review': item.status === 0,
							'status-offline': item.status === 2
						}"
					>{{statusText(item.status)}}</text>
				</view>

				<view class="card-body">
					<text class="card-desc">{{item.description || '无描述'}}</text>
					<view class="card-meta">
						<text>评分 {{item.score || 0}}</text>
						<text>下载 {{item.downloadCount || 0}}</text>
						<text v-if="item.favoriteCount">收藏 {{item.favoriteCount}}</text>
					</view>
				</view>

				<view class="card-actions">
					<navigator
						class="action-btn edit"
						:url="'/pages/wallpaper/edit?wall=' + encodeURIComponent(JSON.stringify(item))"
						open-type="navigate"
					>编辑</navigator>
					<view v-if="item.status !== 1" class="action-btn approve" @click="reviewItem(item._id, 1)">通过</view>
					<view v-if="item.status !== 2" class="action-btn offline" @click="reviewItem(item._id, 2)">下架</view>
					<view class="action-btn delete" @click="deleteItem(item._id)">删除</view>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-title">暂无壁纸</text>
			<text class="empty-text">当前筛选条件没有内容</text>
		</view>

		<view class="pager" v-if="total > pageSize">
			<view class="page-btn" :class="{ dim: pageNum <= 1 }" @click="prevPage">上一页</view>
			<text class="page-info">{{pageNum}} / {{Math.ceil(total / pageSize)}}</text>
			<view class="page-btn" :class="{ dim: pageNum * pageSize >= total }" @click="nextPage">下一页</view>
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
			activeTab: 0,
			tabs: [
				{ label: '全部', status: '' },
				{ label: '已发布', status: 1 },
				{ label: '待审核', status: 0 },
				{ label: '已下架', status: 2 }
			],
			tabCounts: [null, null, null, null]
		}
	},
	async mounted() {
		await this.loadData()
	},
	methods: {
		getStatusCount(stats, key) {
			return stats && stats.byStatus ? (stats.byStatus[key] || 0) : 0
		},
		statusCount(key) {
			return this.getStatusCount(this.wallStats, key)
		},
		statusText(status) {
			if (status === 1) return '已发布'
			if (status === 2) return '已下架'
			return '待审核'
		},
		async loadData() {
			uni.showLoading({ title: '加载中' })
			try {
				const obj = uniCloud.importObject('wallpaper')
				const status = this.tabs[this.activeTab].status
				const [listRes, statsRes] = await Promise.all([
					obj.adminGetWalls({ pageNum: this.pageNum, pageSize: this.pageSize, status }),
					obj.adminGetWallStats()
				])
				if (listRes.errCode === 0) {
					this.items = listRes.data.list
					this.total = listRes.data.total
				}
				if (statsRes.errCode === 0) {
					this.wallStats = statsRes.data
					this.tabCounts = [
						statsRes.data.total,
						this.getStatusCount(statsRes.data, 'published'),
						this.getStatusCount(statsRes.data, 'review'),
						this.getStatusCount(statsRes.data, 'offline')
					]
				}
			} catch (e) { console.error(e) }
			uni.hideLoading()
		},
		switchTab(i) {
			this.activeTab = i
			this.pageNum = 1
			this.loadData()
		},
		async reviewItem(id, status) {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminReviewWall({ ids: [id], status })
			if (res.errCode === 0) {
				uni.showToast({ title: status === 1 ? '已通过' : '已下架', icon: 'success' })
				this.loadData()
			}
		},
		async deleteItem(id) {
			const r = await uni.showModal({ title: '确认删除', content: '删除后不可恢复，确定继续？' })
			if (!r.confirm) return
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminDeleteWall({ _id: id })
			if (res.errCode === 0) {
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
$ink: #111827;
$panel: #fff;
$paper: #eef2f5;
$muted: #687386;
$line: #dce3ea;
$green: #12b981;
$amber: #f59e0b;
$red: #ef4444;
$blue: #3b82f6;

.wallpaper-page {
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
.back-link {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(255,255,255,.18);
	font-size: 22rpx;
	color: #cbd5e1;
}
.page-title {
	display: block;
	font-size: 34rpx;
	font-weight: 800;
}
.page-sub {
	display: block;
	margin-top: 4rpx;
	font-size: 21rpx;
	color: #a8b5c6;
}
.filter-tabs {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12rpx;
	margin-bottom: 18rpx;
}
.filter-tab {
	padding: 16rpx 10rpx;
	border-radius: 8rpx;
	background: $panel;
	border: 1rpx solid $line;
	text-align: center;
}
.filter-tab.active {
	background: #102033;
	border-color: #102033;
	color: #fff;
}
.tab-label,
.tab-count {
	display: block;
	font-size: 22rpx;
}
.tab-count {
	margin-top: 4rpx;
	color: $muted;
}
.active .tab-count {
	color: #91f0d1;
}
.stats-strip {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10rpx;
	margin-bottom: 18rpx;
	font-size: 21rpx;
	color: $muted;
}
.dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
}
.published { background: $green; }
.review { background: $amber; }
.offline { background: $red; }
.wall-card {
	display: grid;
	grid-template-columns: 150rpx 1fr auto;
	gap: 18rpx;
	align-items: center;
	padding: 18rpx;
	margin-bottom: 16rpx;
	border-radius: 8rpx;
	background: $panel;
	border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.thumb-wrap {
	position: relative;
	width: 150rpx;
	height: 104rpx;
	border-radius: 6rpx;
	overflow: hidden;
	background: #d9e2ea;
}
.thumb-wrap image {
	width: 100%;
	height: 100%;
}
.status-pill {
	position: absolute;
	left: 8rpx;
	bottom: 8rpx;
	padding: 3rpx 9rpx;
	border-radius: 999rpx;
	background: rgba(16,24,39,.76);
	color: #fff;
	font-size: 18rpx;
}
.status-published { color: #bff9de; }
.status-review { color: #ffe1a3; }
.status-offline { color: #fecaca; }
.card-body {
	min-width: 0;
}
.card-desc {
	display: block;
	font-size: 27rpx;
	font-weight: 700;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.card-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 10rpx;
	font-size: 20rpx;
	color: $muted;
}
.card-actions {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.action-btn {
	min-width: 76rpx;
	padding: 7rpx 12rpx;
	border-radius: 999rpx;
	text-align: center;
	font-size: 21rpx;
	font-weight: 700;
}
.edit { background: rgba($blue,.12); color: $blue; }
.approve { background: rgba($green,.12); color: $green; }
.offline { background: rgba($amber,.14); color: #b66d00; }
.delete { background: rgba($red,.1); color: $red; }
.empty-state {
	padding: 120rpx 0;
	text-align: center;
	color: $muted;
}
.empty-title {
	display: block;
	font-size: 30rpx;
	font-weight: 800;
	color: $ink;
}
.empty-text {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
}
.pager {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
	padding: 30rpx 0;
}
.page-btn {
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: $panel;
	color: $green;
	font-size: 24rpx;
	font-weight: 700;
}
.page-btn.dim {
	color: #b8c1cc;
	pointer-events: none;
}
.page-info {
	font-size: 22rpx;
	color: $muted;
}
</style>
