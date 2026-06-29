<template>
	<view class="classlist">
		<view class="loadingLayout" v-if="!classifyDetailList.length && !noData">
			<uni-load-more status="loading"></uni-load-more>
		</view>
		<view class="content">
			<navigator :url="`/pages/preview/preview?id=${itme._id}`" class="item" 
				v-for="itme in classifyDetailList" 
				:key="itme._id"
			>
				<image :src="itme.smallPicurl" mode="aspectFill"></image>
			</navigator>
		</view>
		<view class="loadingLayout" v-if="classifyDetailList.length || noData">
			<uni-load-more :status="noData?'noMore':'loading'"></uni-load-more>
		</view>
		<view class="safe-area-inset-bottom"></view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad ,onReachBottom,onShareAppMessage,onShareTimeline,onUnload} from '@dcloudio/uni-app'
import { apiGetClassifyDetail,apiGetHistoryList } from '@/API/apis.js'
import { goToHome } from '@/utils/common.js'

const noData = ref(false)
const queryParams = {
	pageNum:1,
	pageSize:12,
}
let pageName;

onLoad((e)=>{
	// if(!e.classid) goToHome()
	if(e.type) queryParams.type = e.type
	if(e.classid) queryParams.classid = e.classid
	if(e.id) queryParams.classid = e.id
	if(e.name) pageName = decodeURIComponent(e.name)
	uni.setNavigationBarTitle({
		title:pageName
	})
	getClassifyDetail()
})

// 获取分类列表网格数据
const classifyDetailList = ref([])
const getClassifyDetail = async () => {
	let res;
	if(queryParams.classid) res = await apiGetClassifyDetail(queryParams)
  if(queryParams.type) res = await apiGetHistoryList(queryParams)
	classifyDetailList.value = [...classifyDetailList.value,...res.data]
	if(res.data.length < queryParams.pageSize) noData.value = true
	// 也可以用pinia 状态管理
	uni.setStorageSync('storageClassList',classifyDetailList.value)
	console.log(res)
}

// 触底加载
onReachBottom(()=>{
	if(noData.value) return
	queryParams.pageNum++
	getClassifyDetail()
})

// 分享给好友
onShareAppMessage(()=>{
	return{
		title:'壁纸推荐，'+pageName,
		path:'/pages/classlist/classlist?classid='+queryParams.classid+'&name='+encodeURIComponent(pageName),
	}
})

// 分享给朋友圈
onShareTimeline(()=>{
	return{
		title:'壁纸推荐，'+pageName,
		query:'classid='+queryParams.classid+'&name='+encodeURIComponent(pageName),
	}
})

onUnload(()=>{
	uni.removeStorageSync('storageClassList')
})
</script>

<style lang="scss" scoped>
.classlist{
	.content{
		display:grid;
		grid-template-columns: repeat(3, 1fr);
		gap:5rpx;
		padding: 5rpx;
		.item{
			position: relative;
			height: 440rpx;
			image{
				display: block;
				width: 100%;
				height: 100%;
			}
		}
	}
}
</style>
