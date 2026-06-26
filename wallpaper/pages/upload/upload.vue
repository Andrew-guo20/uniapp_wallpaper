<template>
	<view class="pageBg upload-page">
		<custom-nav-bar title="投稿"></custom-nav-bar>

		<view class="upload-body">
			<!-- 图片选择区 — 签名元素 -->
			<view class="image-zone" @click="chooseImage">
				<image
					v-if="previewUrl"
					:src="previewUrl"
					mode="aspectFill"
					class="preview-img"
				></image>
				<view class="image-zone-overlay" v-if="previewUrl">
					<text class="change-hint">点击更换图片</text>
				</view>
				<view class="drop-zone" v-else>
					<view class="plus-ring">
						<text class="plus-icon">+</text>
					</view>
					<text class="drop-title">选择壁纸</text>
					<text class="drop-hint">支持 JPG、PNG 格式，建议分辨率 1080×1920</text>
				</view>
			</view>

			<!-- 分类选择 -->
			<view class="form-group">
				<view class="group-header">
					<text class="group-label">选择分类</text>
					<text class="group-required">必选</text>
				</view>
				<view class="category-grid">
					<view
						v-for="cat in categories"
						:key="cat._id"
						class="cat-chip"
						:class="{ active: form.classid === cat._id }"
						@click="form.classid = cat._id"
					>{{cat.name}}</view>
				</view>
			</view>

			<!-- 描述 -->
			<view class="form-group">
				<view class="group-header">
					<text class="group-label">描述</text>
					<text class="group-optional">选填</text>
				</view>
				<view class="textarea-wrap">
					<textarea
						v-model="form.description"
						placeholder="简单描述壁纸内容，让大家更好地了解它"
						maxlength="200"
						class="desc-input"
					></textarea>
					<text class="char-count">{{form.description.length}}/200</text>
				</view>
			</view>

			<!-- 标签 -->
			<view class="form-group">
				<view class="group-header">
					<text class="group-label">标签</text>
					<text class="group-optional">选填</text>
				</view>
				<view class="input-wrap">
					<input
						v-model="tagsInput"
						placeholder="风景, 自然, 山水"
						class="tag-input"
					/>
				</view>
				<text class="field-hint">多个标签用逗号分隔，便于分类和搜索</text>
			</view>

			<!-- 提交 -->
			<view class="submit-area">
				<button
					class="submit-btn"
					:class="{ ready: canSubmit }"
					:disabled="!canSubmit || submitting"
					:loading="submitting"
					@click="handleSubmit"
				>{{submitting ? '提交中...' : '提交投稿'}}</button>
				<text class="submit-note">内容需审核通过后发布，通常 24 小时内完成</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { apiSubmitUpload, apiGetClassify } from '@/API/apis.js'
import { isLoggedIn } from '@/utils/auth.js'

const previewUrl = ref('')
const tempFilePath = ref('')
const submitting = ref(false)
const categories = ref([])
const tagsInput = ref('')
const form = ref({ classid: '', description: '' })

const canSubmit = computed(() => form.value.classid && tempFilePath.value)

apiGetClassify().then(res => {
	if (res.errCode === 0) categories.value = res.data
})

const chooseImage = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			tempFilePath.value = res.tempFilePaths[0]
			previewUrl.value = res.tempFilePaths[0]
		}
	})
}

const handleSubmit = async () => {
	if (!isLoggedIn()) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 500)
		return
	}
	if (!canSubmit.value) return

	submitting.value = true
	uni.showLoading({ title: '上传中...', mask: true })

	try {
		const tabs = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
		const res = await apiSubmitUpload({
			classid: form.value.classid,
			description: form.value.description,
			tabs,
			picurl: tempFilePath.value,
			smallPicurl: tempFilePath.value
		})
		if (res.errCode === 0) {
			uni.showToast({ title: '投稿成功，等待审核', icon: 'success' })
			setTimeout(() => uni.navigateBack(), 1000)
		} else {
			uni.showToast({ title: res.errMsg || '投稿失败', icon: 'none' })
		}
	} catch (e) {
		console.error(e)
		uni.showToast({ title: '投稿失败，请重试', icon: 'none' })
	} finally {
		submitting.value = false
		uni.hideLoading()
	}
}
</script>

