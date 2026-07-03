<template>
	<view class="page">
		<view class="topbar">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">返回</navigator>
			<view>
				<text class="title">投稿审核</text>
				<text class="subtitle">{{pendingCount}} 个待处理投稿</text>
			</view>
		</view>

		<view class="list" v-if="items.length">
			<view class="card" v-for="u in items" :key="u._id">
				<image :src="u.smallPicurl" mode="aspectFill" class="thumb"></image>
				<view class="body">
					<text class="desc">{{u.description || '无描述'}}</text>
					<text class="meta">{{formatTags(u.tabs)}}</text>
					<view class="status-tag" :class="['tag-review','tag-pass','tag-reject'][u.status] || 'tag-review'">
						{{['待审核','已通过','已拒绝'][u.status] || '待审'}}
					</view>
				</view>
				<view class="actions" v-if="u.status === 0">
					<view class="btn pass" @click="review(u._id, 1)">通过</view>
					<view class="btn reject" @click="review(u._id, 2)">拒绝</view>
				</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-title">暂无投稿</text>
			<text class="empty-text">用户投稿会进入这里等待审核</text>
		</view>
	</view>
</template>

<script>
export default {
	data() { return { items: [], pendingCount: 0 } },
	async mounted() { await this.loadData() },
	methods: {
		formatTags(tags) { return Array.isArray(tags) && tags.length ? tags.join(', ') : '无标签' },
		async loadData() {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminGetUploads({ pageSize: 50, status: '' })
			if (res.errCode === 0) {
				this.items = res.data.list
				this.pendingCount = this.items.filter(i => i.status === 0).length
			}
		},
		async review(id, status) {
			const obj = uniCloud.importObject('wallpaper')
			let msg = ''
			if (status === 2) {
				const r = await uni.showModal({ title: '拒绝原因', editable: true, placeholderText: '填写拒绝原因...' })
				if (!r.confirm) return
				msg = r.content || ''
			}
			const res = await obj.adminReviewUpload({ _id: id, status, review_msg: msg })
			if (res.errCode === 0) { uni.showToast({ title: '已处理' }); this.loadData() }
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
$amber: #f59e0b;
$red: #ef4444;

.page { min-height: 100vh; padding: 28rpx; background: $paper; color: $ink; }
.topbar {
	display: flex; align-items: center; gap: 22rpx;
	margin: -28rpx -28rpx 24rpx; padding: 28rpx;
	background: #101827; color: #fff;
}
.back { padding: 8rpx 14rpx; border: 1rpx solid rgba(255,255,255,.18); border-radius: 999rpx; font-size: 22rpx; color: #cbd5e1; }
.title { display: block; font-size: 34rpx; font-weight: 800; }
.subtitle { display: block; margin-top: 4rpx; font-size: 21rpx; color: #a8b5c6; }
.card {
	display: grid; grid-template-columns: 116rpx 1fr auto; gap: 18rpx; align-items: center;
	padding: 18rpx; margin-bottom: 16rpx; border-radius: 8rpx;
	background: $panel; border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.thumb { width: 116rpx; height: 88rpx; border-radius: 6rpx; background: #d9e2ea; }
.body { min-width: 0; }
.desc { display: block; font-size: 27rpx; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: block; margin-top: 7rpx; font-size: 21rpx; color: $muted; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-tag { display: inline-flex; margin-top: 9rpx; padding: 5rpx 12rpx; border-radius: 999rpx; font-size: 20rpx; font-weight: 800; }
.tag-pass { background: rgba($green,.12); color: $green; }
.tag-review { background: rgba($amber,.15); color: #a86200; }
.tag-reject { background: rgba($red,.1); color: $red; }
.actions { display: flex; flex-direction: column; gap: 8rpx; }
.btn { min-width: 78rpx; padding: 8rpx 12rpx; border-radius: 999rpx; text-align: center; font-size: 21rpx; font-weight: 800; }
.pass { background: rgba($green,.12); color: $green; }
.reject { background: rgba($red,.1); color: $red; }
.empty { padding: 120rpx 0; text-align: center; }
.empty-title { display: block; font-size: 30rpx; font-weight: 800; }
.empty-text { display: block; margin-top: 8rpx; font-size: 22rpx; color: $muted; }
</style>
