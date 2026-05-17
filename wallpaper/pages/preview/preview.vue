<template>
	<view class="preview" v-if="currentInfo">
		<swiper circular :current="currentIndex" @change="changeSwiper">
			<swiper-item v-for="(item,index) in classList" :key="item._id">
				<!-- 方案一 -->
				<!-- <image v-if="currentIndex == index"  @click="maskChange" :src="item.picurl" mode="aspectFill"></image> -->
				<!-- 方案二 -->
				<image v-if="readImgs.includes(index)"  @click="maskChange" :src="item.picurl" mode="aspectFill"></image>
				<!-- 方案三  在push到readImgs 将当前索引的前一个索引和后一个索引也push到readImgs中 还有判断前一个索引是否小于零 后一个索引是否大于等于classList.length-1 -->
			</swiper-item>
		</swiper>

		<view class="mask" v-if="mask">
			<view class="goBack" :style="{top:getStatusBarHeight()+'px'}" @click="goBack">
				<uni-icons type="back" size="20" color="#fff"></uni-icons>
			</view>
			<view class="count">{{currentIndex+1}}  /  {{classList.length}}</view>
			<view class="time">
				<uni-dateformat :date="new Date()" format="MM月dd日"></uni-dateformat>
			</view>
			<view class="date">
				<uni-dateformat :date="new Date()" format="hh:mm"></uni-dateformat>
			</view>
			<view class="footer">
				<view class="box" @click="clickInfo">
					<uni-icons type="info" size="23"></uni-icons>
					<view class="text">信息</view>
				</view>
				
				<view class="box" @click="clickScore">
					<uni-icons type="star" size="23"></uni-icons>
					<view class="text">{{currentInfo.score}}分</view>
				</view>

				<view class="box" @click="clickDownload">
					<uni-icons type="download" size="23"></uni-icons>
					<view class="text">下载</view>
				</view>
			</view>
		</view>

		<uni-popup ref="infoPopup" type="bottom">
			<view class="infoPopup">
				<view class="popHeader">
					<view></view>
					<view class="title">壁纸信息</view>
					<view class="close" @click="infoPopup.close()">
						<uni-icons type="closeempty" size="18"></uni-icons>
					</view>
				</view>
				<scroll-view scroll-y>
					<view class="content">
						<view class="row" >
								<view class="label">壁纸ID:</view>
								<text selectable class="value">{{currentInfo._id}}</text>
						</view>

						<!-- <view class="row" >
								<view class="label">分类:</view>
								<text selectable class="value class">213123123412</text>
						</view> -->
						
						<view class="row" >
								<view class="label">发布者:</view>
								<text selectable class="value">{{currentInfo.nickname}}</text>
						</view>

						<view class="row" >
								<view class="label">评分:</view>
								<view class="value roteBox">
									<uni-rate readonly touchable :value="currentInfo.score" size="16"/>
									<text class="score">{{currentInfo.score}}分</text>
								</view>
						</view>

						<view class="row" >
								<view class="label">摘要:</view>
								<text selectable class="value">{{currentInfo.description}}</text>
						</view>

						<view class="row" >
								<view class="label">标签:</view>
								<view class="value tabs" v-for="tab in currentInfo.tabs" :key="tab">
									<view class="tab">{{tab}}</view>
								</view>
						</view>

						<view class="copyright">
							声明：本图片来用户投稿，非商业使用，用于免费学习交流，如侵犯了您的权益，您可以拷贝壁纸ID举报至平台，邮箱513894357@qq.com，管理将删除侵权壁纸，维护您的权益。

						</view>
						<view class="safe-area-inset-bottom"></view>
					</view>
				</scroll-view>
			</view>
		</uni-popup>

		<uni-popup ref="scorePopup" type="center" :is-mask-click="false">
			<view class="scorePopup">
				<view class="popHeader">
					<view></view>
					<view class="title">{{isScore ? '评分过了~' : '壁纸评分'}}</view>
					<view class="close" @click="clickScoreClose">
						<uni-icons type="closeempty" size="18"></uni-icons>
					</view>
				</view>

				<view class="content">
					<uni-rate v-model="userScore" 
						allowHalf 
						:disabled="isScore"
						disabled-color="#FFCA3E"
					/>
					<text class="text">{{userScore}}分</text>
				</view>

				<view class="footer">
					<button :disabled="!userScore || isScore" @click="submitScore"  type="default" size="mini" plain>确认评分</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onLoad,onShareAppMessage,onShareTimeline } from '@dcloudio/uni-app'
	import { getStatusBarHeight } from '@/utils/system.js'
	import uniRate from '@/uni_modules/uni-rate/components/uni-rate/uni-rate.vue'
	import { apiGetsetupScore,apiWriteDownload,apiDetailWall } from '@/API/apis.js'
	import { goToHome } from '@/utils/common.js'

	// 遮罩层显示状态
	const mask = ref(true)
	const maskChange = () => {
		mask.value = !mask.value
	}

	// 信息弹窗显示状态
	const infoPopup = ref(null)
	const clickInfo = () => {
		infoPopup.value.open()
	}

	// 评分弹窗显示状态
	const scorePopup = ref(null)
	const userScore = ref(0)
	// 是否评分
	const isScore = ref(false)
	// 评分弹窗
	const clickScore = () => {
		if(currentInfo.value.userScore){
			isScore.value = true
			userScore.value = currentInfo.value.userScore
		}
		scorePopup.value.open()
	}

	const clickScoreClose = () => {
		scorePopup.value.close()
		userScore.value = 0
		isScore.value = false
	}

	// 确认评分
	const submitScore = async () => {
		uni.showLoading({
			title: '加载中'
		})
		let {classid,_id:wallId} = currentInfo.value
		let res = await apiGetsetupScore({
			classid,
			wallId,
			userScore:userScore.value
		})
		uni.hideLoading()
		if(res.errCode === 0){
			uni.showToast({
				title: '评分成功',
				icon: 'none'
			})
			classList.value[currentIndex.value].userScore = userScore.value
			uni.setStorageSync('storageClassList',classList.value)

			// 关闭弹窗
			clickScoreClose()
		}
		console.log("当前信息", res)
	}

	// 点击下载
	const clickDownload = async () => {
		// #ifdef H5
		uni.showModal({
			content:'请长按保存壁纸',
			showcancel:false
		})
		// #endif

		// #ifndef H5
		// 利用 async 和 await 进行异步同步化，可以用try catch 处理异常
		try{
			uni.showLoading({
				title: '下载中.....',
				mask:true
			})
			let {classid,_id:wallId} = currentInfo.value
			let res = await apiWriteDownload({
				classid,
				wallId
			})
			if(res.errCode != 0) throw res
			uni.getImageInfo({
				src:currentInfo.value.picurl,
				success:(res) =>{
					uni.saveImageToPhotosAlbum({
						filePath:res.path,
						success:(res) =>{
							console.log(res)
						},
						fail:(err) =>{
							if(err.errMsg == 'saveImageToPhotosAlbum:fail cancel'){
								uni.showToast({
									title: '保存失败，请重新点击下载',
									icon: 'none'
								})
								return
							}
							uni.showModal({
								title:'授权提示',
								content:'需要授权保存相册',
								success:(res) =>{
									if(res.confirm){	
										uni.openSetting({
											success:(setting) =>{
												console.log(setting)
												if(setting.authSetting['scope.writePhotosAlbum']){
													uni.showToast({
														title: '获取授权成果',
														icon: 'none'
													})
												}else{
													uni.showToast({
														title: '获取授权失败',
														icon: 'none'
													})
												}
											}
										})
									}
								}
							})
						},
						complete:()=>{
							uni.hideLoading()
						}
					})
				}
			})
		}catch(err){
			console.log(err)
			uni.hideLoading()
		}
		
		// #endif
	}

	// 返回
	const goBack = () => {
		uni.navigateBack({
			success:()=>{
				
			},
			fail:()=>{
				uni.reLaunch({
					url:'/pages/index/index'
				})
			}
		})
	}

	const currentId = ref(null)
	const currentIndex = ref(0)
	const readImgs = ref([])
	// 当前预览壁纸的信息
	const currentInfo = ref(null)
	// 解决首页加载额外图片的问题
	const readImgsFun = ()=>{
		readImgs.value.push(
			currentIndex.value <= 0 ? classList.value.length-1 : currentIndex.value-1,
			currentIndex.value,
			currentIndex.value >= classList.value.length-1 ? 0 : currentIndex.value+1
		)
		// Set 是 ES6（ES2015）引入的一种新的内置对象，它存储一组唯一的值（任何类型的原始值或对象引用），并且会按照值插入的顺序进行迭代
		readImgs.value = [...new Set(readImgs.value)]
	}
	onLoad(async (e)=>{
		if(!e.id) goToHome()
		currentId.value = e.id
		if(e.type == 'share'){
			let res = await apiDetailWall({
				id:currentId.value
			})
			classList.value = res.data.map(item =>{
				return {
					...item,
					picurl:item.smallPicurl.replace('_small.webp','.jpg')
				}
			})
		}
		currentIndex.value = classList.value.findIndex(item => {
			return item._id === currentId.value
		})
		currentInfo.value = classList.value[currentIndex.value]
		readImgsFun()
	})

	// 存储 从缓存中处理好的数据
	const classList = ref([])
	// 从本地存储获取分类列表-详情
	const storageClassList = uni.getStorageSync('storageClassList') || []
	classList.value = storageClassList.map(item =>{
		return {
			// 先将返回的对象其他不变的属性 保留
			...item,
			// 将缩略图路径替换成大图
			picurl:item.smallPicurl.replace('_small.webp','.jpg')
		}
	})

	// 切换图片时 更新索引
	const changeSwiper = (e) => {
		currentIndex.value = e.detail.current
		currentInfo.value = classList.value[currentIndex.value]
		readImgsFun()
	}

	// 分享给好友