<style lang="scss" scoped>
.upload-page { min-height: 100vh; }

.upload-body {
	padding: 40rpx 30rpx;
	padding-bottom: env(safe-area-inset-bottom);
}

// ---- 图片选择区（签名元素） ----
.image-zone {
	position: relative;
	width: 100%;
	height: 420rpx;
	border-radius: 24rpx;
	overflow: hidden;
	margin-bottom: 48rpx;

	.preview-img {
		width: 100%;
		height: 100%;
	}

	.image-zone-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0,0,0,0.15);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 24rpx;
		transition: background 0.2s;

		.change-hint {
			color: rgba(255,255,255,0.9);
			font-size: 24rpx;
			letter-spacing: 2rpx;
		}
	}
}

.drop-zone {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255,255,255,0.5);
	border: 3rpx dashed rgba($brand-theme-color, 0.35);
	border-radius: 24rpx;
	animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
	0%, 100% { border-color: rgba($brand-theme-color, 0.35); }
	50%      { border-color: rgba($brand-theme-color, 0.65); }
}

.plus-ring {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: rgba($brand-theme-color, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20rpx;

	.plus-icon {
		font-size: 48rpx;
		font-weight: 300;
		color: $brand-theme-color;
		line-height: 1;
	}
}

.drop-title {
	font-size: 30rpx;
	font-weight: 600;
	color: $text-font-color-1;
	margin-bottom: 8rpx;
}

.drop-hint {
	font-size: 22rpx;
	color: $text-font-color-3;
}

// ---- 表单区 ----
.form-group {
	margin-bottom: 40rpx;
}

.group-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;
}

.group-label {
	font-size: 26rpx;
	font-weight: 600;
	color: $text-font-color-1;
	letter-spacing: 2rpx;
}

.group-required {
	font-size: 20rpx;
	color: $uni-color-error;
	padding: 2rpx 12rpx;
	background: rgba($uni-color-error, 0.08);
	border-radius: 8rpx;
}

.group-optional {
	font-size: 20rpx;
	color: $text-font-color-3;
}

// 分类标签
.category-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;

	.cat-chip {
		padding: 16rpx 32rpx;
		border-radius: 40rpx;
		background: rgba(255,255,255,0.65);
		border: 2rpx solid transparent;
		font-size: 26rpx;
		color: $text-font-color-2;
		transition: all 0.2s;

		&.active {
			background: $brand-theme-color;
			border-color: $brand-theme-color;
			color: #fff;
			box-shadow: 0 4rpx 16rpx rgba($brand-theme-color, 0.3);
		}
	}
}

// 输入框
.textarea-wrap, .input-wrap {
	background: rgba(255,255,255,0.65);
	border-radius: 16rpx;
	overflow: hidden;
}

.desc-input {
	width: 100%;
	height: 160rpx;
	padding: 20rpx;
	font-size: 26rpx;
	color: $text-font-color-1;
	box-sizing: border-box;
}

.char-count {
	text-align: right;
	padding: 0 20rpx 16rpx;
	font-size: 20rpx;
	color: $text-font-color-3;
	display: block;
}

.tag-input {
	width: 100%;
	height: 76rpx;
	padding: 0 20rpx;
	font-size: 26rpx;
	color: $text-font-color-1;
	box-sizing: border-box;
}

.field-hint {
	font-size: 22rpx;
	color: $text-font-color-3;
	display: block;
	margin-top: 10rpx;
	padding-left: 4rpx;
}

// 提交
.submit-area {
	margin-top: 60rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.submit-btn {
	width: 100%;
	height: 96rpx;
	background: rgba($brand-theme-color, 0.35);
	color: rgba(255,255,255,0.7);
	border-radius: 60rpx;
	border: none;
	font-size: 32rpx;
	font-weight: 600;
	letter-spacing: 4rpx;
	transition: all 0.25s;

	&.ready {
		background: $brand-theme-color;
		color: #fff;
		box-shadow: 0 8rpx 28rpx rgba($brand-theme-color, 0.35);
	}

	&[disabled] {
		opacity: 1; // 不降低透明度，用颜色区分
	}
}

.submit-note {
	margin-top: 20rpx;
	font-size: 22rpx;
	color: $text-font-color-3;
}
</style>
