<template>
	<div class="experiment-end">
		<h1>实验结束</h1>
		<p>感谢您的参与！</p>
		<div v-if="participantInfo" class="participant-info">
			<p><strong>年龄：</strong>{{ participantInfo.age }}</p>
			<p><strong>性别：</strong>{{ participantInfo.gender }}</p>
		</div>
		<p>请<strong>务必</strong>点击下方按钮提交数据</p>
		<van-button type="primary" :disabled="isSubmitting" @click="goToSurvey">
			提交数据并返回平台
		</van-button>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const participantInfo = ref<any>(null)
const isSubmitting = ref(false)

// 新增变量以存储 questionnaire_id 和 user_id
const questionnaireId = ref<string | null>(null)
const userId = ref<string | null>(null)
const startTime = ref<string | null>(null)

onMounted(() => {
	checkExperimentCompletion()

	// 从 localStorage 获取 questionnaire_id 和 user_id
	questionnaireId.value = localStorage.getItem('questionnaire_id')
	userId.value = localStorage.getItem('user_id')
	startTime.value = localStorage.getItem('start_time')

	// 从 localStorage 获取参与者信息
	const storedInfo = localStorage.getItem('participantInfo')
	if (storedInfo) {
		participantInfo.value = JSON.parse(storedInfo) // 解析参与者信息
	}
})

function checkExperimentCompletion() {
	const storedInfo = localStorage.getItem('participantInfo')
	const experimentState = localStorage.getItem('experimentState')
	const hasSeenInstructions = localStorage.getItem('hasSeenInstructions')
	if (storedInfo) {
		participantInfo.value = JSON.parse(storedInfo)
	}
	if (!storedInfo || !experimentState || hasSeenInstructions !== 'true') {
		showToast('实验流程未完成')
		// clean all local storage
		localStorage.clear()
		router.push('/instructions')
	}
}

function goToSurvey() {
	if (isSubmitting.value) {
		return
	}

	localStorage.setItem('experimentCompleted', 'true')

	isSubmitting.value = true // 防止重复点击

	// 准备发送的数据
	const data = {
		questionnaire_id: questionnaireId.value,
		user_id: userId.value,
		start_time: startTime.value,
		completion_time: new Date().toISOString(),
		status: 'reviewing',
		response_data: {
			age: participantInfo.value.age, // 从参与者信息中获取年龄
			gender: participantInfo.value.gender, // 从参与者信息中获取性别
		},
		reward_amount: 10,
		test: true,
	}

	// 发送数据的函数
	async function sendData() {
		try {
			console.log('发送的数据:', data) // 添加调试信息

			// 创建请求头
			const myHeaders = new Headers()
			myHeaders.append('Content-Type', 'application/json')

			// 准备请求选项
			const requestOptions = {
				method: 'POST',
				headers: myHeaders,
				body: JSON.stringify(data), // 使用 data 变量
				redirect: 'follow',
			}

			const response = await fetch('https://www.worldlab.site/api/callback/questionnaire', requestOptions)

			if (!response.ok) {
				const errorText = await response.text() // 获取错误信息
				throw new Error(`网络错误，数据提交失败: ${errorText}`)
			}

			const result = await response.json()
			console.log('数据提交成功:', result)

			// 显示提示信息
			showToast('正在跳转...')
			// 跳转到主平台
			window.location.href = 'https://www.worldlab.site/dashboard'
		}
		catch (error) {
			console.error('提交数据时出错:', error)
			showToast(`提交数据失败，请重试: ${error.message}`) // 显示具体错误信息
		}
		finally {
			isSubmitting.value = false // 恢复按钮状态
		}
	}

	// 调用发送数据的函数
	sendData()
}
</script>

<style scoped>
.experiment-end {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100vh;
	font-size: 24px;
	text-align: center;
}

h1 {
	font-size: 36px;
	margin-bottom: 30px;
}

.participant-info {
	margin: 30px 0;
	padding: 30px;
	border: 1px solid #ccc;
	border-radius: 8px;
	background-color: #f9f9f9;
}

.participant-info p {
	font-size: 24px;
	margin-bottom: 15px;
}

.van-button {
	margin-top: 30px;
	font-size: 24px;
	padding: 15px 30px;
}
</style>
