<template>
	<view class="dashboard">
		<view class="topbar">
			<view class="brand">
				<text class="brand-name">一壁之力</text>
				<text class="brand-sub">运营工作台</text>
			</view>
			<view class="status-pill" :class="{ muted: !stats }">
				<text class="status-dot"></text>
				<text>{{stats ? '数据已连接' : '读取中'}}</text>
			</view>
		</view>

		<view class="brief-panel">
			<view class="brief-main">
				<text class="brief-label">今日重点</text>
				<text class="brief-title">先处理待审内容，再看增长</text>
				<text class="brief-copy">投稿、壁纸状态和日下载量集中在这里，进入后台第一眼就知道该先做什么。</text>
			</view>
			<view class="wall-rail">
				<text class="rail-block tone-green"></text>
				<text class="rail-block tone-blue"></text>
				<text class="rail-block tone-amber"></text>
				<text class="rail-block tone-red"></text>
			</view>
			<view class="priority-list">
				<navigator url="/pages/upload/list" class="priority-item urgent">
					<text class="priority-num">{{stats ? (stats.uploadPending || 0) : '--'}}</text>
					<text class="priority-text">投稿待审</text>
				</navigator>
				<navigator url="/pages/wallpaper/list" class="priority-item">
					<text class="priority-num">{{stats ? (stats.reviewCount || 0) : '--'}}</text>
					<text class="priority-text">壁纸待审</text>
				</navigator>
			</view>
		</view>

		<view class="metric-board" v-if="stats">
			<view class="metric-card metric-total">
				<text class="metric-label">壁纸总数</text>
				<text class="metric-value">{{stats.wallCount || 0}}</text>
				<text class="metric-note">库存规模</text>
			</view>
			<view class="metric-card">
				<text class="metric-label">已发布</text>
				<text class="metric-value">{{stats.publishedCount || 0}}</text>
				<text class="metric-note">线上可见内容</text>
			</view>
			<view class="metric-card">
				<text class="metric-label">用户数</text>
				<text class="metric-value">{{stats.userCount || 0}}</text>
				<text class="metric-note">去重设备统计</text>
			</view>
			<view class="metric-card">
				<text class="metric-label">今日下载</text>
				<text class="metric-value">{{stats.todayDownloads || 0}}</text>
				<text class="metric-note">自 00:00 起</text>
			</view>
		</view>
		<view class="loading-panel" v-else>
			<text class="loading-bar"></text>
			<text>正在读取运营数据</text>
		</view>

		<view class="section-header">
			<text class="section-title">管理入口</text>
			<text class="section-sub">按日常操作频率排序</text>
		</view>

		<view class="work-list">
			<navigator url="/pages/wallpaper/list" class="work-item primary">
				<text class="work-icon">图</text>
				<view class="work-copy">
					<text class="work-title">壁纸管理</text>
					<text class="work-desc">发布、审核、编辑和上下架</text>
				</view>
				<text class="work-arrow">›</text>
			</navigator>
			<navigator url="/pages/upload/list" class="work-item warning">
				<text class="work-icon">审</text>
				<view class="work-copy">
					<text class="work-title">投稿审核</text>
					<text class="work-desc">处理用户投稿，通过后发布</text>
				</view>
				<text class="work-arrow">›</text>
			</navigator>
			<navigator url="/pages/comment/list" class="work-item">
				<text class="work-icon">评</text>
				<view class="work-copy">
					<text class="work-title">评论管理</text>
					<text class="work-desc">查看和处理用户评论</text>
				</view>
				<text class="work-arrow">›</text>
			</navigator>
			<navigator url="/pages/classify/list" class="work-item">
				<text class="work-icon">类</text>
				<view class="work-copy">
					<text class="work-title">分类管理</text>
					<text class="work-desc">维护分类、排序和展示名称</text>
				</view>
				<text class="work-arrow">›</text>
			</navigator>
			<navigator url="/pages/banner/list" class="work-item">
				<text class="work-icon">播</text>
				<view class="work-copy">
					<text class="work-title">轮播图</text>
					<text class="work-desc">配置首页焦点位</text>
				</view>
				<text class="work-arrow">›</text>
			</navigator>
			<navigator url="/pages/news/list" class="work-item">
				<text class="work-icon">告</text>
				<view class="work-copy">
					<text class="work-title">公告管理</text>
					<text class="work-desc">发布通知和活动说明</text>
				</view>
				<text class="work-arrow">›</text>
			</navigator>
			<navigator url="/pages/user/list" class="work-item">
				<text class="work-icon">人</text>
				<view class="work-copy">
					<text class="work-title">用户管理</text>
					<text class="work-desc">查看用户和活跃概况</text>
				</view>
				<text class="work-arrow">›</text>
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
					publishedCount: this.getStatusCount(wallRes.data, 'published'),
					reviewCount: this.getStatusCount(wallRes.data, 'review')
				}
			}
		} catch (e) {
			console.error('Dashboard error:', e)
		}
	},
	methods: {
		getStatusCount(stats, key) {
			return stats && stats.byStatus ? (stats.byStatus[key] || 0) : 0
		}
	}
}
</script>

