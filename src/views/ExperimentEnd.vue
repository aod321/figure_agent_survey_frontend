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
import { TOTAL_TRIALS } from '@/utils/preloader'

const router = useRouter()
const participantInfo = ref<any>(null)
const isSubmitting = ref(false)
const submitted = ref(false)
const canWechatPay = ref('')

// 新增变量以存储 questionnaire_id 和 user_id
const questionnaireId = ref<string | null>(null)
const userId = ref<string | null>(null)
const startTime = ref<string | null>(null)

function clearExperimentData() {
	const keysToRemove = [
		'experimentState',
		'participantInfo',
		'hasSeenInstructions',
		'preloadComplete',
		'hasGivenConsent',
		'experimentCompleted',
		'dataSubmitted',
		'questionnaire_id',
		'user_id',
		'start_time',
		'uuid',
	]
	keysToRemove.forEach(key => localStorage.removeItem(key))
}

onMounted(() => {
	checkExperimentCompletion()

	// 从 localStorage 获取参与者信息
	const storedInfo = localStorage.getItem('participantInfo')
	if (storedInfo) {
		try {
			participantInfo.value = JSON.parse(storedInfo)
			canWechatPay.value = participantInfo.value.canWechatPay || ''
		}
		catch {
			// Will be handled by checkExperimentCompletion
		}
	}

	// 检查是否已经提交过数据
	const hasSubmitted = localStorage.getItem('dataSubmitted')
	if (hasSubmitted === 'true') {
		showToast('数据已提交')
		submitted.value = true
		router.push('/thank-you')
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
		try {
			participantInfo.value = JSON.parse(storedInfo)
		}
		catch {
			clearExperimentData()
			router.push('/informed-consent')
			return
		}
	}

	if (!storedInfo || !experimentState || hasSeenInstructions !== 'true') {
		showToast('实验流程未完成')
		clearExperimentData()
		router.push('/informed-consent')
		return
	}

	try {
		const parsed = JSON.parse(experimentState)
		if (!parsed.trialData || parsed.trialData.length < TOTAL_TRIALS) {
			showToast('实验尚未完成')
			router.push('/experiment')
		}
	}
	catch {
		clearExperimentData()
		router.push('/informed-consent')
	}
}

function goToSurvey() {
	if (isSubmitting.value) {
		return
	}

	// 检查是否已经提交过数据
	if (localStorage.getItem('dataSubmitted') === 'true') {
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

	let experimentData: any
	try {
		experimentData = JSON.parse(experimentState)
	}
	catch {
		showToast('实验数据损坏')
		isSubmitting.value = false
		return
	}

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
			localStorage.setItem('dataSubmitted', 'true')
			submitted.value = true

			if (canWechatPay.value === '是') {
				showToast('数据提交成功，正在跳转问卷星...')
				setTimeout(() => {
					window.location.href = 'https://v.wjx.cn/vm/YfS5uW4.aspx#'
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
