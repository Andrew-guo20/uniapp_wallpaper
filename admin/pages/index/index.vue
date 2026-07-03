<template>
	<view class="dashboard">
		<!-- 页头 -->
		<view class="page-header">
			<view>
				<text class="header-title">果果壁纸后台</text>
				<text class="header-sub">数据仪表盘</text>
			</view>
			<view class="header-badge" v-if="stats">
				<text>运行中</text>
			</view>
		</view>

		<!-- 统计卡片 -->
		<view class="stat-grid" v-if="stats">
			<view class="stat-card accent-green">
				<text class="stat-num">{{stats.wallCount || 0}}</text>
				<text class="stat-label">壁纸总数</text>
				<text class="stat-sub">已发布 {{stats.publishedCount || 0}}</text>
			</view>
			<view class="stat-card accent-indigo">
				<text class="stat-num">{{stats.userCount || 0}}</text>
				<text class="stat-label">用户数</text>
				<text class="stat-sub">去重设备统计</text>
			</view>
			<view class="stat-card accent-amber">
				<text class="stat-num">{{stats.todayDownloads || 0}}</text>
				<text class="stat-label">今日下载</text>
				<text class="stat-sub">自凌晨 00:00 起</text>
			</view>
			<view class="stat-card accent-red">
				<text class="stat-num">{{stats.uploadPending || 0}}</text>
				<text class="stat-label">待审核</text>
				<text class="stat-sub">投稿 + 评论</text>
			</view>
		</view>
		<view class="stat-loading" v-else>
			<text>加载数据中...</text>
		</view>

		<!-- 快捷管理 -->
		<view class="section-header">
			<text class="section-title">快捷管理</text>
		</view>
		<view class="menu-grid">
			<navigator url="/pages/wallpaper/list" class="menu-card">
				<view class="menu-icon-wrap bg-green">
					<text class="menu-icon">🖼</text>
				</view>
				<text class="menu-label">壁纸管理</text>
				<text class="menu-desc">发布、审核、编辑</text>
			</navigator>

			<navigator url="/pages/classify/list" class="menu-card">
				<view class="menu-icon-wrap bg-indigo">
					<text class="menu-icon">📂</text>
				</view>
				<text class="menu-label">分类管理</text>
				<text class="menu-desc">排序、增删改</text>
			</navigator>

			<navigator url="/pages/banner/list" class="menu-card">
				<view class="menu-icon-wrap bg-amber">
					<text class="menu-icon">🎠</text>
				</view>
				<text class="menu-label">轮播图</text>
				<text class="menu-desc">首页 Banner 管理</text>
			</navigator>

			<navigator url="/pages/news/list" class="menu-card">
				<view class="menu-icon-wrap bg-cyan">
					<text class="menu-icon">📢</text>
				</view>
				<text class="menu-label">公告管理</text>
				<text class="menu-desc">置顶、发布</text>
			</navigator>

			<navigator url="/pages/user/list" class="menu-card">
				<view class="menu-icon-wrap bg-indigo">
					<text class="menu-icon">ID</text>
				</view>
				<text class="menu-label">用户管理</text>
				<text class="menu-desc">活跃数据概览</text>
			</navigator>

			<navigator url="/pages/comment/list" class="menu-card">
				<view class="menu-icon-wrap bg-purple">
					<text class="menu-icon">💬</text>
				</view>
				<text class="menu-label">评论管理</text>
				<text class="menu-desc">审核用户评论</text>
			</navigator>

			<navigator url="/pages/upload/list" class="menu-card">
				<view class="menu-icon-wrap bg-red">
					<text class="menu-icon">📤</text>
				</view>
				<text class="menu-label">投稿审核</text>
				<text class="menu-desc">用户投稿处理</text>
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
			console.error('Dashboard error:', e)
		}
	}
}
</script>

<style lang="scss" scoped>
$bg: #f0f2f5;
$card: #ffffff;
$text: #1a1a2e;
$sub: #6b7280;
$green: #28B389;
$indigo: #6366f1;
$amber: #f59e0b;
$red: #ef4444;
$cyan: #06b6d4;
$purple: #8b5cf6;

.dashboard {
	padding: 40rpx 30rpx;
	min-height: 100vh;
	background: $bg;
}

// ---- 页头 ----
.page-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 40rpx;
}
.header-title {
	font-size: 44rpx;
	font-weight: 700;
	color: $text;
	display: block;
	line-height: 1.2;
}
.header-sub {
	font-size: 26rpx;
	color: $sub;
	display: block;
	margin-top: 6rpx;
}
.header-badge {
	padding: 8rpx 20rpx;
	background: rgba($green, 0.1);
	border-radius: 20rpx;
	font-size: 22rpx;
	color: $green;
	font-weight: 500;
}

// ---- 统计卡片 ----
.stat-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	margin-bottom: 50rpx;
}
.stat-card {
	background: $card;
	border-radius: 16rpx;
	padding: 28rpx 24rpx;
	position: relative;
	overflow: hidden;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 20rpx;
		bottom: 20rpx;
		width: 6rpx;
		border-radius: 0 3rpx 3rpx 0;
	}

	&.accent-green::before  { background: $green; }
	&.accent-indigo::before { background: $indigo; }
	&.accent-amber::before  { background: $amber; }
	&.accent-red::before    { background: $red; }
}
.stat-num {
	font-size: 52rpx;
	font-weight: 700;
	color: $text;
	display: block;
	line-height: 1;
}
.stat-label {
	font-size: 24rpx;
	font-weight: 500;
	color: $sub;
	display: block;
	margin-top: 10rpx;
	text-transform: uppercase;
	letter-spacing: 2rpx;
}
.stat-sub {
	font-size: 20rpx;
	color: #9ca3af;
	display: block;
	margin-top: 6rpx;
}
.stat-loading {
	text-align: center;
	padding: 80rpx 0;
	color: $sub;
}

// ---- 快捷菜单 ----
.section-header {
	margin-bottom: 24rpx;
}
.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: $text;
	letter-spacing: 1rpx;
}
.menu-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
}
.menu-card {
	background: $card;
	border-radius: 16rpx;
	padding: 32rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
	transition: transform 0.15s, box-shadow 0.15s;

	&:active {
		transform: translateY(2rpx);
		box-shadow: 0 1rpx 6rpx rgba(0,0,0,0.02);
	}
}
.menu-icon-wrap {
	width: 80rpx;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16rpx;

	.menu-icon { font-size: 36rpx; }

	&.bg-green  { background: rgba($green, 0.1); }
	&.bg-indigo { background: rgba($indigo, 0.1); }
	&.bg-amber  { background: rgba($amber, 0.1); }
	&.bg-cyan   { background: rgba($cyan, 0.1); }
	&.bg-purple { background: rgba($purple, 0.1); }
	&.bg-red    { background: rgba($red, 0.1); }
}
.menu-label {
	font-size: 26rpx;
	font-weight: 600;
	color: $text;
	display: block;
}
.menu-desc {
	font-size: 20rpx;
	color: $sub;
	display: block;
	margin-top: 4rpx;
}
</style>
