<template>
	<view class="pageBg login-page">
		<!-- 导航栏 -->
		<custom-nav-bar title="登录"></custom-nav-bar>

		<!-- 主体内容 -->
		<view class="login-body">
			<!-- 品牌标识 -->
			<view class="brand">
				<view class="brand-icon">
					<text class="icon-text">🍎</text>
				</view>
				<text class="brand-name">果果壁纸</text>
				<text class="brand-desc">精选高清壁纸，每日更新</text>
			</view>

			<!-- 登录按钮区 -->
			<view class="login-action">
				<!-- 微信登录按钮 -->
				<view
					class="wechat-btn"
					:class="{ disabled: loading }"
					@click="handleLogin"
				>
					<view class="btn-content" v-if="!loading">
						<text>微信一键登录</text>
					</view>
					<text v-else>登录中...</text>
				</view>

				<!-- 登录提示 -->
				<text class="login-tip">授权登录即表示同意 用户协议 和 隐私政策</text>
			</view>

			<!-- 游客入口 -->
			<view class="guest-entry" @click="handleGuest">
				<text>暂不登录，先看看</text>
				<text class="arrow">→</text>
			</view>
		</view>
	</view>
</template>

<script>
import { apiLogin } from '@/API/apis.js'
import { saveLogin } from '@/utils/auth.js'

export default {
	data() {
		return {
			loading: false,
			redirect: ''
		}
	},
	onLoad(options = {}) {
		this.redirect = options.redirect ? decodeURIComponent(options.redirect) : ''
	},
	methods: {
		async handleLogin() {
			if (this.loading) return
			this.loading = true

			try {
				// 1. 获取微信登录 code
				const loginRes = await uni.login({ provider: 'weixin' })
				if (!loginRes.code) {
					uni.showToast({ title: '获取登录凭证失败', icon: 'none' })
					this.loading = false
					return
				}

				// 2. 调用后端登录
				const res = await apiLogin(loginRes.code)
				if (res.errCode !== 0) {
					uni.showToast({ title: res.errMsg || '登录失败', icon: 'none' })
					this.loading = false
					return
				}

				// 3. 保存登录信息
				const { token, userInfo } = res.data
				saveLogin(token, userInfo)

				// 4. 更新全局登录状态
				const app = getApp()
				app.globalData.isLogin = true
				app.globalData.userInfo = userInfo
				uni.$emit('loginStateChanged', userInfo)

				uni.showToast({ title: '登录成功', icon: 'success' })

				// 5. 延迟返回上一页
				setTimeout(() => {
					if (this.redirect) {
						uni.redirectTo({ url: this.redirect })
					} else {
						uni.navigateBack()
					}
				}, 600)

			} catch (e) {
				console.error('login error:', e)
				uni.showToast({ title: '登录失败，请重试', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		handleGuest() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss" scoped>
.login-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.login-body {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0 60rpx;
	padding-bottom: env(safe-area-inset-bottom);
}

// 品牌标识区
.brand {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 120rpx;

	.brand-icon {
		width: 120rpx;
		height: 120rpx;
		border-radius: 30rpx;
		background: rgba(255, 255, 255, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 30rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);

		.icon-text {
			font-size: 56rpx;
		}
	}

	.brand-name {
		font-size: 40rpx;
		font-weight: 700;
		color: $text-font-color-1;
		margin-bottom: 12rpx;
	}

	.brand-desc {
		font-size: 26rpx;
		color: $text-font-color-2;
		letter-spacing: 2rpx;
	}
}

// 登录按钮区
.login-action {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;

	.wechat-btn {
		width: 100%;
		height: 96rpx;
		background: $brand-theme-color;
		border-radius: 60rpx;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 600;
		color: #fff;
		letter-spacing: 2rpx;
		box-shadow: 0 8rpx 28rpx rgba($brand-theme-color, 0.35);
		transition: transform 0.15s, box-shadow 0.15s;

		&:active {
			transform: scale(0.97);
			box-shadow: 0 4rpx 16rpx rgba($brand-theme-color, 0.25);
		}

		&.disabled {
			opacity: 0.85;
		}

		.btn-content {
			display: flex;
			align-items: center;
			gap: 16rpx;
		}

		.wechat-icon {
			width: 40rpx;
			height: 40rpx;
		}
	}

	.login-tip {
		margin-top: 24rpx;
		font-size: 22rpx;
		color: $text-font-color-3;
		text-align: center;
		line-height: 1.6;
	}
}

// 游客入口
.guest-entry {
	margin-top: 80rpx;
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 28rpx;
	color: $text-font-color-2;

	.arrow {
		font-size: 24rpx;
		opacity: 0.5;
	}
}
</style>
