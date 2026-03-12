<template>
	<div class="experiment">
		<div class="progress-row">
			<van-progress :percentage="experimentProgress" :stroke-width="8" class="progress-bar" />
			<span class="progress-text">{{ currentTrial - 1 }}/{{ TOTAL_TRIALS }}</span>
		</div>
		<div class="content">
			<h1 class="prompt">
				请点击您认为<span class="highlight-text">更好</span>的图片
				<span class="prompt-hint">长按图片可放大查看</span>
			</h1>
			<div class="image-choice">
				<div
					class="image-card"
					:class="{ disabled: isClicked }"
					@click="handleClick(0)"
					@pointerdown="startLongPress(0)"
					@pointerup="cancelLongPress"
					@pointerleave="cancelLongPress"
				>
					<div class="image-label">
						A
					</div>
					<img :src="currentImages[0]?.url" class="trial-image">
				</div>
				<div class="vs-separator">
					VS
				</div>
				<div
					class="image-card"
					:class="{ disabled: isClicked }"
					@click="handleClick(1)"
					@pointerdown="startLongPress(1)"
					@pointerup="cancelLongPress"
					@pointerleave="cancelLongPress"
				>
					<div class="image-label">
						B
					</div>
					<img :src="currentImages[1]?.url" class="trial-image">
				</div>
			</div>
		</div>

		<div v-if="zoomedIndex !== null" class="zoom-overlay" @click="zoomedIndex = null">
			<div class="zoom-header">
				<span class="zoom-title">{{ zoomedIndex === 0 ? 'A' : 'B' }}</span>
				<button class="zoom-close" @click="zoomedIndex = null">
					✕
				</button>
			</div>
			<img :src="currentImages[zoomedIndex]?.url" class="zoom-image" @click.stop>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { checkApiStatus } from '@/utils/apiCheck'
import { TOTAL_TRIALS, generateTrials, preloadAhead } from '@/utils/preloader'
import type { Trial } from '@/utils/preloader'

const router = useRouter()

const STATE_VERSION = 3

const trials = ref<Trial[]>([])
const currentImages = ref<{ url: string }[]>([])
const currentTrial = ref(1)
const trialData = ref<any[]>([])

const startTime = ref(0)
const trialStartDateTime = ref('')

const loading = ref(false)
const loadingProgress = ref(0)
const isClicked = ref(false)
const zoomedIndex = ref<number | null>(null)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressed = false

function startLongPress(index: number) {
	longPressed = false
	longPressTimer = setTimeout(() => {
		longPressed = true
		zoomedIndex.value = index
	}, 500)
}

function cancelLongPress() {
	if (longPressTimer) {
		clearTimeout(longPressTimer)
		longPressTimer = null
	}
}

const experimentProgress = computed(() => Math.floor((currentTrial.value - 1) / TOTAL_TRIALS * 100))

const experimentStartTime = ref(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))
const experimentStartTimestamp = ref(Date.now())
const catchTrialResults = ref<string[]>([])

// ---- State persistence ----

function loadSavedState(): boolean {
	const savedState = localStorage.getItem('experimentState')
	if (!savedState) {
		return false
	}

	const parsed = JSON.parse(savedState)
	if (parsed.version !== STATE_VERSION) {
		localStorage.removeItem('experimentState')
		return false
	}

	trials.value = parsed.trials
	currentTrial.value = parsed.currentTrial
	trialData.value = parsed.trialData
	experimentStartTime.value = parsed.experimentStartTime
	experimentStartTimestamp.value = parsed.experimentStartTimestamp
	catchTrialResults.value = parsed.catchTrialResults || []
	return true
}

function saveState() {
	const state = {
		version: STATE_VERSION,
		trials: trials.value,
		currentTrial: currentTrial.value,
		trialData: trialData.value,
		experimentStartTime: experimentStartTime.value,
		experimentStartTimestamp: experimentStartTimestamp.value,
		catchTrialResults: catchTrialResults.value,
	}
	localStorage.setItem('experimentState', JSON.stringify(state))
}

watch([currentTrial, trialData], saveState, { deep: true })

// ---- Trial logic ----

