<template>
	<view class="dashboard">
		<view class="header">
			<text class="title">果果壁纸后台</text>
			<text class="sub">数据仪表盘</text>
		</view>

		<!-- 统计卡片 -->
		<view class="stat-grid" v-if="stats">
			<view class="stat-card">
				<text class="stat-num">{{stats.wallCount || 0}}</text>
				<text class="stat-label">壁纸总数</text>
			</view>
			<view class="stat-card">
				<text class="stat-num">{{stats.userCount || 0}}</text>
				<text class="stat-label">用户数</text>
			</view>
			<view class="stat-card">
				<text class="stat-num">{{stats.todayDownloads || 0}}</text>
				<text class="stat-label">今日下载</text>
			</view>
			<view class="stat-card">
				<text class="stat-num">{{stats.uploadPending || 0}}</text>
				<text class="stat-label">待审核</text>
			</view>
		</view>
		<view class="loading" v-else>
			<text>加载中...</text>
		</view>

		<!-- 快捷入口 -->
		<view class="menu-list">
			<navigator url="/pages/wallpaper/list" class="menu-item">
				<text class="menu-icon">🖼️</text>
				<text class="menu-text">壁纸管理</text>
				<text class="menu-arrow">→</text>
			</navigator>
			<navigator url="/pages/classify/list" class="menu-item">
				<text class="menu-icon">📂</text>
				<text class="menu-text">分类管理</text>
				<text class="menu-arrow">→</text>
			</navigator>
			<navigator url="/pages/banner/list" class="menu-item">
				<text class="menu-icon">🎠</text>
				<text class="menu-text">轮播图管理</text>
				<text class="menu-arrow">→</text>
			</navigator>
			<navigator url="/pages/news/list" class="menu-item">
				<text class="menu-icon">📢</text>
				<text class="menu-text">公告管理</text>
				<text class="menu-arrow">→</text>
			</navigator>
			<navigator url="/pages/comment/list" class="menu-item">
				<text class="menu-icon">💬</text>
				<text class="menu-text">评论管理</text>
				<text class="menu-arrow">→</text>
			</navigator>
			<navigator url="/pages/upload/list" class="menu-item">
				<text class="menu-icon">📤</text>
				<text class="menu-text">投稿审核</text>
				<text class="menu-arrow">→</text>
			</navigator>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return { stats: null }
	},
	async mounted() {
		try {
			const obj = uniCloud.importObject('wallpaper')
			const [statsRes, wallRes] = await Promise.all([
				obj.adminGetDashboardStats(),
				obj.adminGetWallStats()
			])
			if (statsRes.errCode === 0 && wallRes.errCode === 0) {
				this.stats = {
					...statsRes.data,
					wallCount: wallRes.data.total,
					publishedCount: wallRes.data.byStatus?.published || 0,
					reviewCount: wallRes.data.byStatus?.review || 0
				}
			}
		} catch (e) {
			console.error('Dashboard load error:', e)
		}
	}
}
</script>

<style lang="scss" scoped>
.dashboard {
	padding: 30rpx;
	min-height: 100vh;
	background: #f5f5f5;
}
.header {
	padding: 40rpx 0 30rpx;
	.title { font-size: 40rpx; font-weight: 700; color: #333; display: block; }
	.sub { font-size: 26rpx; color: #999; margin-top: 8rpx; display: block; }
}
.stat-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	margin-bottom: 40rpx;
}
.stat-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	text-align: center;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
	.stat-num { font-size: 48rpx; font-weight: 700; color: #28B389; display: block; }
	.stat-label { font-size: 24rpx; color: #999; margin-top: 8rpx; display: block; }
}
.menu-list {
	background: #fff;
	border-radius: 16rpx;
	overflow: hidden;
}
.menu-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
	.menu-icon { font-size: 36rpx; margin-right: 20rpx; }
	.menu-text { flex: 1; font-size: 28rpx; color: #333; }
	.menu-arrow { font-size: 24rpx; color: #ccc; }
	&:last-child { border-bottom: none; }
}
.loading { text-align: center; padding: 100rpx 0; color: #999; }
</style>