onShareAppMessage(()=>{
	return{
		title:'壁纸推荐，',
		path:'/pages/preview/preview?id='+currentId.value+'&type=share',
	}
})

// 分享给朋友圈
onShareTimeline(()=>{
	return{
		title:'壁纸推荐，',
		query:'id='+currentId.value+'&type=share',
	}
})
</script>

<style lang="scss" scoped>
.preview {
	position: relative;
	width: 100%;
	height: 100vh;
	swiper {
		height: 100%;
		width: 100%;
		image {
			height: 100%;
			width: 100%;
		}
	}
	.mask {
		&>view {
			position: absolute;
			left: 0;
			right: 0;
			margin:0 auto;
			width: fit-content;  // 有多少内容，就占多少宽度
			color: #fff;
		}
		.goBack {
			width: 38px;
			height: 38px;
			background: rgba(0, 0, 0, 0.5);
			left: 30rpx;
			margin-left: 0;
			border-radius: 100px;
			top: 0;
			backdrop-filter: blur(10rpx);
			border: 1rpx solid rgba(255, 255, 255, 0.3);
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.count {
			top: 10vh;
			background: rgba(0, 0, 0, 0.3);
			font-size: 28rpx;
			color: #fff;
			border-radius: 40rpx;
			padding: 8rpx 28rpx;
			backdrop-filter: blur(10rpx);
		}
		.time {
			top:calc(10vh + 80rpx);
			font-size: 140rpx;
			font-weight: 100;
			line-height: 1em; //去掉行高
			text-shadow: 0 4rpx rgba(0, 0, 0, 0.3);
		}
		.date {
			font-size: 34rpx;
			top:calc(10vh + 230rpx);
			text-shadow: 0 2rpx rgba(0, 0, 0, 0.3);
		}
		.footer {
			background-color: rgba(255, 255, 255, 0.8);
			bottom:10vh;
			width: 65vw;
			height: 120rpx;
			border-radius: 60rpx;
			color: black;
			display: flex;
			justify-content: space-around;
			align-items: center;
			box-shadow: 0 2rpx 0 rgba(0, 0, 0, 0.1);
			backdrop-filter: blur(10rpx);
			.box{
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				padding:2rpx 10rpx; //增加触碰区域
				.text{
					font-size: 28rpx;
					color:$text-font-color-2;
				}
			}
		}
	}

	.popHeader {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.title {
				color: $text-font-color-2;
				font-size: 26rpx;
			}

			.close {
				padding: 6rpx;
			}
		}
	.infoPopup {
		background-color: #fff;
		padding: 30rpx;
		border-radius: 30rpx 30rpx 0 0;
		overflow: hidden;
		scroll-view {
			max-height: 45vh;
			.content{
				.row{
					display: flex;
					padding: 16rpx 0;
					font-size: 32rpx;
					line-height: 1.7em;
					.label{
						color: $text-font-color-3;
						width:140rpx;
						text-align: right;
						font-size: 30rpx;
					}
					.value{
						margin-left: 10rpx;
						flex: 1;
						width: 0;
					}
					.roteBox{
						display: flex;
						align-items: center;
						.score{
							font-size: 26rpx;
							color: $text-font-color-2;
							margin-left: 10rpx;
						}
					}
					.tabs {
						display: flex;
						flex-wrap: wrap;
						.tab {
							border: 1px solid $brand-theme-color;
								color: $brand-theme-color;
								font-size: 22rpx;
								padding: 10rpx 30rpx;
								border-radius: 40rpx;
								line-height: 1em;
								margin: 0 10rpx 10rpx 0;
						}
					}
					.class{
						color: $brand-theme-color;
					}

				}
				.copyright {
						font-size: 28rpx;
						padding: 20rpx;
						background: #F6F6F6;
						color: #666;
						border-radius: 10rpx;
						margin: 20rpx 0;
						line-height: 1.6em;
					}
			}
		}
	}

	.scorePopup {
			background: #fff;
			padding: 30rpx;
			width: 70vw;
			border-radius: 30rpx;

			.content {
				padding: 30rpx 0;
				display: flex;
				justify-content: center;
				align-items: center;

				.text {
					color: #FFCA3E;
					padding-left: 10rpx;
					width: 80rpx;
					line-height: 1em;
					text-align: right;
					font-size: 28rpx;
				}
			}

			.footer {
				padding: 10rpx 0;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}
}
</style>