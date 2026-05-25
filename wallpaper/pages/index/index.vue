<template>
	<view class="homeLayout">
		<custom-nav-bar title="推荐"></custom-nav-bar>

		<view class="banner">
			<swiper 
				indicator-dots 
				indicator-color="rgba(255,255,255,0.5)" 
				indicator-active-color="#fff" 
				autoplay
				circular
			>
				<swiper-item v-for="banner in bannerList" :key="banner._id">
					<navigator v-if="banner.target == 'miniProgram'" 
						:url="banner.url"  
						class="like"
						target="miniProgram"
						:app-id="banner.appid"
					>
							<image :src="banner.picurl"  mode="aspectFill"></image>
					</navigator>

					<navigator v-else :url="`/pages/classlist/classlist?${banner.url}`" class="like">
							<image :src="banner.picurl"  mode="aspectFill"></image>
					</navigator>
				</swiper-item>
			</swiper>
		</view>
		
		<view class="notice">
			<view class="left">
				<uni-icons type="sound-filled" size="20"></uni-icons>
				<text class="text">公告</text>
			</view>
			<view class="center">
				<swiper vertical autoplay interval="1500" duration="300" circular>
					<swiper-item v-for="item in noticeList" :key="item._id">
						<navigator :url="`/pages/notice/detail?id=${item._id}`">
							{{item.title}}
						</navigator>
					</swiper-item>
				</swiper>
			</view>
			<view class="right">
				<uni-icons type="right" size="16" color="#333"></uni-icons>
			</view>
		</view>

		<view class="select">
			<common-title>
				<template #name>
					<text>每日推荐</text>
				</template>
				<template #custom>
					<view class="date">
						<uni-icons type="calendar" size="18"></uni-icons>
						<text>						
							<uni-dateformat :date="Date.now()" format="dd日"></uni-dateformat>
						</text>
					</view>
				</template>
			</common-title>
			<view class="content">
				<scroll-view scroll-x>
					<view class="box" v-for="item in dayRandomList" :key="item._id"  @click="goPreview(item._id)">
						<image :src="item.smallPicurl" mode="aspectFill"></image>
					</view>
				</scroll-view>
			</view>
		</view>

		<view class="theme">
			<common-title>
				<template #name>专题精选</template>
				<template #custom>
					<navigator url="/pages/classify/classify" open-type="reLaunch" class="more">More+</navigator>
				</template>
			</common-title>

			<view class="content">
				<theme-item v-for="item in classifyList" :key="item._id" :item="item"></theme-item>
				<theme-item :isMore="true">	</theme-item>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import {onShareAppMessage,onShareTimeline} from '@dcloudio/uni-app'
import { apiGetBanner, apiGetDayRandom,apiGetNotice,apiGetClassify } from '@/API/apis.js'
import commonTitle from '@/components/common-title/common-title.vue'
import themeItem from '@/components/theme-item/theme-item.vue'

// 轮播图
const bannerList = ref([])
const getBanner = async () => {
	let res = await apiGetBanner()
	bannerList.value = res.data
	console.log('轮播图',bannerList.value)
}

// 每日推荐
const dayRandomList = ref([])
const getDayRandom = async () => {
	let res = await apiGetDayRandom()
	dayRandomList.value = res.data
	console.log('每日推荐',dayRandomList.value)
}

// 公告
const noticeList = ref([])
const getNotice = async () => {
	let res = await apiGetNotice({select:true})
	noticeList.value = res.data
	console.log('公告',noticeList.value)
}

// 分类
const classifyList = ref([])
const getClassify = async () => {
	let res = await apiGetClassify(
		{
			select:true
		}
	)
	classifyList.value = res.data
	console.log('分类',classifyList.value)
}

// 跳转预览
const goPreview = (id) => {
	uni.setStorageSync('storageClassList',dayRandomList.value)
	uni.navigateTo({
		url: '/pages/preview/preview?id='+id
	})
}

// 分享给好友
onShareAppMessage(()=>{
	return{
		title:'壁纸推荐',
		path:'/pages/index/index',
	}
})

// 分享给朋友圈
onShareTimeline(()=>{
	return{
		title:'壁纸推荐',
		imageUrl:bannerList.value[0].picurl
	}
})



getBanner()
getDayRandom()
getNotice()
getClassify()
</script>

<style lang="scss" scoped>
.homeLayout{
	.banner{
		width: 750rpx;
		padding: 30rpx 0;
		swiper{
			width:750rpx;
			height:340rpx;
			&-item{
				width: 100%;
				height: 100%;
				padding: 0 30rpx;
				.like{
					width: 100%;
					height: 100%;
					image{
					width: 100%;
					height: 100%;
					border-radius: 10rpx;
				}
				}
				
			}
		}
	}
	.notice{
		width:690rpx;
		height:80rpx;
		line-height:80rpx;
		background-color: #f9f9f9;
		margin: 0 auto;
		border-radius:40rpx;
		display:flex;
		.left{
			width:140rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			:deep(.uni-icons){
				color: $brand-theme-color !important;
			}
			.text{
				color: $brand-theme-color;
				font-weight: 600;
				font-size: 28rpx;
			}
		}
		.center{
			flex:1;
			swiper {
					height:100%;
					&-item {
						height:100%;
						font-size: 30rpx;
						color: #666;
						text-overflow: ellipsis;
						white-space: nowrap;
						overflow: hidden;
					}
				}
		}
		.right{
			width:70rpx;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
	.select{
		padding-top: 50rpx;
		.date{
			color: $brand-theme-color;
			display: flex;
			justify-content: center;
			align-items: center;
			:deep(.uni-icons){
				color: $brand-theme-color !important;
			}
			.text{
				margin-left: 5rpx;
			}
		}
		.content{
			width: 720rpx;
			margin-left: 30rpx;
			margin-top: 30rpx;
			scroll-view{
				white-space: nowrap;
				.box{
					width:200rpx;
					height: 430rpx;
					display: inline-block;
					margin-right: 15rpx;
					image{
						width: 100%;
						height: 100%;
						border-radius: 10rpx;
					}
				}
				.box:last-child{
					margin-right: 30rpx;
				}
			}
		}
	}
	.theme{
		padding-top: 50rpx;
		.more{
			color: $brand-theme-color;
			font-size: 32rpx;
		}
		.content{
			margin-top: 30rpx;
			padding: 0 30rpx;
			display: grid;
			gap:15rpx;
			grid-template-columns: repeat(3, 1fr);
		}
	}
}
</style>