<style lang="scss" scoped>
$ink: #111827;
$panel: #ffffff;
$paper: #f4f7f9;
$muted: #647084;
$line: #dbe4ec;
$green: #10b981;
$blue: #2563eb;
$amber: #f59e0b;
$red: #ef4444;

.dashboard {
	min-height: 100vh;
	padding: 24px;
	background: $paper;
	color: $ink;
	box-sizing: border-box;
}

.topbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	max-width: 1180px;
	margin: 0 auto 18px;
}

.brand-name {
	display: block;
	font-size: 14px;
	font-weight: 800;
	color: $green;
}

.brand-sub {
	display: block;
	margin-top: 2px;
	font-size: 28px;
	line-height: 1.15;
	font-weight: 800;
}

.status-pill {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 32px;
	padding: 0 12px;
	border-radius: 8px;
	border: 1px solid rgba(16, 185, 129, .22);
	background: rgba(16, 185, 129, .08);
	color: #047857;
	font-size: 13px;
	white-space: nowrap;
}

.status-pill.muted {
	border-color: $line;
	background: $panel;
	color: $muted;
}

.status-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: $green;
}

.status-pill.muted .status-dot {
	background: #94a3b8;
}

.brief-panel {
	position: relative;
	display: grid;
	grid-template-columns: 1fr 92px 280px;
	align-items: stretch;
	gap: 18px;
	max-width: 1180px;
	margin: 0 auto 18px;
	padding: 22px;
	border: 1px solid $line;
	border-radius: 8px;
	background: $panel;
	box-shadow: 0 16px 40px rgba(17, 24, 39, .06);
	overflow: hidden;
}

.brief-panel::before {
	content: "";
	position: absolute;
	left: 0;
	top: 0;
	width: 5px;
	height: 100%;
	background: $green;
}

.brief-main {
	padding-left: 4px;
}

.brief-label {
	display: block;
	font-size: 12px;
	font-weight: 800;
	color: $green;
}

.brief-title {
	display: block;
	margin-top: 8px;
	font-size: 30px;
	line-height: 1.2;
	font-weight: 900;
}

.brief-copy {
	display: block;
	max-width: 620px;
	margin-top: 10px;
	font-size: 14px;
	line-height: 1.7;
	color: $muted;
}

.wall-rail {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 6px;
	padding: 5px;
	border-radius: 8px;
	background: #edf3f0;
}

.rail-block {
	display: block;
	min-height: 44px;
	border-radius: 6px;
}

