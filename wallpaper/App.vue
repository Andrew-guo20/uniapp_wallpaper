<script>
	import { getToken, getUserInfo, logout } from '@/utils/auth.js'
	import { apiCheckToken } from '@/API/apis.js'

	export default {
		globalData: {
			isLogin: false,
			userInfo: {}
		},
		onLaunch: function() {
			console.log('App Launch')
			this.checkLoginStatus()
			// #ifdef MP-WEIXIN
			this.initPushListener()
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 检查登录状态
			async checkLoginStatus() {
				const token = getToken()
				if (!token) {
					this.globalData.isLogin = false
					return
				}
				try {
					const res = await apiCheckToken(token)
					if (res.errCode === 0 && res.data && res.data.valid) {
						this.globalData.isLogin = true
						// 从缓存恢复用户信息
						this.globalData.userInfo = getUserInfo()
					} else {
						// token 失效，清除
						logout()
						this.globalData.isLogin = false
					}
				} catch (e) {
					console.error('checkLoginStatus error:', e)
					this.globalData.isLogin = false
				}
			},
			// 初始化推送监听
			initPushListener() {
				// uni-push 2.0 客户端监听
				uni.onPushMessage((res) => {
					console.log('Push message:', res)
					const payload = res.data?.payload || {}
					// 根据推送类型跳转
					if (payload.type === 'new_wallpaper') {
						uni.navigateTo({ url: '/pages/preview/preview?id=' + payload.wallId })
					} else if (payload.type === 'upload_review') {
						uni.showToast({ title: '你的投稿审核结果已更新', icon: 'none' })
					} else if (payload.type === 'announcement') {
						uni.navigateTo({ url: '/pages/notice/detail?id=' + payload.noticeId })
					}
				})
			}
		}
	}
</script>

<style lang="scss">
/*每个页面公共css */
@import 'common/style/common-style.scss'
</style>
