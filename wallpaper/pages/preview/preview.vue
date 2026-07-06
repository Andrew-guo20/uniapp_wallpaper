<template>
	<view class="preview" v-if="currentInfo">
		<swiper circular :current="currentIndex" @change="changeSwiper">
			<swiper-item v-for="(item,index) in classList" :key="item._id">
				<view v-if="readImgs.includes(index)" class="imgWrapper" @click="maskChange">
					<image :src="item.smallPicurl" mode="aspectFill" class="thumb"></image>
					<image :src="item.picurl" mode="aspectFill" class="full" @load="onImgLoad(index)"></image>
				</view>
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

				<view class="box" @click="clickFavorite">
					<uni-icons :type="isFavorited ? 'heart-filled' : 'heart'" size="23" :color="isFavorited ? '#ff4d4f' : '#fff'"></uni-icons>
					<view class="text">收藏</view>
				</view>

				<view class="box" @click="clickComments">
					<uni-icons type="chat" size="23"></uni-icons>
					<view class="text">评论</view>
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
								<text user-select class="value">{{currentInfo._id}}</text>
						</view>

						<!-- <view class="row" >
								<view class="label">分类:</view>
								<text user-select class="value class">213123123412</text>
						</view> -->
						
						<view class="row" >
								<view class="label">发布者:</view>
								<text user-select class="value">{{currentInfo.nickname}}</text>
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
								<text user-select class="value">{{currentInfo.description}}</text>
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
					<view class="title">{{isScore ? '我的评分' : '壁纸评分'}}</view>
					<view class="close" @click="clickScoreClose">
						<uni-icons type="closeempty" size="18"></uni-icons>
					</view>
				</view>

				<view class="content">
					<uni-rate v-model="userScore" 
						allowHalf 
						active-color="#FFCA3E"
						disabled-color="#FFCA3E"
					/>
					<text class="text">{{userScore}}分</text>
				</view>

				<view class="footer">
					<button :disabled="!userScore" @click="submitScore"  type="default" size="mini" plain>{{isScore ? '更新评分' : '确认评分'}}</button>
				</view>
			</view>
		</uni-popup>
	</view>

	<!-- 评论弹窗 -->
	<uni-popup ref="commentPopup" type="bottom">
		<view class="commentPopup">
			<view class="popHeader">
				<view></view>
				<view class="title">评论 ({{commentTotal}})</view>
				<view class="close" @click="commentPopup.close()">
					<uni-icons type="closeempty" size="18"></uni-icons>
				</view>
			</view>
			<scroll-view scroll-y class="commentList" v-if="comments.length">
				<view class="commentItem" v-for="item in comments" :key="item._id">
					<view class="commentMeta">
						<text class="commentUid">{{item.uid?.substring(0,8) || '用户'}}</text>
						<text class="commentTime">{{item.create_time}}</text>
					</view>
					<view class="commentContent">{{item.content}}</view>
				</view>
				<view class="loadMore" v-if="comments.length < commentTotal" @click="loadMoreComments">
					<text>加载更多</text>
				</view>
			</scroll-view>
			<view class="commentEmpty" v-else>
				<text>暂无评论，快来抢沙发吧~</text>
			</view>
			<view class="commentInput">
				<input v-model="commentText" placeholder="说点什么..." :disabled="commentLoading" confirm-type="send" @confirm="submitComment" />
				<view class="sendBtn" @click="submitComment">发送</view>
			</view>
		</view>
	</uni-popup>
</template>

