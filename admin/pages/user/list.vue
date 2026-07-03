<template>
	<view class="user-page">
		<view class="topbar">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back-link">返回</navigator>
			<view>
				<text class="page-title">用户管理</text>
				<text class="page-sub">{{total}} 个活跃身份</text>
			</view>
		</view>

		<view class="summary-strip">
			<view class="summary-item">
				<text class="summary-label">下载</text>
				<text class="summary-num">{{totals.downloads}}</text>
			</view>
			<view class="summary-item">
				<text class="summary-label">评分</text>
				<text class="summary-num">{{totals.scores}}</text>
			</view>
			<view class="summary-item">
				<text class="summary-label">收藏</text>
				<text class="summary-num">{{totals.favorites}}</text>
			</view>
		</view>

		<view class="user-list" v-if="items.length">
			<view class="user-card" v-for="item in items" :key="item.id">
				<view class="avatar">{{shortId(item.id)}}</view>
				<view class="body">
					<text class="name">{{item.id || 'anonymous'}}</text>
					<view class="metrics">
						<text>下载 {{item.downloads || 0}}</text>
						<text>评分 {{item.scores || 0}}</text>
						<text>收藏 {{item.favorites || 0}}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-title">暂无用户活动</text>
			<text class="empty-text">下载、评分或收藏后会出现在这里</text>
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
			uni.showLoading({ title: '加载中' })
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
$ink: #111827;
$paper: #eef2f5;
$panel: #fff;
$muted: #687386;
$line: #dce3ea;
$green: #12b981;
$blue: #3b82f6;
$amber: #f59e0b;

.user-page { min-height: 100vh; padding: 28rpx; background: $paper; color: $ink; }
.topbar {
	display: flex; align-items: center; gap: 22rpx;
	margin: -28rpx -28rpx 24rpx; padding: 28rpx;
	background: #101827; color: #fff;
}
.back-link { padding: 8rpx 14rpx; border: 1rpx solid rgba(255,255,255,.18); border-radius: 999rpx; font-size: 22rpx; color: #cbd5e1; }
.page-title { display: block; font-size: 34rpx; font-weight: 800; }
.page-sub { display: block; margin-top: 4rpx; font-size: 21rpx; color: #a8b5c6; }
.summary-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14rpx; margin-bottom: 18rpx; }
.summary-item {
	padding: 20rpx; border-radius: 8rpx; background: $panel; border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.summary-label { display: block; font-size: 21rpx; color: $muted; }
.summary-num { display: block; margin-top: 8rpx; font-size: 40rpx; line-height: 1; font-weight: 800; }
.user-card {
	display: flex; align-items: center; gap: 18rpx;
	padding: 18rpx; margin-bottom: 16rpx; border-radius: 8rpx;
	background: $panel; border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.avatar {
	display: flex; align-items: center; justify-content: center;
	width: 78rpx; height: 78rpx; border-radius: 8rpx;
	background: #e8f7f1; color: $green; font-size: 24rpx; font-weight: 800;
}
.body { min-width: 0; flex: 1; }
.name { display: block; font-size: 26rpx; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.metrics { display: flex; flex-wrap: wrap; gap: 14rpx; margin-top: 8rpx; font-size: 21rpx; color: $muted; }
.metrics text:first-child { color: $green; }
.metrics text:nth-child(2) { color: $amber; }
.metrics text:nth-child(3) { color: $blue; }
.empty { padding: 120rpx 0; text-align: center; }
.empty-title { display: block; font-size: 30rpx; font-weight: 800; }
.empty-text { display: block; margin-top: 8rpx; font-size: 22rpx; color: $muted; }
</style>
