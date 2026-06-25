<script>
	import { getToken, isLoggedIn, logout, saveLogin } from '@/utils/auth.js'
	import { apiCheckToken } from '@/API/apis.js'

	export default {
		globalData: {
			isLogin: false,
			userInfo: {}
		},
		onLaunch: function() {
			console.log('App Launch')
			this.checkLoginStatus()
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
						const { getUserInfo } = require('@/utils/auth.js')
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
			}
		}
	}
</script>

<style lang="scss">
/*每个页面公共css */
@import 'common/style/common-style.scss'
</style>
