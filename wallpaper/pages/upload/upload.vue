<template>
	<view class="pageBg upload-page">
		<custom-nav-bar title="投稿"></custom-nav-bar>

		<view class="upload-body">
			<!-- 选择图片 -->
			<view class="section">
				<view class="section-title">选择壁纸</view>
				<view class="image-area" @click="chooseImage">
					<image v-if="previewUrl" :src="previewUrl" mode="aspectFill" class="preview"></image>
					<view v-else class="placeholder">
						<uni-icons type="plus" size="40" color="#ccc"></uni-icons>
						<text>点击选择图片</text>
					</view>
				</view>
			</view>

			<!-- 选择分类 -->
			<view class="section">
				<view class="section-title">选择分类</view>
				<view class="category-grid">
					<view
						v-for="cat in categories"
						:key="cat._id"
						class="cat-item"
						:class="{ active: form.classid === cat._id }"
						@click="form.classid = cat._id"
					>{{cat.name}}</view>
				</view>
			</view>

			<!-- 描述 -->
			<view class="section">
				<view class="section-title">描述（选填）</view>
				<textarea
					v-model="form.description"
					placeholder="简单描述壁纸内容..."
					maxlength="200"
					class="desc-input"
				></textarea>
			</view>

			<!-- 标签 -->
			<view class="section">
				<view class="section-title">标签（选填，逗号分隔）</view>
				<input
					v-model="tagsInput"
					placeholder="如：风景, 自然, 山水"
					class="tag-input"
				/>
			</view>

			<!-- 提交 -->
			<button
				class="submit-btn"
				:disabled="!canSubmit || submitting"
				:loading="submitting"
				@click="handleSubmit"
			>{{submitting ? '提交中...' : '提交投稿'}}</button>
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
const form = ref({
	classid: '',
	description: ''
})

const canSubmit = computed(() => form.value.classid && tempFilePath.value)

// 加载分类列表
apiGetClassify().then(res => {
	if (res.errCode === 0) categories.value = res.data
})

// 选择图片
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

// 提交
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
		// 实际上传需要先上传图片到云存储，这里用临时路径提交到后端处理
		// 简化方案：将 tempFilePath 作为 picurl 传给后端（后端需支持处理）
		const tabs = tagsInput.value
			.split(',')
			.map(t => t.trim())
			.filter(Boolean)

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
	padding: 30rpx;
	padding-bottom: env(safe-area-inset-bottom);
}

.section {
	margin-bottom: 40rpx;
	.section-title {
		font-size: 28rpx;
		font-weight: 600;
		color: $text-font-color-1;
		margin-bottom: 16rpx;
	}
}

.image-area {
	width: 100%;
	height: 400rpx;
	border-radius: 16rpx;
	overflow: hidden;
	background: rgba(255,255,255,0.6);
	border: 2rpx dashed $border-color;
	.preview { width: 100%; height: 100%; }
	.placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		color: #ccc;
		font-size: 26rpx;
	}
}

.category-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	.cat-item {
		padding: 14rpx 32rpx;
		border-radius: 32rpx;
		background: rgba(255,255,255,0.7);
		border: 2rpx solid $border-color-light;
		font-size: 26rpx;
		color: $text-font-color-2;
		&.active {
			background: $brand-theme-color;
			border-color: $brand-theme-color;
			color: #fff;
		}
	}
}

.desc-input {
	width: 100%;
	height: 160rpx;
	padding: 20rpx;
	border-radius: 12rpx;
	background: rgba(255,255,255,0.7);
	font-size: 26rpx;
	box-sizing: border-box;
}

.tag-input {
	width: 100%;
	height: 72rpx;
	padding: 0 20rpx;
	border-radius: 12rpx;
	background: rgba(255,255,255,0.7);
	font-size: 26rpx;
	box-sizing: border-box;
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	background: $brand-theme-color;
	color: #fff;
	border-radius: 44rpx;
	border: none;
	font-size: 30rpx;
	font-weight: 600;
	margin-top: 30rpx;

	&[disabled] { opacity: 0.5; }
}
</style>