<script setup>
	import { ref } from 'vue'
	import { onLoad,onShareAppMessage,onShareTimeline } from '@dcloudio/uni-app'
	import { getStatusBarHeight } from '@/utils/system.js'
	import uniRate from '@/uni_modules/uni-rate/components/uni-rate/uni-rate.vue'
	import { apiGetsetupScore,apiWriteDownload,apiDetailWall,apiToggleFavorite,apiIsFavorited,apiAddComment,apiGetComments,apiDeleteComment } from '@/API/apis.js'
	import { goToHome } from '@/utils/common.js'
	import { isLoggedIn } from '@/utils/auth.js'

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
	const isFavorited = ref(false)
	const commentPopup = ref(null)
	const comments = ref([])
	const commentText = ref('')
	const commentLoading = ref(false)
	const commentTotal = ref(0)
	const commentPage = ref(1)
	const goLogin = () => {
		const redirect = '/pages/preview/preview?id=' + currentInfo.value._id + '&type=share'
		uni.navigateTo({ url: '/pages/login/login?redirect=' + encodeURIComponent(redirect) })
	}
	const setCurrentInfo = (item) => {
		if (!item) {
			goToHome()
			return
		}
		currentInfo.value = item
		userScore.value = item.userScore || 0
		isScore.value = !!item.userScore
	}
	// 评分弹窗
	const clickScore = () => {
		userScore.value = currentInfo.value.userScore || 0
		isScore.value = !!currentInfo.value.userScore
		scorePopup.value.open()
	}

	const clickScoreClose = () => {
		scorePopup.value.close()
		userScore.value = 0
		isScore.value = false
	}

	// 确认评分
	const submitScore = async () => {
		if (!isLoggedIn()) {
			uni.showToast({ title: '请先登录', icon: 'none' })
			scorePopup.value.close()
			userScore.value = 0
			isScore.value = false
			setTimeout(goLogin, 500)
			return
		}
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
			const hadScore = !!currentInfo.value.userScore
			uni.showToast({
				title: hadScore ? '更新成功' : '评分成功',
				icon: 'none'
			})
				currentInfo.value.score = res.data.score
				currentInfo.value.scoreCount = res.data.scoreCount
				currentInfo.value.userScore = userScore.value
				classList.value[currentIndex.value].userScore = userScore.value
				classList.value[currentIndex.value].score = res.data.score
				classList.value[currentIndex.value].scoreCount = res.data.scoreCount
			uni.setStorageSync('storageClassList',classList.value)

			// 关闭弹窗
			clickScoreClose()
		} else if (res.errCode === 401) {
			uni.showToast({ title: '请先登录', icon: 'none' })
			clickScoreClose()
			setTimeout(goLogin, 500)
		} else {
			uni.showToast({ title: res.errMsg || 'score failed', icon: 'none' })
		}
		console.log("当前信息", res)
	}

	// 点击收藏
	const clickFavorite = async () => {
		if (!isLoggedIn()) {
			uni.showToast({ title: '请先登录', icon: 'none' })
			setTimeout(goLogin, 500)
			return
		}
		try {
			const res = await apiToggleFavorite(currentInfo.value._id)
			if (res.errCode === 0) isFavorited.value = res.data.favorited
			else uni.showToast({ title: res.errMsg || 'favorite failed', icon: 'none' })
		} catch (e) { console.error(e) }
	}

	// 点击评论
	const clickComments = async () => {
		commentPage.value = 1
		await loadComments()
		commentPopup.value.open()
	}
	const loadComments = async () => {
		commentLoading.value = true
		try {
			const res = await apiGetComments(currentInfo.value._id, commentPage.value, 10)
			if (res.errCode === 0) {
				if (commentPage.value === 1) comments.value = res.data.list
				else comments.value = [...comments.value, ...res.data.list]
				commentTotal.value = res.data.total
			}
		} catch (e) { console.error(e) }
		commentLoading.value = false
	}
	const loadMoreComments = () => {
		commentPage.value++
		loadComments()
	}
	const submitComment = async () => {
		if (!commentText.value.trim()) return
		if (!isLoggedIn()) {
			uni.showToast({ title: '请先登录', icon: 'none' })
			setTimeout(goLogin, 500)
			return
		}
		commentLoading.value = true
		try {
			const res = await apiAddComment(currentInfo.value._id, commentText.value.trim())
			if (res.errCode === 0) {
				commentText.value = ''
				commentPage.value = 1
				await loadComments()
			} else {
				uni.showToast({ title: res.errMsg || 'comment failed', icon: 'none' })
			}
		} catch (e) { console.error(e) }
		commentLoading.value = false
	}

	// 点击下载
	const clickDownload = async () => {
		// #ifndef H5
		if (!isLoggedIn()) {
			uni.showToast({ title: '请先登录', icon: 'none' })
			setTimeout(goLogin, 500)
			return
		}
		// #endif

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
	// 高清图加载状态（true=已加载完成）
	const imgLoaded = ref({})
	// 当前预览壁纸的信息
	const currentInfo = ref(null)
	// 解决首页加载额外图片的问题
	// 高清图加载完成回调
	const onImgLoad = (index) => {
		imgLoaded.value[index] = true
	}

	// 解决首页加载额外图片的问题 + 预加载相邻图片
	const readImgsFun = ()=>{
		const len = classList.value.length
		const i = currentIndex.value
		readImgs.value.push(
			i - 2,  // 当前-2
			i - 1,  // 当前-1
			i,      // 当前
			i + 1,  // 当前+1
			i + 2   // 当前+2
		)
		// 归一化索引（处理首尾循环）
		readImgs.value = readImgs.value.map(idx => ((idx % len) + len) % len)
		readImgs.value = [...new Set(readImgs.value)]
		// 预加载大图到原生缓存：提前下载相邻的全尺寸 picurl
		const preloadIdx = [(i + 2) % len, (i - 2 + len) % len]
		preloadIdx.forEach(idx => {
			const item = classList.value[idx]
			if (item && item.picurl) {
				uni.getImageInfo({ src: item.picurl, success: () => {}, fail: () => {} })
			}
		})
	}
	onLoad(async (e)=>{
		if(!e.id) goToHome()
		currentId.value = e.id
		try {
			let res = await apiDetailWall({
				id:currentId.value
			})
			if (res.errCode === 0 && res.data.length) {
				const detail = {
					...res.data[0],
					picurl: res.data[0].picurl || res.data[0].smallPicurl.replace('_small.webp','.jpg')
				}
				if (e.type == 'share' || !classList.value.length) {
					classList.value = [detail]
				} else {
					const index = classList.value.findIndex(item => item._id === currentId.value)
					if (index >= 0) classList.value[index] = Object.assign({}, classList.value[index], detail)
				}
			}
		} catch (err) {
			console.error('get detail error:', err)
		}
		currentIndex.value = classList.value.findIndex(item => {
			return item._id === currentId.value
		})
		if (currentIndex.value < 0) currentIndex.value = 0
		setCurrentInfo(classList.value[currentIndex.value])
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
			picurl: item.picurl || item.smallPicurl.replace('_small.webp','.jpg')
		}
	})

	// 切换图片时 更新索引
	const changeSwiper = async (e) => {
		currentIndex.value = e.detail.current
		setCurrentInfo(classList.value[currentIndex.value])
		readImgsFun()
		// 查询当前壁纸的收藏状态
		isFavorited.value = false
		if (isLoggedIn()) {
			try {
				const favRes = await apiIsFavorited([currentInfo.value._id])
				isFavorited.value = !!favRes.data[currentInfo.value._id]
			} catch (e) {}
		}
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
		.imgWrapper {
			position: relative;
			width: 100%;
			height: 100%;
			.thumb {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				z-index: 1;
			}
			.full {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				z-index: 2;
			}
		}
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

.commentPopup{
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	padding: 0 0 env(safe-area-inset-bottom) 0;
	max-height: 60vh;
	display: flex;
	flex-direction: column;

	.popHeader{
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
		flex-shrink: 0;
		.title{ font-size: 30rpx; font-weight: 600; color: #1a1a2e; }
		.close{ padding: 8rpx; }
	}

	.commentList{
		flex: 1;
		max-height: 400rpx;
		padding: 0 30rpx;

		.commentItem{
			padding: 24rpx 0;
			border-bottom: 1rpx solid #f5f5f5;

			&:last-child{ border-bottom: none; }

			.commentMeta{
				display: flex;
				justify-content: space-between;
				align-items: baseline;
				margin-bottom: 10rpx;

				.commentUser{
					font-size: 24rpx;
					font-weight: 600;
					color: #1a1a2e;
				}

				.commentTime{
					font-size: 20rpx;
					color: #9ca3af;
				}
			}

			.commentContent{
				font-size: 28rpx;
				color: #374151;
				line-height: 1.6;
			}
		}

		.loadMore{
			text-align: center;
			padding: 24rpx 0;
			font-size: 24rpx;
			color: #28B389;
			font-weight: 500;
		}
	}

	.commentEmpty{
		text-align: center;
		padding: 80rpx 0;
		color: #9ca3af;
		font-size: 26rpx;
		flex: 1;
	}

	.commentInput{
		display: flex;
		align-items: center;
		padding: 16rpx 24rpx;
		border-top: 1rpx solid #f0f0f0;
		gap: 16rpx;
		flex-shrink: 0;

		input{
			flex: 1;
			height: 72rpx;
			background: #f5f5f5;
			border-radius: 36rpx;
			padding: 0 28rpx;
			font-size: 26rpx;
			color: #1a1a2e;
		}

		.sendBtn{
			padding: 14rpx 28rpx;
			background: #28B389;
			color: #fff;
			border-radius: 36rpx;
			font-size: 26rpx;
			font-weight: 600;
			flex-shrink: 0;

			&:active{ opacity: 0.85; }
		}
	}
}
</style>
