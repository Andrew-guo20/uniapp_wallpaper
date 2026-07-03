<template>
	<view class="edit-page">
		<view class="page-header">
			<view class="back-link" @click="goBack">Back</view>
			<text class="page-title">Edit wallpaper</text>
		</view>

		<view class="preview-card" v-if="form.smallPicurl || form.picurl">
			<image :src="form.smallPicurl || form.picurl" mode="aspectFill"></image>
			<view class="preview-copy">
				<text class="preview-title">{{form.description || 'Untitled wallpaper'}}</text>
				<text class="preview-meta">ID {{form._id || '-'}}</text>
			</view>
		</view>

		<view class="form-card">
			<view class="field">
				<text class="label">Class</text>
				<picker :range="classifies" range-key="name" :value="classIndex" @change="changeClass">
					<view class="picker-value">{{className || 'Select class'}}</view>
				</picker>
			</view>

			<view class="field">
				<text class="label">Description</text>
				<textarea v-model="form.description" class="textarea" maxlength="200"></textarea>
			</view>

			<view class="field">
				<text class="label">Tags</text>
				<input v-model="tagsText" class="input" placeholder="Separate tags with commas" />
			</view>

			<view class="field">
				<text class="label">Status</text>
				<picker :range="statusOptions" range-key="label" :value="statusIndex" @change="changeStatus">
					<view class="picker-value">{{statusOptions[statusIndex].label}}</view>
				</picker>
			</view>

			<button class="save-btn" :loading="saving" :disabled="saving || !form._id" @click="save">Save changes</button>
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
				{ label: 'Review', value: 0 },
				{ label: 'Published', value: 1 },
				{ label: 'Offline', value: 2 }
			],
			statusIndex: 0,
			tagsText: '',
			saving: false
		}
	},
	computed: {
		className() {
			return this.classifies[this.classIndex]?.name || ''
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
				uni.showToast({ title: 'Invalid wallpaper data', icon: 'none' })
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
			this.form.classid = this.classifies[this.classIndex]?._id || this.form.classid
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
				uni.showToast({ title: 'Saved', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 500)
			} else {
				uni.showToast({ title: res.errMsg || 'Save failed', icon: 'none' })
			}
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

.edit-page {
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
	font-size: 36rpx;
	font-weight: 700;
	color: $text;
}
.preview-card,
.form-card {
	background: $card;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}
.preview-card {
	display: flex;
	gap: 20rpx;
	padding: 20rpx;
	margin-bottom: 18rpx;

	image {
		width: 150rpx;
		height: 110rpx;
		border-radius: 10rpx;
		flex-shrink: 0;
	}
}
.preview-copy {
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 8rpx;
}
.preview-title {
	font-size: 28rpx;
	font-weight: 600;
	color: $text;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.preview-meta {
	font-size: 22rpx;
	color: $sub;
}
.form-card {
	padding: 24rpx;
}
.field {
	margin-bottom: 24rpx;
}
.label {
	display: block;
	margin-bottom: 10rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: $sub;
}
.input,
.textarea,
.picker-value {
	box-sizing: border-box;
	width: 100%;
	border-radius: 12rpx;
	background: #f8fafc;
	padding: 18rpx 20rpx;
	font-size: 26rpx;
	color: $text;
}
.textarea {
	height: 150rpx;
}
.picker-value {
	border-left: 6rpx solid $indigo;
}
.save-btn {
	margin-top: 12rpx;
	border-radius: 16rpx;
	background: $green;
	color: #fff;
	font-size: 28rpx;
	font-weight: 700;
}
</style>
