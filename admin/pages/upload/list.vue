<template>
	<view class="page">
		<view class="page-header">
			<navigator url="/pages/index/index" open-type="reLaunch" class="back">← 返回</navigator>
			<text class="title">投稿审核</text>
			<view class="badge" v-if="pendingCount">{{pendingCount}} 待审</view>
		</view>
		<view class="list">
			<view class="card" v-for="u in items" :key="u._id">
				<image :src="u.smallPicurl" mode="aspectFill" class="thumb"></image>
				<view class="body">
					<text class="desc">{{u.description || '无描述'}}</text>
					<view class="meta-row">
						<text class="meta">{{u.tabs?.join(', ') || '无标签'}}</text>
						<view class="status-tag" :class="['tag-review','tag-pass','tag-reject'][u.status] || 'tag-review'">
							{{['待审核','已通过','已拒绝'][u.status] || '待审'}}
						</view>
					</view>
				</view>
				<view class="actions" v-if="u.status === 0">
					<view class="btn pass" @click="review(u._id, 1)">通过</view>
					<view class="btn reject" @click="review(u._id, 2)">拒绝</view>
				</view>
			</view>
		</view>
		<view class="empty" v-if="!items.length"><text class="empty-icon">📤</text><text>暂无投稿</text></view>
	</view>
</template>
<script>
export default {
	data() { return { items: [], pendingCount: 0 } },
	async mounted() { await this.loadData() },
	methods: {
		async loadData() { const obj = uniCloud.importObject('wallpaper'); const res = await obj.adminGetUploads({ pageSize: 50, status: '' }); if (res.errCode === 0) { this.items = res.data.list; this.pendingCount = this.items.filter(i => i.status === 0).length } },
		async review(id, status) {
			const obj = uniCloud.importObject('wallpaper')
			let msg = ''
			if (status === 2) { const r = await uni.showModal({ title: '拒绝原因', editable: true, placeholderText: '填写拒绝原因...' }); if (!r.confirm) return; msg = r.content || '' }
			const res = await obj.adminReviewUpload({ _id: id, status, review_msg: msg })
			if (res.errCode === 0) { uni.showToast({ title: '已处理' }); this.loadData() }
		}
	}
}
</script>
<style lang="scss" scoped>
$bg: #f0f2f5; $card: #fff; $text: #1a1a2e; $sub: #6b7280; $green: #28B389; $amber: #f59e0b; $red: #ef4444;
.page { padding: 30rpx; min-height: 100vh; background: $bg; }
.page-header { display: flex; align-items: baseline; gap: 16rpx; margin-bottom: 30rpx; }
.back { font-size: 26rpx; color: $sub; }
.title { font-size: 36rpx; font-weight: 700; color: $text; }
.badge { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 12rpx; background: rgba($amber,0.15); color: $amber; font-weight: 600; }
.card { display: flex; background: $card; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; gap: 20rpx; align-items: center; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03); }
.thumb { width: 120rpx; height: 90rpx; border-radius: 10rpx; flex-shrink: 0; }
.body { flex: 1; overflow: hidden; }
.desc { font-size: 26rpx; font-weight: 500; color: $text; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.meta { font-size: 22rpx; color: $sub; }
.status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; &.tag-pass { background: rgba($green,0.1); color: $green; } &.tag-review { background: rgba($amber,0.1); color: $amber; } &.tag-reject { background: rgba($red,0.1); color: $red; } }
.actions { display: flex; flex-direction: column; gap: 10rpx; flex-shrink: 0; }
.btn { font-size: 22rpx; font-weight: 600; padding: 8rpx 20rpx; border-radius: 20rpx; text-align: center; &.pass { background: rgba($green,0.1); color: $green; } &.reject { background: rgba($red,0.08); color: $red; } }
.empty { text-align: center; padding: 120rpx 0; color: $sub; .empty-icon { font-size: 56rpx; display: block; margin-bottom: 16rpx; } }
</style>
