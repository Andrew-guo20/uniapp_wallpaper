<template>
	<view class="noticeLayout">
		<view class="title">
			<view class="tag" v-if="detail.select">
							<uni-tag inverted text="置顶" type="error" />
			</view>
			<view class="font">{{detail.title}}</view>			
		</view>
		
		<view class="info">
			<view class="item">{{detail.author}}</view>					
			<view class="item">
				<uni-dateformat :date="detail.publish_date" format="yyyy-MM-dd hh:mm:ss"></uni-dateformat>
			</view>	
		</view>
		
		
		<view class="content">		
			<!-- <rich-text :nodes="detail.content"></rich-text> -->
			<mp-html :content="detail.content"/>
		</view>
		
		<view class="count">
			阅读 {{detail.view_count}}	
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import uniTag from '@/uni_modules/uni-tag/components/uni-tag/uni-tag.vue'
import uniDateformat from '@/uni_modules/uni-dateformat/components/uni-dateformat/uni-dateformat.vue'
import { apiNoticeDetail } from '@/API/apis.js'
import mpHtml from '@/uni_modules/mp-html/components/mp-html/mp-html.vue'
import {onLoad,onShareAppMessage,onShareTimeline} from '@dcloudio/uni-app'

let noticeId;
let pageName;
onLoad((e)=>{
	if(e.name){
		pageName = e.name
		uni.setNavigationBarTitle({
			title:pageName
		})
	}
	noticeId = e.id
	getNoticeDetail(noticeId)
})
const detail = ref({})
const getNoticeDetail = (noticeId)=>{
	apiNoticeDetail({id:noticeId}).then(res =>{
		detail.value = res.data
		console.log(detail.value)
	})
}
// 分享给好友
onShareAppMessage(()=>{
	return{
		title:'壁纸推荐，'+pageName,
		path:'/pages/notice/detail?id='+noticeId+'&name='+pageName,
	}
})

// 分享给朋友圈
onShareTimeline(()=>{
	return{
		title:'壁纸推荐，'+pageName,
		query:'id='+noticeId+'&name='+pageName,
	}
})
</script>

<style lang="scss" scoped>
.noticeLayout{
	padding:30rpx;
		.title{
			font-size: 40rpx;
			color:#111;
			line-height: 1.6em;
			padding-bottom:30rpx;
			display: flex;
			.tag{
				transform: scale(0.8);
				transform-origin: left center;
				flex-shrink: 0;	
			}
			.font{
				padding-left:6rpx;
			}
		}
		.info{
			display: flex;
			align-items: center;
			color:#999;
			font-size: 28rpx;
			.item{
				padding-right: 20rpx;
			}
		}
		.content{
			padding:50rpx 0;
		}
		.count{
			color:#999;
			font-size: 28rpx;
		}
}
</style>
