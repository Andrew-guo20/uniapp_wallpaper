<template>
	<view class="wallpaper-page">
		<!-- 页头 -->
		<view class="page-header">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back-link">
				<text>← 返回</text>
			</navigator>
			<text class="page-title">壁纸管理</text>
		</view>

		<!-- 状态筛选 Tab -->
		<view class="filter-tabs">
			<view
				v-for="(tab, i) in tabs"
				:key="i"
				class="filter-tab"
				:class="{ active: activeTab === i }"
				@click="switchTab(i)"
			>
				<text>{{tab.label}}</text>
				<text class="tab-count" v-if="tabCounts[i] !== null">{{tabCounts[i]}}</text>
			</view>
		</view>

		<!-- 统计概览 -->
		<view class="stats-strip" v-if="wallStats">
			<text>共 {{wallStats.total}} 张</text>
			<view class="stats-dot green"></view>
			<text>已发布 {{wallStats.byStatus?.published || 0}}</text>
			<view class="stats-dot amber"></view>
			<text>待审核 {{wallStats.byStatus?.review || 0}}</text>
			<view class="stats-dot red"></view>
			<text>已下架 {{wallStats.byStatus?.offline || 0}}</text>
		</view>

		<!-- 壁纸列表 -->
		<view class="wall-list" v-if="items.length">
			<view class="wall-card" v-for="item in items" :key="item._id">
				<view class="card-thumb">
					<image :src="item.smallPicurl" mode="aspectFill"></image>
					<view
						class="status-dot"
						:class="{
							'status-published': item.status === 1,
							'status-review': item.status === 0,
							'status-offline': item.status === 2
						}"
					></view>
				</view>

				<view class="card-body">
					<text class="card-desc">{{item.description || '无描述'}}</text>
					<view class="card-meta">
						<text class="meta-item">★ {{item.score}}</text>
						<text class="meta-item">↓ {{item.downloadCount}}</text>
						<text class="meta-item" v-if="item.favoriteCount">❤ {{item.favoriteCount}}</text>
					</view>
				</view>

				<view class="card-actions">
					<view
						v-if="item.status !== 1"
						class="action-btn approve"
						@click="reviewItem(item._id, 1)"
					>通过</view>
					<view
						v-if="item.status !== 2"
						class="action-btn offline"
						@click="reviewItem(item._id, 2)"
					>下架</view>
					<view
						class="action-btn delete"
						@click="deleteItem(item._id)"
					>删除</view>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<text class="empty-icon">📭</text>
			<text class="empty-text">暂无壁纸</text>
		</view>

		<!-- 分页 -->
		<view class="pager" v-if="total > pageSize">
			<view
				class="page-btn"
				:class="{ dim: pageNum <= 1 }"
				@click="prevPage"
			>← 上一页</view>
			<text class="page-info">{{pageNum}} / {{Math.ceil(total / pageSize)}}</text>
			<view
				class="page-btn"
				:class="{ dim: pageNum * pageSize >= total }"
				@click="nextPage"
			>下一页 →</view>
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
						statsRes.data.byStatus?.published || 0,
						statsRes.data.byStatus?.review || 0,
						statsRes.data.byStatus?.offline || 0
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
$bg: #f0f2f5;
$card: #ffffff;
$text: #1a1a2e;
$sub: #6b7280;
$green: #28B389;
$amber: #f59e0b;
$red: #ef4444;

.wallpaper-page {
	padding: 30rpx;
	min-height: 100vh;
	background: $bg;
}

// ---- 页头 ----
.page-header {
	display: flex;
	align-items: center;
	gap: 24rpx;
	margin-bottom: 30rpx;
}
.back-link {
	font-size: 26rpx;
	color: $sub;
}
.page-title {
	font-size: 36rpx;
	font-weight: 700;
	color: $text;
}

// ---- 筛选 Tab ----
.filter-tabs {
	display: flex;
	gap: 16rpx;
	margin-bottom: 20rpx;
}
.filter-tab {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 14rpx 28rpx;
	border-radius: 32rpx;
	background: $card;
	font-size: 26rpx;
	color: $sub;
	font-weight: 500;
	transition: all 0.2s;

	&.active {
		background: $green;
		color: #fff;
	}
}
.tab-count {
	font-size: 22rpx;
	opacity: 0.7;
}

// ---- 统计概览 ----
.stats-strip {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 0 24rpx;
	font-size: 22rpx;
	color: $sub;
}
.stats-dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	margin: 0 6rpx 0 14rpx;

	&.green { background: $green; }
	&.amber { background: $amber; }
	&.red   { background: $red; }
}

// ---- 壁纸卡片 ----
.wall-card {
	display: flex;
	background: $card;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	gap: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03);
}
.card-thumb {
	position: relative;
	width: 140rpx;
	height: 100rpx;
	flex-shrink: 0;
	border-radius: 10rpx;
	overflow: hidden;

	image {
		width: 100%;
		height: 100%;
	}
}
.status-dot {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(255,255,255,0.9);

	&.status-published { background: $green; }
	&.status-review    { background: $amber; }
	&.status-offline   { background: $red; }
}
.card-body {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 10rpx;
	overflow: hidden;
}
.card-desc {
	font-size: 28rpx;
	font-weight: 500;
	color: $text;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.card-meta {
	display: flex;
	gap: 20rpx;
}
.meta-item {
	font-size: 22rpx;
	color: $sub;
}
.card-actions {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	justify-content: center;
	flex-shrink: 0;
}
.action-btn {
	font-size: 22rpx;
	font-weight: 600;
	padding: 8rpx 24rpx;
	border-radius: 20rpx;
	text-align: center;

	&.approve { background: rgba($green, 0.1); color: $green; }
	&.offline { background: rgba($amber, 0.1); color: $amber; }
	&.delete  { background: rgba($red, 0.08); color: $red; }
}

// ---- 空状态 ----
.empty-state {
	text-align: center;
	padding: 120rpx 0;
	.empty-icon { font-size: 64rpx; display: block; }
	.empty-text { font-size: 26rpx; color: $sub; display: block; margin-top: 16rpx; }
}

// ---- 分页 ----
.pager {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 32rpx;
	padding: 40rpx 0 20rpx;
}
.page-btn {
	font-size: 26rpx;
	color: $green;
	font-weight: 500;
	padding: 10rpx 24rpx;
	border-radius: 20rpx;
	background: $card;

	&.dim {
		color: #ccc;
		pointer-events: none;
	}
}
.page-info {
	font-size: 24rpx;
	color: $sub;
}
</style>
