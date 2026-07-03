<template>
	<view class="edit-page">
		<view class="topbar">
			<view class="back-link" @click="goBack">返回</view>
			<view>
				<text class="page-title">编辑壁纸</text>
				<text class="page-sub">调整分类、描述、标签与状态</text>
			</view>
		</view>

		<view class="preview-card" v-if="form.smallPicurl || form.picurl">
			<image :src="form.smallPicurl || form.picurl" mode="aspectFill"></image>
			<view class="preview-copy">
				<text class="preview-title">{{form.description || '未命名壁纸'}}</text>
				<text class="preview-meta">ID {{form._id || '-'}}</text>
			</view>
		</view>

		<view class="form-card">
			<view class="field">
				<text class="label">分类</text>
				<picker :range="classifies" range-key="name" :value="classIndex" @change="changeClass">
					<view class="picker-value">{{className || '选择分类'}}</view>
				</picker>
			</view>

			<view class="field">
				<text class="label">描述</text>
				<textarea v-model="form.description" class="textarea" maxlength="200"></textarea>
			</view>

			<view class="field">
				<text class="label">标签</text>
				<input v-model="tagsText" class="input" placeholder="用逗号分隔标签" />
			</view>

			<view class="field">
				<text class="label">状态</text>
				<picker :range="statusOptions" range-key="label" :value="statusIndex" @change="changeStatus">
					<view class="picker-value">{{statusOptions[statusIndex].label}}</view>
				</picker>
			</view>

			<button class="save-btn" :loading="saving" :disabled="saving || !form._id" @click="save">保存修改</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			form: {},
			classifies: [],
			classIndex: 0,
			statusOptions: [
				{ label: '待审核', value: 0 },
				{ label: '已发布', value: 1 },
				{ label: '已下架', value: 2 }
			],
			statusIndex: 0,
			tagsText: '',
			saving: false
		}
	},
	computed: {
		className() {
			const item = this.classifies[this.classIndex]
			return item ? item.name : ''
		}
	},
	async onLoad(query) {
		if (query.wall) {
			try {
				this.form = JSON.parse(decodeURIComponent(query.wall))
				this.tagsText = Array.isArray(this.form.tabs) ? this.form.tabs.join(', ') : ''
				const statusIndex = this.statusOptions.findIndex(item => item.value === this.form.status)
				this.statusIndex = statusIndex >= 0 ? statusIndex : 0
			} catch (e) {
				uni.showToast({ title: '壁纸数据无效', icon: 'none' })
			}
		}
		await this.loadClassifies()
	},
	methods: {
		goBack() {
			uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/wallpaper/list' }) })
		},
		async loadClassifies() {
			const obj = uniCloud.importObject('wallpaper')
			const res = await obj.adminGetClassifies()
			if (res.errCode !== 0) return
			this.classifies = res.data
			const index = this.classifies.findIndex(item => item._id === this.form.classid)
			this.classIndex = index >= 0 ? index : 0
		},
		changeClass(e) {
			this.classIndex = Number(e.detail.value)
			const item = this.classifies[this.classIndex]
			this.form.classid = item ? item._id : this.form.classid
		},
		changeStatus(e) {
			this.statusIndex = Number(e.detail.value)
			this.form.status = this.statusOptions[this.statusIndex].value
		},
		async save() {
			if (!this.form._id) return
			this.saving = true
			const obj = uniCloud.importObject('wallpaper')
			const payload = {
				_id: this.form._id,
				classid: this.form.classid,
				description: this.form.description || '',
				tabs: this.tagsText.split(',').map(item => item.trim()).filter(Boolean),
				status: this.statusOptions[this.statusIndex].value
			}
			const res = await obj.adminUpdateWall(payload)
			this.saving = false
			if (res.errCode === 0) {
				uni.showToast({ title: '已保存', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 500)
			} else {
				uni.showToast({ title: res.errMsg || '保存失败', icon: 'none' })
			}
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

.edit-page { min-height: 100vh; padding: 28rpx; background: $paper; color: $ink; }
.topbar {
	display: flex; align-items: center; gap: 22rpx;
	margin: -28rpx -28rpx 24rpx; padding: 28rpx;
	background: #101827; color: #fff;
}
.back-link { padding: 8rpx 14rpx; border: 1rpx solid rgba(255,255,255,.18); border-radius: 999rpx; font-size: 22rpx; color: #cbd5e1; }
.page-title { display: block; font-size: 34rpx; font-weight: 800; }
.page-sub { display: block; margin-top: 4rpx; font-size: 21rpx; color: #a8b5c6; }
.preview-card,
.form-card {
	background: $panel; border-radius: 8rpx; border: 1rpx solid $line;
	box-shadow: 0 10rpx 20rpx rgba(17,24,39,.05);
}
.preview-card { display: flex; gap: 18rpx; padding: 18rpx; margin-bottom: 18rpx; }
.preview-card image { width: 160rpx; height: 112rpx; border-radius: 6rpx; background: #d9e2ea; }
.preview-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.preview-title { display: block; font-size: 28rpx; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-meta { display: block; margin-top: 8rpx; font-size: 21rpx; color: $muted; }
.form-card { padding: 22rpx; }
.field { margin-bottom: 24rpx; }
.label { display: block; margin-bottom: 10rpx; font-size: 23rpx; font-weight: 800; color: $muted; }
.input,
.textarea,
.picker-value {
	box-sizing: border-box; width: 100%;
	border-radius: 8rpx; border: 1rpx solid $line;
	background: #f8fafc; padding: 18rpx 20rpx;
	font-size: 26rpx; color: $ink;
}
.textarea { height: 160rpx; }
.picker-value { border-left: 8rpx solid $blue; }
.save-btn {
	margin-top: 12rpx; border-radius: 8rpx;
	background: #102033; color: #fff;
	font-size: 28rpx; font-weight: 800;
}
</style>