.tone-green { background: linear-gradient(160deg, #d1fae5, #10b981); }
.tone-blue { background: linear-gradient(160deg, #dbeafe, #2563eb); }
.tone-amber { background: linear-gradient(160deg, #fef3c7, #f59e0b); }
.tone-red { background: linear-gradient(160deg, #fee2e2, #ef4444); }

.priority-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px;
}

.priority-item {
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-height: 112px;
	padding: 16px;
	border-radius: 8px;
	border: 1px solid $line;
	background: #f8fafc;
	box-sizing: border-box;
}

.priority-item.urgent {
	border-color: rgba(245, 158, 11, .35);
	background: #fff8eb;
}

.priority-num {
	display: block;
	font-size: 34px;
	line-height: 1;
	font-weight: 900;
}

.priority-text {
	display: block;
	margin-top: 10px;
	font-size: 13px;
	color: $muted;
}

.metric-board {
	display: grid;
	grid-template-columns: 1.3fr 1fr 1fr 1fr;
	gap: 14px;
	max-width: 1180px;
	margin: 0 auto 22px;
}

.metric-card {
	min-height: 132px;
	padding: 18px;
	border: 1px solid $line;
	border-radius: 8px;
	background: $panel;
	box-sizing: border-box;
}

.metric-total {
	background: #102033;
	border-color: #102033;
	color: #fff;
}

.metric-label {
	display: block;
	font-size: 13px;
	color: $muted;
}

.metric-total .metric-label,
.metric-total .metric-note {
	color: #c8d3df;
}

.metric-value {
	display: block;
	margin-top: 16px;
	font-size: 38px;
	line-height: 1;
	font-weight: 900;
}

.metric-note {
	display: block;
	margin-top: 12px;
	font-size: 12px;
	color: $muted;
}

.loading-panel {
	display: flex;
	align-items: center;
	gap: 10px;
	max-width: 1180px;
	min-height: 90px;
	margin: 0 auto 22px;
	padding: 20px;
	border: 1px solid $line;
	border-radius: 8px;
	background: $panel;
	color: $muted;
	box-sizing: border-box;
}

.loading-bar {
	width: 46px;
	height: 6px;
	border-radius: 6px;
	background: $green;
}

.section-header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	max-width: 1180px;
	margin: 0 auto 12px;
	gap: 16px;
}

.section-title {
	font-size: 20px;
	font-weight: 800;
}

.section-sub {
	font-size: 13px;
	color: $muted;
}

.work-list {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
	max-width: 1180px;
	margin: 0 auto;
}

.work-item {
	display: flex;
	align-items: center;
	gap: 14px;
	min-height: 82px;
	padding: 14px;
	border: 1px solid $line;
	border-radius: 8px;
	background: $panel;
	box-sizing: border-box;
	transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}

.work-item:active {
	transform: translateY(1px);
}

.work-item.primary {
	border-color: rgba(16, 185, 129, .32);
}

.work-item.warning {
	border-color: rgba(245, 158, 11, .4);
}

.work-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	flex: 0 0 44px;
	border-radius: 8px;
	background: #e8f7f1;
	color: $green;
	font-size: 16px;
	font-weight: 800;
}

.warning .work-icon {
	background: #fff4dd;
	color: #b45309;
}

.work-copy {
	display: flex;
	flex: 1;
	min-width: 0;
	flex-direction: column;
}

.work-title {
	display: block;
	font-size: 16px;
	font-weight: 800;
}

.work-desc {
	display: block;
	margin-top: 5px;
	font-size: 13px;
	color: $muted;
	line-height: 1.35;
}

.work-arrow {
	color: #94a3b8;
	font-size: 28px;
	line-height: 1;
}

@media screen and (max-width: 900px) {
	.brief-panel {
		grid-template-columns: 1fr;
	}

	.wall-rail {
		display: none;
	}

	.metric-board {
		grid-template-columns: repeat(2, 1fr);
	}

	.work-list {
		grid-template-columns: 1fr;
	}
}

@media screen and (max-width: 520px) {
	.dashboard {
		padding: 18px;
	}

	.topbar,
	.section-header {
		align-items: flex-start;
		flex-direction: column;
	}

	.brief-title {
		font-size: 25px;
	}

	.priority-list,
	.metric-board {
		grid-template-columns: 1fr;
	}
}
</style>
