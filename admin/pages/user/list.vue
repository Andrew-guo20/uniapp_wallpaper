<template>
	<view class="user-page">
		<view class="page-header">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back-link">Back</navigator>
			<view>
				<text class="page-title">Users</text>
				<text class="page-sub">{{total}} active identities</text>
			</view>
		</view>

		<view class="summary-strip">
			<view class="summary-item">
				<text class="summary-num">{{totals.downloads}}</text>
				<text class="summary-label">Downloads</text>
			</view>
			<view class="summary-item">
				<text class="summary-num">{{totals.scores}}</text>
				<text class="summary-label">Scores</text>
			</view>
			<view class="summary-item">
				<text class="summary-num">{{totals.favorites}}</text>
				<text class="summary-label">Favorites</text>
			</view>
		</view>

		<view class="user-list" v-if="items.length">
			<view class="user-card" v-for="item in items" :key="item.id">
				<view class="avatar">{{shortId(item.id)}}</view>
				<view class="body">
					<text class="name">{{item.id || 'anonymous'}}</text>
					<view class="metrics">
						<text>Down {{item.downloads || 0}}</text>
						<text>Score {{item.scores || 0}}</text>
						<text>Fav {{item.favorites || 0}}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-icon">ID</text>
			<text>No user activity yet</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			items: [],
			total: 0
		}
	},
	computed: {
		totals() {
			return this.items.reduce((sum, item) => {
				sum.downloads += item.downloads || 0
				sum.scores += item.scores || 0
				sum.favorites += item.favorites || 0
				return sum
			}, { downloads: 0, scores: 0, favorites: 0 })
		}
	},
	async mounted() {
		await this.loadData()
	},
	methods: {
		async loadData() {
			uni.showLoading({ title: 'Loading' })
			try {
				const obj = uniCloud.importObject('wallpaper')
				const res = await obj.adminGetUsers()
				if (res.errCode === 0) {
					this.items = res.data.list || []
					this.total = res.data.total || this.items.length
				}
			} catch (e) {
				console.error('adminGetUsers failed:', e)
			}
			uni.hideLoading()
		},
		shortId(id) {
			return (id || 'AN').slice(0, 2).toUpperCase()
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

.user-page {
	min-height: 100vh;
	padding: 30rpx;
	background: $bg;
}
.page-header {
	display: flex;
	align-items: center;
	gap: 24rpx;
	margin-bottom: 28rpx;
}
.back-link {
	font-size: 26rpx;
	color: $sub;
}
.page-title {
	display: block;
	font-size: 36rpx;
	font-weight: 700;
	color: $text;
}
.page-sub {
	display: block;
	margin-top: 4rpx;
	font-size: 22rpx;
	color: $sub;
}
.summary-strip {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
	margin-bottom: 20rpx;
}
.summary-item {
	background: $card;
	border-radius: 16rpx;
	padding: 22rpx 18rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}
.summary-num {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: $text;
}
.summary-label {
	display: block;
	margin-top: 4rpx;
	font-size: 20rpx;
	color: $sub;
}
.user-card {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	background: $card;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}
.avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 78rpx;
	height: 78rpx;
	border-radius: 18rpx;
	background: linear-gradient(135deg, rgba($green, 0.16), rgba($indigo, 0.16));
	color: $green;
	font-size: 24rpx;
	font-weight: 800;
	flex-shrink: 0;
}
.body {
	min-width: 0;
	flex: 1;
}
.name {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: $text;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.metrics {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
	margin-top: 8rpx;
	font-size: 21rpx;
	color: $sub;
}
.metrics text:first-child {
	color: $green;
}
.metrics text:nth-child(2) {
	color: $amber;
}
.metrics text:nth-child(3) {
	color: $indigo;
}
.empty {
	text-align: center;
	padding: 120rpx 0;
	color: $sub;
}
.empty-icon {
	display: block;
	width: 70rpx;
	height: 70rpx;
	line-height: 70rpx;
	margin: 0 auto 16rpx;
	border-radius: 18rpx;
	background: $card;
	color: $green;
	font-weight: 800;
}
</style>