function startTrial() {
	if (currentTrial.value > TOTAL_TRIALS) {
		submitData()
		return
	}

	const trial = trials.value[currentTrial.value - 1]
	trialStartDateTime.value = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

	if (trial.type === 'regular') {
		currentImages.value = [
			{ url: trial.image1Url },
			{ url: trial.image2Url },
		]
	}
	else {
		const images = [
			{ url: trial.catchUrl },
			{ url: trial.mainUrl },
		]
		if (trial.catchPosition === 1) {
			images.reverse()
		}
		currentImages.value = images
	}

	startTime.value = Date.now()
	isClicked.value = false

	preloadAhead(trials.value, currentTrial.value)
}

function handleClick(index: number) {
	if (longPressed) {
		return
	}
	if (isClicked.value) {
		return
	}
	if (!checkExperimentStatus()) {
		return
	}

	isClicked.value = true
	const endTime = Date.now()
	const reactionTime = endTime - startTime.value
	const trialEndDateTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

	const trial = trials.value[currentTrial.value - 1]

	let catchTrialCorrect: string | null = null

	if (trial.type === 'regular') {
		const selectedMethod = index === 0 ? trial.method1 : trial.method2
		trialData.value.push({
			trial_id: currentTrial.value,
			trial_type: 'regular',
			paperId: trial.paperId,
			method1: trial.method1,
			method2: trial.method2,
			selected_index: index,
			selectedMethod,
			reaction_time: reactionTime,
			timestamp: endTime,
			catch_trial_correct: null,
			trial_start_datetime: trialStartDateTime.value,
			trial_end_datetime: trialEndDateTime,
		})
	}
	else {
		const selectedCatch = index === trial.catchPosition
		catchTrialCorrect = selectedCatch ? 'false' : 'true'
		catchTrialResults.value.push(catchTrialCorrect)

		trialData.value.push({
			trial_id: currentTrial.value,
			trial_type: 'catch',
			catchFile: trial.catchFile,
			mainPaperId: trial.mainPaperId,
			mainMethod: trial.mainMethod,
			selected_index: index,
			selectedCatch,
			reaction_time: reactionTime,
			timestamp: endTime,
			catch_trial_correct: catchTrialCorrect,
			trial_start_datetime: trialStartDateTime.value,
			trial_end_datetime: trialEndDateTime,
		})
	}

	currentTrial.value++
	if (currentTrial.value <= TOTAL_TRIALS) {
		startTrial()
	}
	else {
		submitData()
	}
}

// ---- Experiment flow ----

function checkExperimentStatus() {
	const hasSeenInstructions = localStorage.getItem('hasSeenInstructions')
	const participantInfo = localStorage.getItem('participantInfo')

	if (!hasSeenInstructions || !participantInfo) {
		showToast('实验流程异常，请重新开始实验')
		router.push('/instructions')
		return false
	}
	return true
}

function initExperiment() {
	const restored = loadSavedState()
	if (!restored) {
		trials.value = generateTrials()
		experimentStartTime.value = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
		experimentStartTimestamp.value = Date.now()
		saveState()
	}

	preloadAhead(trials.value, currentTrial.value - 1)
	startTrial()
}

function checkAndSubmitData() {
	const savedState = localStorage.getItem('experimentState')
	if (savedState) {
		const parsed = JSON.parse(savedState)
		if (parsed.version !== STATE_VERSION) {
			localStorage.removeItem('experimentState')
			initExperiment()
			return
		}
		if (parsed.currentTrial > TOTAL_TRIALS) {
			const dataSubmitted = localStorage.getItem('dataSubmitted')
			if (dataSubmitted !== 'true') {
				loadSavedState()
				submitData()
			}
			else {
				router.push('/experiment-end')
			}
		}
		else {
			initExperiment()
		}
	}
	else {
		initExperiment()
	}
}

