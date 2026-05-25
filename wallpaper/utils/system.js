const SYSTEM_INFO = uni.getSystemInfoSync()
export const getStatusBarHeight = () => SYSTEM_INFO.statusBarHeight || 15

export const getTitleBarHeight = () => {
	// 微信小程序等平台右上角有【胶囊】按钮，需要计算胶囊按钮的高度
	if (uni.getMenuButtonBoundingClientRect) {
		let { top, height } = uni.getMenuButtonBoundingClientRect()
		return (top - getStatusBarHeight()) * 2 + height
	} else {
		return 40
	}
}

export const getNavbarHeight = () => getTitleBarHeight() + getStatusBarHeight()

// 抖音小程序 处理 leftIcon 图标位置（导航区）
export const getLeftIconLeft = () => {
	// #ifdef MP-TOUTIAO
	let { leftIcon: { left, width } } = tt.getCustomButtonBoundingClientRect()
	return left + parseInt(width)
	// #endif
	// #ifndef MP-TOUTIAO
	return 0
	// #endif
}