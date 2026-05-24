<template>
	<view class="userLayout pageBg" v-if="userInfo">
		<view :style="{height:getNavbarHeight()+'px'}"></view>
		<view class="userInfo">
			<view class="avater">
				<image src="/static/images/xxmLogo.png" mode="aspectFill"></image>
			</view>
			<view class="ip">{{userInfo.IP || '壁纸用户'}}</view>
			<view class="address">来自于：{{userInfo.address?.city || userInfo.address?.province || userInfo.address?.country || '未知'}}</view>
		</view>

		<view class="section">
			<view class="list">
				<navigator url="/pages/classlist/classlist?name=我的下载&type=download" open-type="reLaunch"><view class="row">
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
				<navigator url="/pages/classlist/classlist?name=我的评分&type=score" open-type="reLaunch"><view class="row">
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
				<view class="row">
					<view class="left">
						<button></button>
						<uni-icons type="chatboxes-filled" size="20"></uni-icons>
						<view class="text">联系客服</view>
					</view>
					<!-- #ifdef MP -->
					 <button open-type="contact">联系客服</button>
					<!-- #endif -->

					<!-- #ifdef H5 || APP-PLUS -->
					<button @click="clickContact">拨打电话</button>
					<!-- #endif -->
					<view class="right">
						<view class="text">33</view>
						<uni-icons type="right" size="15" color="#aaa"></uni-icons>
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="list">
				<navigator url="/pages/notice/detail?id=6a12e64a8183ca0a9f551403&name=订阅更新"><view class="row">
					<view class="left">
						<uni-icons type="notification-filled" size="20"></uni-icons>
						<view class="text">订阅更新</view>
					</view>
					<view class="right">
						<uni-icons type="right" size="15" color="#aaa"></uni-icons>
					</view>
				</view>
				</navigator>
				<navigator url="/pages/notice/detail?id=6a12e64b8183ca0a9f551415"><view class="row">
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
	</view>

	<view class="loadingLayout" v-else>
		<view :style="{height:getNavbarHeight()+'px'}"></view>
		<uni-load-more status="loading"></uni-load-more>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { getNavbarHeight } from '@/utils/system.js'
import { apiUserInfo } from '@/API/apis.js'
const clickContact = () => {
	uni.makePhoneCall({
		phoneNumber: '15571648972'
	})
}

const userInfo = ref(null)
const getUserInfo = async () => {
	apiUserInfo().then(res => {
		console.log(res)
    userInfo.value = res.data
	})
}
getUserInfo()
</script>

<style lang="scss" scoped>
.userLayout{
	.userInfo{
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		padding: 50rpx 0;
		.avater{
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			overflow: hidden;
			image{
				width: 100%;
				height: 100%;
			}
		}
		.ip{
			font-size: 44rpx;
			color: #333;
			padding: 20rpx 0 5rpx;
		}
		.address{
			font-size: 28rpx;
			color: #aaa;
		}
	}
	.section{
		width: 690rpx;
		margin: 50rpx auto;
		border: 1rpx solid #eee;
		border-radius: 10rpx;
		box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.05);
		background-color: #fff;
		.list{
			.row{
				position: relative;
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 0 30rpx;
				height: 100rpx;
				border-bottom: 1rpx solid #eee;
				width: 100%;
				box-sizing: border-box;
				.left{
					display: flex;
					align-items: center;
					flex: 1;
					overflow: hidden;
					:deep(.uni-icons){
						color: $brand-theme-color;
						flex-shrink: 0;
					}
					.text{
						padding-left: 10rpx;
						color: #666;
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
						color: #aaa;
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
		}
	}
}
</style>