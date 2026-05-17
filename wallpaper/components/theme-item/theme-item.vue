<template>
	<view class="themeItem">
		<navigator :url="`/pages/classlist/classlist?classid=${props.item._id}&name=${encodeURIComponent(props.item.name)}`" class="box" v-if="!props.isMore">
			<image :src="props.item.picurl" class="pic"></image>
			<view class="mask">{{props.item.name}}</view>
			<view class="tab" v-if="getRelativeTime(props.item.updateTime)">{{getRelativeTime(props.item.updateTime)}}前更新</view>
		</navigator>
		<navigator 
			url="/pages/classify/classify" 
			open-type="reLaunch" 
			class="box more" 
			v-if="props.isMore"
		>
			<image src="../../common/images/more.jpg" class="pic"></image>
			<view class="mask">
				<uni-icons type="more-filled" size="34" color="#fff"></uni-icons>
				<view class="text">更多</view>
			</view>
		</navigator>
	</view>
</template>

<script setup lang="ts">
import { getRelativeTime } from '@/utils/common.js'
const props = defineProps({
	isMore: {
		type: Boolean,
		default: false
	},
	item: {
		type: Object,
		default: () => ({
			name:'默认名称',
			picurl:'../../common/images/classify1.jpg',
			updateTime:Date.now() - 1000 * 60 * 60  * 5
		})
	}
})
console.log('props.item.name',props.item.name)
</script>

<style lang="scss" scoped>
.themeItem{
	.box{
		position: relative;
		height: 340rpx;
		border-radius: 10rpx;
		overflow: hidden; //不加这个的话 圆角会被图片覆盖
		.pic{
			width: 100%;
			height: 100%;
		}
		.tab{
			position: absolute;
			top: 0;
			left: 0;
			background: rgba(250, 129, 90, 0.7);
			backdrop-filter: blur(20rpx);
			color: #fff;
			font-size: 22rpx;
			font-weight: 600;
			padding: 6rpx 14rpx;
			border-radius: 0 0 20rpx 0;
			transform: scale(0.8); //网页字体最小为12px 所以这里缩放0.8倍（22/2 == 11px 然后最小是12px 不会显示11px）
			transform-origin: top left; // 缩放中心在左上角
		}
		.mask{
			width: 100%;
			height: 70rpx;
			position: absolute;
			bottom: 0;
			background: rgba(0, 0, 0, 0.2);
			color: #fff;
			display: flex;
			justify-content: center;
			align-items: center;
			backdrop-filter: blur(20rpx);
			font-weight: 600;
			font-size: 30rpx;
		}
	}
	.box.more{
		.mask{
			height: 100%;
			width: 100%;
			flex-direction: column;
			.text{
				font-size: 28rpx;
		 }
		}
		
	}
}
</style>