async function submitData() {
	const participantInfo = JSON.parse(localStorage.getItem('participantInfo') || '{}')

	const experimentEndTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
	const experimentEndTimestamp = Date.now()
	const experimentDuration = experimentEndTimestamp - experimentStartTimestamp.value

	const allCatchTrialsCorrect = catchTrialResults.value.every(result => result === 'true')

	const userId = localStorage.getItem('user_id')
	const questionnaireId = localStorage.getItem('questionnaire_id')
	const updatedParticipantInfo = {
		...participantInfo,
		catchTrialCorrect: allCatchTrialsCorrect.toString(),
		user_id: userId,
		questionnaire_id: questionnaireId,
		experimentStartDateTime: experimentStartTime.value,
		experimentEndDateTime: experimentEndTime,
		experimentDuration,
	}

	const experimentData = {
		participantInfo: updatedParticipantInfo,
		trialData: trialData.value,
	}

	loading.value = true
	loadingProgress.value = 0
	try {
		const response = await fetch(`${import.meta.env.VITE_EXPERIMENT_API_URL}/submit_data`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(experimentData),
			mode: 'cors',
			credentials: 'same-origin',
		})

		if (!response.ok) {
			throw new Error('Failed to submit data')
		}

		const result = await response.json()
		console.log('Data submitted successfully:', result)

		localStorage.setItem('dataSubmitted', 'true')
		localStorage.setItem('participantInfo', JSON.stringify(updatedParticipantInfo))

		showToast('数据提交成功')
		router.push('/experiment-end')
	}
	catch (error) {
		console.error('Error submitting data:', error)
		showToast('数据提交失败，请重试')
	}
	finally {
		loading.value = false
	}
}

onMounted(async () => {
	if (!checkExperimentStatus()) {
		return
	}

	const apiIsWorking = await checkApiStatus()
	if (!apiIsWorking) {
		router.push('/network-error')
		return
	}

	checkAndSubmitData()
})

onUnmounted(() => {
	// cleanup if needed
})
</script>

<style lang="less" scoped>
.experiment {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px;
	min-height: 100vh;
	box-sizing: border-box;
}

.progress-row {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	max-width: 1200px;
}

.progress-bar {
	flex: 1;
}

.progress-text {
	font-size: 14px;
	color: #666;
	white-space: nowrap;
}

.content {
	width: 100%;
	max-width: 1200px;
	margin-top: 12px;
}

.prompt {
	text-align: center;
	font-size: 20px;
	margin-bottom: 16px;
	color: #444;
}

.highlight-text {
	font-size: 28px;
	font-weight: bold;
	color: #1989fa;
}

.prompt-hint {
	display: block;
	font-size: 14px;
	font-weight: normal;
	color: #999;
	margin-top: 4px;
}

.image-choice {
	display: flex;
	flex-direction: column;
	gap: 0;
	align-items: center;
}

.vs-separator {
	font-size: 18px;
	font-weight: bold;
	color: #999;
	padding: 4px 0;
	user-select: none;
	flex-shrink: 0;
}

.image-card {
	position: relative;
	width: 100%;
	box-sizing: border-box;
	border-radius: 12px;
	overflow: hidden;
	cursor: pointer;
	border: 3px solid transparent;
	background: #fff;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	transition:
		border-color 0.2s,
		box-shadow 0.2s,
		transform 0.15s;

	&:hover {
		border-color: #1989fa;
		box-shadow: 0 4px 16px rgba(25, 137, 250, 0.25);
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}

	&.disabled {
		pointer-events: none;
		opacity: 0.5;
	}
}

.image-label {
	position: absolute;
	top: 10px;
	left: 10px;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: #1989fa;
	color: #fff;
	font-size: 18px;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.trial-image {
	display: block;
	width: 100%;
	height: auto;

	@media (min-width: 769px) {
		max-height: calc((100vh - 140px) / 2);
		object-fit: contain;
	}
}

.zoom-overlay {
	position: fixed;
	inset: 0;
	z-index: 1000;
	background: rgba(0, 0, 0, 0.85);
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16px;
	overflow: auto;
}

.zoom-header {
	width: 100%;
	max-width: 1400px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	flex-shrink: 0;
}

.zoom-title {
	font-size: 24px;
	font-weight: bold;
	color: #fff;
}

.zoom-close {
	width: 36px;
	height: 36px;
	border: none;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	color: #fff;
	font-size: 20px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;

	&:hover {
		background: rgba(255, 255, 255, 0.4);
	}
}

.zoom-image {
	max-width: 100%;
	max-height: calc(100vh - 80px);
	object-fit: contain;
	border-radius: 8px;
}

@media (max-width: 768px) {
	.experiment {
		padding: 8px;
	}

	.prompt {
		font-size: 18px;
		margin-bottom: 12px;
	}

	.highlight-text {
		font-size: 24px;
	}

	.image-label {
		width: 28px;
		height: 28px;
		font-size: 14px;
		top: 8px;
		left: 8px;
	}

	.vs-separator {
		font-size: 16px;
		padding: 6px 0;
	}
}
</style>
