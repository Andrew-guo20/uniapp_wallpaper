<template>
	<view class="classifyLayout pageBg">
		<custom-nav-bar title="分类"></custom-nav-bar>
		<view class="classify">
			<theme-item v-for="item in classifyList" :key="item._id" :item="item"></theme-item>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { apiGetClassify } from '@/API/apis.js'
import {onShareAppMessage,onShareTimeline} from '@dcloudio/uni-app'

// 分类
const classifyList = ref([])
const getClassify = async () => {
	let res = await apiGetClassify({
		pageSize:15
	})
	classifyList.value = res.data
	console.log(res)
}

// 分享给好友
onShareAppMessage(()=>{
	return{
		title:'壁纸推荐，精选分类',
		path:'/pages/classify/classify',
	}
})

// 分享给朋友圈
onShareTimeline(()=>{
	return{
		title:'壁纸推荐，精选分类',
	}
})

getClassify()
</script>

<style lang="scss" scoped>
.classify{
	padding:30rpx;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 15rpx;
}
</style>