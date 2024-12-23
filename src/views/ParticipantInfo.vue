<template>
	<div class="participant-info-container">
		<div class="participant-info">
			<h2 class="title">
				请输入您的信息
			</h2>
			<van-form @submit="onSubmit">
				<van-cell-group inset>
					<van-field
						v-model="age"
						name="age"
						label="年龄"
						type="number"
						placeholder="请输入您的年龄"
						:rules="[
							{ required: true, message: '请填写年龄' },
							{ validator: validateAge, message: '年龄必须是有效的数字' },
						]"
					/>
					<van-field name="gender" label="性别">
						<template #input>
							<van-radio-group v-model="gender" direction="horizontal">
								<van-radio name="男">
									男
								</van-radio>
								<van-radio name="女">
									女
								</van-radio>
							</van-radio-group>
						</template>
					</van-field>
				</van-cell-group>
				<div style="margin: 16px;">
					<van-button :disabled="isPreloading" type="primary" class="start-button" @click="submitInfo">
						{{ isPreloading ? '资源加载中...' : '开始实验' }}
					</van-button>
				</div>
			</van-form>
			<!-- 添加加载进度显示 -->
			<div v-if="isPreloading" class="preload-status">
				<van-progress :percentage="loadingProgress" :stroke-width="8" />
				<p class="loading-text">
					{{ loadingText }}
				</p>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getPreloadStatus, preloadImages } from '@/utils/preloader'
import { checkApiStatus } from '@/utils/apiCheck'

const router = useRouter()

const age = ref('')
const gender = ref('男')
const phone = ref('13000000001')

// 添加预加载相关的状态
const isPreloading = ref(false)
const loadingProgress = ref(0)
const loadingText = computed(() => {
	if (loadingProgress.value === 0) {
		return '准备加载资源...'
	}
	if (loadingProgress.value < 100) {
		return `正在加载资源...${loadingProgress.value}%`
	}
	return '加载完成，准备开始实验'
})

function validateAge(val: string) {
	const ageNum = Number.parseInt(val)
	return !Number.isNaN(ageNum) && ageNum > 0 && ageNum < 120
}

function onSubmit(values: any) {
	console.log('form values:', values)
	// TODO: 保存参与者信息到本地存储或发送到服务器
	localStorage.setItem('participantInfo', JSON.stringify({ ...values, name: '匿名' }))
	// 提交后跳转到实验指导页
	router.push('/instructions')
}

onMounted(async () => {
	const apiIsWorking = await checkApiStatus()
	if (!apiIsWorking) {
		router.push('/network-error')
	}
	checkExperimentStatus()
})

function checkExperimentStatus() {
	const dataSubmitted = localStorage.getItem('dataSubmitted')
	if (dataSubmitted === 'true') {
		showToast('实验已结束')
		router.push('/thank-you')
	}
	else {
		const participantInfo = localStorage.getItem('participantInfo')
		if (participantInfo && JSON.parse(participantInfo)?.age) {
			// 如果已经填写过信息，加载参与者信息, 预加载资源, 跳转到指导语页面
			const parsedInfo = JSON.parse(participantInfo)
			age.value = parsedInfo.age
			gender.value = parsedInfo.gender
			phone.value = parsedInfo.phone
			// 如果预加载未完成, 则预加载资源
			if (!getPreloadStatus().value) {
				preloadImages((progress) => {
					loadingProgress.value = progress
				})
			}
			router.push('/instructions')
		}
	}
}

function submitInfo() {
	// 验证表单
	if (!age.value || !gender.value) {
		showToast('请填写所有必填信息')
		return
	}

	// 验证年龄
	if (!validateAge(age.value)) {
		showToast('请输入有效的年龄')
		return
	}

	// Save participant info
	const participantInfo = {
		name: '匿名',
		age: age.value,
		gender: gender.value,
		phone: phone.value,
	}
	localStorage.setItem('participantInfo', JSON.stringify(participantInfo))

	// Redirect to Instructions page
	router.push('/instructions')
}
</script>

<style scoped>
.participant-info-container {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	background-color: #f5f5f5;
}

.participant-info {
	width: 100%;
	max-width: 600px;
	padding: 24px;
	background-color: #ffffff;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
	text-align: center;
	margin-bottom: 24px;
	font-size: 1.8em;
	color: #333;
	font-weight: 600;
}

.preload-status {
	margin-top: 24px;
}

.loading-text {
	margin-top: 12px;
	font-size: 16px;
	color: #666;
	text-align: center;
}

.van-form {
	margin-bottom: 24px;
}

.van-cell-group {
	margin-bottom: 16px;
}

.van-field {
	margin-bottom: 16px;
}

.van-radio-group {
	display: flex;
	justify-content: space-around;
}

.van-button {
	width: 100%;
	height: 44px;
	font-weight: 500;
}

.start-button {
	font-size: 32px;
}

.van-progress {
	height: 8px;
}

@media (max-width: 600px) {
	.participant-info {
		padding: 16px;
	}

	.title {
		font-size: 1.5em;
	}
}
</style>
