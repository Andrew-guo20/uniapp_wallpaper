<template>
	<view class="privacyLayout">
		<view :style="{height: getStatusBarHeight() + 'px'}"></view>

		<view class="header">
			<view class="title">隐私政策</view>
			<view class="version">更新日期：2026年7月</view>
		</view>

		<view class="content">
			<view class="section">
				<view class="sectionTitle">引言</view>
				<view class="sectionText">
					一壁之力（以下简称"本小程序"）重视用户的隐私。本隐私政策说明了我们在您使用本小程序时，如何收集、使用和保护您的个人信息。
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">一、我们收集的信息</view>
				<view class="sectionText">
					<view class="item"><text class="bold">1. 微信用户信息：</text>当您使用微信登录时，我们会获取您的微信头像和昵称，用于在应用内展示您的身份标识。此信息仅存储在您的本地设备和我们的云服务器上，不会分享给第三方。</view>
					<view class="item"><text class="bold">2. 设备标识：</text>为提供壁纸浏览、下载、评分等基础服务，我们会收集您的设备标识符（deviceId），用于区分不同用户的操作记录。</view>
					<view class="item"><text class="bold">3. 使用数据：</text>当您收藏壁纸、评分、下载壁纸时，我们会记录这些操作数据，以便为您提供历史记录查询和个人数据同步服务。</view>
					<view class="item"><text class="bold">4. 搜索记录：</text>当您使用搜索功能时，我们会记录您的搜索关键词，用于提供搜索历史功能。</view>
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">二、信息的使用</view>
				<view class="sectionText">
					我们收集的信息仅用于以下目的：
					<view class="item">• 为您提供壁纸浏览、下载、收藏、评分等核心功能</view>
					<view class="item">• 同步您的个人数据（收藏列表、下载历史、评分记录）</view>
					<view class="item">• 改善和优化我们的服务体验</view>
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">三、信息的存储</view>
				<view class="sectionText">
					<view class="item"><text class="bold">存储位置：</text>您的数据存储在 uniCloud 支付宝云服务器上，采用加密传输和存储保护。</view>
					<view class="item"><text class="bold">存储期限：</text>我们会在您使用服务期间保留您的数据。您可以随时通过退出登录或在用户中心删除相关数据。</view>
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">四、信息的共享与披露</view>
				<view class="sectionText">
					我们不会将您的个人信息出售、交易或转让给任何第三方。除非：
					<view class="item">• 获得您的明确授权</view>
					<view class="item">• 法律法规要求披露</view>
					<view class="item">• 保护本小程序或其他用户的合法权益所必需</view>
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">五、您的权利</view>
				<view class="sectionText">
					<view class="item">• <text class="bold">访问与更正：</text>您可以在用户中心查看和更新您的个人信息</view>
					<view class="item">• <text class="bold">删除数据：</text>您可以删除收藏记录、评分记录，或通过退出登录清除本地数据</view>
					<view class="item">• <text class="bold">撤回同意：</text>您可以通过微信小程序的设置页面取消授权</view>
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">六、未成年人保护</view>
				<view class="sectionText">
					本小程序不专门面向未成年人提供服务。如果您是未成年人，请在监护人指导下使用本小程序。
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">七、政策更新</view>
				<view class="sectionText">
					我们可能会适时更新本隐私政策。更新后的政策将在本页面发布，重大变更将以公告形式通知。
				</view>
			</view>

			<view class="section">
				<view class="sectionTitle">八、联系我们</view>
				<view class="sectionText">
					如您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
					<view class="item">• 邮箱：513894357@qq.com</view>
					<view class="item">• 小程序内：用户中心 → 联系客服</view>
				</view>
			</view>

			<view class="footer">
				<view class="text">一壁之力 开发团队</view>
			</view>
		</view>

		<view class="safe-area-inset-bottom"></view>
	</view>
</template>

<script setup>
import { getStatusBarHeight } from '@/utils/system.js'
</script>

<style lang="scss" scoped>
.privacyLayout {
	min-height: 100vh;
	background: #fff;

	.header {
		padding: 40rpx 40rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;

		.title {
			font-size: 44rpx;
			font-weight: 700;
			color: #1a1a2e;
		}

		.version {
			font-size: 24rpx;
			color: #9ca3af;
			margin-top: 10rpx;
		}
	}

	.content {
		padding: 30rpx 40rpx;

		.section {
			margin-bottom: 36rpx;

			.sectionTitle {
				font-size: 32rpx;
				font-weight: 600;
				color: #1a1a2e;
				margin-bottom: 12rpx;
			}

			.sectionText {
				font-size: 28rpx;
				color: #4b5563;
				line-height: 1.8;
			}

			.item {
				margin-top: 8rpx;
				font-size: 28rpx;
				color: #4b5563;
				line-height: 1.8;
			}

			.bold {
				font-weight: 600;
				color: #1a1a2e;
			}
		}

		.footer {
			text-align: center;
			padding: 40rpx 0 20rpx;

			.text {
				font-size: 24rpx;
				color: #9ca3af;
			}
		}
	}
}
</style>
