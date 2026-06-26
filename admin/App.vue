<template>
	<view class="admin-app">
		<router-view />
	</view>
</template>

<script>
export default {
	onLaunch() {
		console.log('Admin App Launch')
	}
}
</script>

<style lang="scss">
@import '@/uni_modules/uni-admin/uni-admin.scss';
</style>
