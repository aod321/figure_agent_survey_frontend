<template>
	<div class="informed-consent">
		<h1 class="title">
			知情同意书
		</h1>
		<div class="consent-content">
			<p>您好，欢迎参加本次问卷研究。</p>
			<p>我们将收集您的基本信息，以便后续数据分析。所有数据将严格保密，仅用于学术研究，不会与第三方共享。</p>
			<p>请注意，您的参与是完全自愿的。您有权在任何时候退出，而不会受到任何形式的惩罚或损失。</p>
			<p><strong>建议您使用电脑作答</strong>，以获得更好的图片浏览体验。</p>
			<p>点击下一步，表示您已知情同意，自愿参与后续研究。</p>
		</div>
		<van-button type="primary" size="large" class="consent-button" @click="proceedToNextStep">
			下一步
		</van-button>
	</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkApiStatus } from '@/utils/apiCheck'

const router = useRouter()
const route = useRoute()

onMounted(() => {
	// 从URL中获取参数并存储到localStorage
	const questionnaireId = route.query.questionnaire_id as string || null
	const userId = route.query.user_id as string || null
	const startTime = route.query.start_time as string || null

	if (questionnaireId) {
		localStorage.setItem('questionnaire_id', questionnaireId)
	}
	if (userId) {
		localStorage.setItem('user_id', userId)
	}
	if (startTime) {
		localStorage.setItem('start_time', startTime)
	}

	// 检查API状态
	checkApiStatus().then((apiIsWorking) => {
		if (!apiIsWorking) {
			router.push('/network-error')
		}
	})
})

function proceedToNextStep() {
	localStorage.setItem('hasGivenConsent', 'true')
	router.push('/participant-info')
}
</script>

<style scoped>
.informed-consent {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	min-height: 100vh;
	padding: 32px 16px;
	box-sizing: border-box;
	background-color: #f8f9fa;
}

.title {
	margin-bottom: 24px;
	font-size: 36px;
	color: #2c3e50;
	text-align: center;
}

.consent-content {
	max-width: 1000px;
	width: 100%;
	margin-bottom: 30px;
	background-color: #ffffff;
	padding: 32px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

p {
	margin-bottom: 20px;
	font-size: 22px;
	line-height: 1.8;
	color: #34495e;
	text-align: justify;
}

.consent-button {
	margin-top: 24px;
	width: 100%;
	max-width: 400px;
	height: 60px;
	font-size: 24px;
	border-radius: 4px;
}

@media (max-width: 768px) {
	.informed-consent {
		padding: 24px 16px;
	}

	.title {
		font-size: 28px;
	}

	.consent-content {
		padding: 24px;
	}

	p {
		font-size: 18px;
		line-height: 1.6;
	}

	.consent-button {
		max-width: 100%;
		font-size: 20px;
		height: 48px;
	}
}
</style>
