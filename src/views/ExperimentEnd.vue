<template>
	<div class="experiment-end">
		<h1>实验结束</h1>
		<p>感谢您的参与！</p>
		<p>请<strong>务必</strong>点击下方按钮提交数据</p>
		<van-button type="primary" :disabled="isSubmitting" @click="goToSurvey">
			{{ canWechatPay === '是' ? '提交数据并领取红包' : '提交数据' }}
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
const submitted = ref(false)
const canWechatPay = ref('')

// 新增变量以存储 questionnaire_id 和 user_id
const questionnaireId = ref<string | null>(null)
const userId = ref<string | null>(null)
const startTime = ref<string | null>(null)

onMounted(() => {
	checkExperimentCompletion()

	// 从 localStorage 获取参与者信息
	const storedInfo = localStorage.getItem('participantInfo')
	if (storedInfo) {
		participantInfo.value = JSON.parse(storedInfo)
		canWechatPay.value = participantInfo.value.canWechatPay || ''
	}

	// 检查是否已经提交过数据
	const hasSubmitted = localStorage.getItem('experimentSubmitted')
	if (hasSubmitted === 'true') {
		showToast('数据已提交')
		submitted.value = true
		if (canWechatPay.value === '是') {
			window.location.href = 'https://v.wjx.cn/vm/riVAQQo.aspx#'
		}
		else {
			router.push('/thank-you')
		}
		return
	}

	// 从 localStorage 获取 questionnaire_id 和 user_id
	questionnaireId.value = localStorage.getItem('questionnaire_id')
	userId.value = localStorage.getItem('user_id')
	startTime.value = localStorage.getItem('start_time')
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

	// 检查是否已经提交过数据
	if (localStorage.getItem('experimentSubmitted') === 'true') {
		showToast('数据已提交')
		submitted.value = true
		if (canWechatPay.value === '是') {
			return
		}
		else {
			router.push('/thank-you')
			return
		}
	}

	localStorage.setItem('experimentCompleted', 'true')
	isSubmitting.value = true

	// 获取实验数据
	const experimentState = localStorage.getItem('experimentState')
	if (!experimentState) {
		showToast('未找到实验数据')
		isSubmitting.value = false
		return
	}

	const experimentData = JSON.parse(experimentState)

	// 准备发送的数据（匹配后端 ExperimentData 格式）
	const data = {
		participantInfo: {
			gender: participantInfo.value.gender,
			canWechatPay: participantInfo.value.canWechatPay || '',
			phone: participantInfo.value.phone || '',
			researchRole: participantInfo.value.researchRole || '',
			researchYears: participantInfo.value.researchYears || '',
			pipelineTime: participantInfo.value.pipelineTime || '',
			researchRoleOther: participantInfo.value.researchRoleOther || undefined,
			catchTrialCorrect: Array.isArray(experimentData.catchTrialResults) ? JSON.stringify(experimentData.catchTrialResults) : (experimentData.catchTrialResults || undefined),
			user_id: userId.value || '',
			questionnaire_id: questionnaireId.value || '',
			experimentStartDateTime: experimentData.experimentStartTime,
			experimentEndDateTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
			experimentDuration: Date.now() - experimentData.experimentStartTimestamp,
		},
		trialData: experimentData.trialData.map((trial: any) => ({
			trial_id: trial.trial_id,
			trial_type: trial.trial_type,
			selected_index: trial.selected_index ?? trial.selected_image_id ?? 0,
			reaction_time: trial.reaction_time,
			timestamp: trial.timestamp ?? Date.now(),
			catch_trial_correct: trial.catch_trial_correct,
			trial_start_datetime: trial.trial_start_datetime,
			trial_end_datetime: trial.trial_end_datetime,
			paperId: trial.paperId,
			method1: trial.method1,
			method2: trial.method2,
			selectedMethod: trial.selectedMethod,
			catchFile: trial.catchFile,
			mainPaperId: trial.mainPaperId,
			mainMethod: trial.mainMethod,
			selectedCatch: trial.selectedCatch,
		})),
	}

	// 发送数据的函数
	async function sendData() {
		try {
			console.log('发送的数据:', data)

			const myHeaders = new Headers()
			myHeaders.append('Content-Type', 'application/json')

			const requestOptions: RequestInit = {
				method: 'POST',
				headers: myHeaders,
				body: JSON.stringify(data),
				redirect: 'follow' as RequestRedirect,
			}

			const apiUrl = import.meta.env.VITE_EXPERIMENT_API_URL || 'http://localhost:8100'
			const response = await fetch(`${apiUrl}/submit_data`, requestOptions)

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`网络错误，数据提交失败: ${errorText}`)
			}

			const result = await response.json()
			console.log('数据提交成功:', result)

			// 标记数据已提交
			localStorage.setItem('experimentSubmitted', 'true')
			submitted.value = true

			if (canWechatPay.value === '是') {
				showToast('数据提交成功，正在跳转问卷星...')
				setTimeout(() => {
					window.location.href = 'https://v.wjx.cn/vm/riVAQQo.aspx#'
				}, 1000)
			}
			else {
				showToast('数据提交成功')
				router.push('/thank-you')
			}
		}
		catch (error: unknown) {
			console.error('提交数据时出错:', error)
			const errorMessage = error instanceof Error ? error.message : '未知错误'
			showToast(`提交数据失败，请重试: ${errorMessage}`)
		}
		finally {
			isSubmitting.value = false
		}
	}

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

.van-button {
	margin-top: 30px;
	font-size: 24px;
	padding: 15px 30px;
}
</style>
