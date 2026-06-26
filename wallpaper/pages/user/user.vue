<template>
	<view class="userLayout pageBg" v-if="userInfo">
		<view :style="{height:getNavbarHeight()+'px'}"></view>

		<!-- 用户头像区 -->
		<view class="userInfo">
			<view class="avatar" @click="handleAvatarClick">
				<image
					v-if="isLogin && loginUser.avatar"
					:src="loginUser.avatar"
					mode="aspectFill"
				></image>
				<image v-else src="/static/images/xxmLogo.png" mode="aspectFill"></image>
			</view>

			<view class="name" v-if="isLogin">{{loginUser.nickname || '壁纸用户'}}</view>
			<view class="name login-hint" v-else @click="goLogin">点击登录</view>

			<view class="sub" v-if="isLogin">已登录 · 数据已同步</view>
			<view class="sub" v-else>登录后可同步收藏与历史记录</view>
		</view>

		<!-- 数据概览 -->
		<view class="section">
			<view class="list">
				<navigator url="/pages/classlist/classlist?name=我的下载&type=download" open-type="reLaunch">
					<view class="row">
						<view class="left">
							<uni-icons type="download-filled" size="20"></uni-icons>
							<view class="text">我的下载</view>
						</view>
						<view class="right">
							<view class="text">{{userInfo.downloadSize}}</view>
							<uni-icons type="right" size="15" color="#aaa"></uni-icons>
						</view>
					</view>
				</navigator>

				<!-- 我的收藏 — v2.0 新增 -->
				<navigator url="/pages/classlist/classlist?name=我的收藏&type=favorite" open-type="reLaunch">
					<view class="row">
						<view class="left">
							<uni-icons type="heart-filled" size="20"></uni-icons>
							<view class="text">我的收藏</view>
						</view>
						<view class="right">
							<view class="text">{{userInfo.favoriteSize || 0}}</view>
							<uni-icons type="right" size="15" color="#aaa"></uni-icons>
						</view>
					</view>
				</navigator>

				<!-- 我的投稿 — v2.0 新增 -->
				<navigator url="/pages/upload/upload" open-type="navigate">
					<view class="row">
						<view class="left">
							<uni-icons type="image-filled" size="20"></uni-icons>
							<view class="text">我的投稿</view>
						</view>
						<view class="right">
							<uni-icons type="right" size="15" color="#aaa"></uni-icons>
						</view>
					</view>
				</navigator>

				<navigator url="/pages/classlist/classlist?name=我的评分&type=score" open-type="reLaunch">
					<view class="row">
						<view class="left">
							<uni-icons type="star-filled" size="20"></uni-icons>
							<view class="text">我的评分</view>
						</view>
						<view class="right">
							<view class="text">{{userInfo.scoreSize}}</view>
							<uni-icons type="right" size="15" color="#aaa"></uni-icons>
						</view>
					</view>
				</navigator>
			</view>
		</view>

		<!-- 功能入口 -->
		<view class="section">
			<view class="list">
				<view class="row" @click="handleContact">
					<view class="left">
						<uni-icons type="chatboxes-filled" size="20"></uni-icons>
						<view class="text">联系客服</view>
					</view>
					<view class="right">
						<uni-icons type="right" size="15" color="#aaa"></uni-icons>
					</view>
					<!-- #ifdef MP -->
					<button open-type="contact"></button>
					<!-- #endif -->
				</view>

				<navigator url="/pages/notice/detail?id=6a12e64a8183ca0a9f551403&name=订阅更新">
					<view class="row">
						<view class="left">
							<uni-icons type="notification-filled" size="20"></uni-icons>
							<view class="text">订阅更新</view>
						</view>
						<view class="right">
							<uni-icons type="right" size="15" color="#aaa"></uni-icons>
						</view>
					</view>
				</navigator>

				<navigator url="/pages/notice/detail?id=6a12e64b8183ca0a9f551415">
					<view class="row">
						<view class="left">
							<uni-icons type="flag-filled" size="20"></uni-icons>
							<view class="text">常见问题</view>
						</view>
						<view class="right">
							<uni-icons type="right" size="15" color="#aaa"></uni-icons>
						</view>
					</view>
				</navigator>
			</view>
		</view>

		<!-- 退出登录 — 仅登录时显示 -->
		<view class="section" v-if="isLogin">
			<view class="list">
				<view class="row logout-row" @click="handleLogout">
					<view class="left">
						<view class="text logout-text">退出登录</view>
					</view>
				</view>
			</view>
		</view>
	</view>

	<view class="loadingLayout" v-else>
		<view :style="{height:getNavbarHeight()+'px'}"></view>
		<uni-load-more status="loading"></uni-load-more>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getNavbarHeight } from '@/utils/system.js'
import { apiUserInfo } from '@/API/apis.js'
import { isLoggedIn, getUserInfo, logout } from '@/utils/auth.js'

const isLogin = ref(isLoggedIn())
const loginUser = ref(getUserInfo())

const userInfo = ref(null)

const getUserData = async () => {
	const res = await apiUserInfo()
	userInfo.value = res.data
}

getUserData()

// 点击头像
const handleAvatarClick = () => {
	if (!isLogin.value) {
		goLogin()
	}
}

// 跳转登录
const goLogin = () => {
	uni.navigateTo({ url: '/pages/login/login' })
}

// 联系客服
const handleContact = () => {
	// #ifdef H5 || APP-PLUS
	uni.makePhoneCall({ phoneNumber: '15571648972' })
	// #endif
}

// 退出登录
const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				logout()
				isLogin.value = false
				loginUser.value = {}
				// 刷新用户数据（收藏数会归零）
				getUserData()
				uni.showToast({ title: '已退出', icon: 'none' })
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.userLayout{
	.userInfo{
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		padding: 50rpx 0;
		.avatar{
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			overflow: hidden;
			border: 4rpx solid rgba(255,255,255,0.8);
			box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
			image{
				width: 100%;
				height: 100%;
			}
		}
		.name{
			font-size: 44rpx;
			color: $text-font-color-1;
			padding: 20rpx 0 5rpx;
			font-weight: 600;
		}
		.login-hint{
			color: $brand-theme-color;
			cursor: pointer;
		}
		.sub{
			font-size: 24rpx;
			color: $text-font-color-3;
		}
	}
	.section{
		width: 690rpx;
		margin: 25rpx auto;
		border: 1rpx solid #eee;
		border-radius: 16rpx;
		box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.05);
		background-color: #fff;
		overflow: hidden;
		.list{
			.row{
				position: relative;
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 0 30rpx;
				height: 100rpx;
				border-bottom: 1rpx solid #f5f5f5;
				width: 100%;
				box-sizing: border-box;
				.left{
					display: flex;
					align-items: center;
					flex: 1;
					overflow: hidden;
					:deep(.uni-icons){
						color: $brand-theme-color !important;
						flex-shrink: 0;
					}
					.text{
						padding-left: 10rpx;
						color: $text-font-color-2;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				}
				.right{
					display: flex;
					align-items: center;
					flex-shrink: 0;
					margin-left: 10rpx;
					.text{
						font-size: 28rpx;
						color: $text-font-color-3;
					}
				}
				button{
					position: absolute;
					right: 0;
					top: 0;
					width: 100%;
					height: 100%;
					opacity: 0;
				}
			}
			.row:last-child{
				border-bottom: none;
			}
			.logout-row{
				justify-content: center;
				.logout-text{
					color: $uni-color-error;
					padding-left: 0;
				}
			}
		}
	}
}
</style>
