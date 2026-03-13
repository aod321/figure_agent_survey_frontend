<template>
	<div class="preloading">
		<div class="preloading-card">
			<h2 class="preloading-title">
				正在加载实验图片...
			</h2>
			<van-progress :percentage="percentage" :stroke-width="8" class="preloading-progress" />
			<p class="preloading-text">
				{{ loaded }}/{{ total }}
			</p>
			<a class="skip-link" @click="skip">跳过预加载</a>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { STATE_VERSION, generateTrials, preloadAllImages } from '@/utils/preloader'

const router = useRouter()

const loaded = ref(0)
const total = ref(0)
const percentage = ref(0)

let cancelled = false

function skip() {
	cancelled = true
	router.push({ name: 'Experiment' })
}

onUnmounted(() => {
	cancelled = true
})

onMounted(() => {
	// Try to restore existing trials or generate new ones
	let trials
	let currentTrial = 1
	const savedState = localStorage.getItem('experimentState')

	if (savedState) {
		try {
			const parsed = JSON.parse(savedState)
			if (parsed.version === STATE_VERSION) {
				trials = parsed.trials
				currentTrial = parsed.currentTrial || 1
			}
		}
		catch {
			localStorage.removeItem('experimentState')
		}
	}

	if (!trials) {
		trials = generateTrials()
		const state = {
			version: STATE_VERSION,
			trials,
			currentTrial: 1,
			trialData: [],
			experimentStartTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
			experimentStartTimestamp: Date.now(),
			catchTrialResults: [],
		}
		localStorage.setItem('experimentState', JSON.stringify(state))
	}

	const startIndex = currentTrial - 1

	preloadAllImages(trials, startIndex, (l, t) => {
		if (cancelled) {
			return
		}
		loaded.value = l
		total.value = t
		percentage.value = t > 0 ? Math.floor((l / t) * 100) : 100
	}).then(() => {
		if (cancelled) {
			return
		}
		router.push({ name: 'Experiment' })
	})
})
</script>

<style scoped>
.preloading {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	background-color: #f8f9fa;
	padding: 16px;
	box-sizing: border-box;
}

.preloading-card {
	background: #fff;
	border-radius: 12px;
	padding: 40px 32px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	text-align: center;
	width: 100%;
	max-width: 420px;
}

.preloading-title {
	font-size: 20px;
	color: #2c3e50;
	margin: 0 0 24px;
}

.preloading-progress {
	margin-bottom: 12px;
}

.preloading-text {
	font-size: 16px;
	color: #666;
	margin: 0 0 24px;
}

.skip-link {
	font-size: 14px;
	color: #999;
	cursor: pointer;
	text-decoration: underline;
}

.skip-link:hover {
	color: #666;
}
</style>
