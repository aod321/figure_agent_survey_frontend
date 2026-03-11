<template>
	<div class="participant-info-container">
		<div class="participant-info">
			<h2 class="title">
				请输入您的信息
			</h2>
			<van-form @submit="submitInfo">
				<van-cell-group inset>
					<van-field name="gender" label="性别" required :rules="[{ required: true, message: '请选择性别' }]">
						<template #input>
							<van-radio-group v-model="gender" direction="horizontal">
								<van-radio name="男">
									男
								</van-radio>
								<van-radio name="女">
									女
								</van-radio>
								<van-radio name="不填">
									不填
								</van-radio>
							</van-radio-group>
						</template>
					</van-field>
					<van-field
						v-model="phone"
						name="phone"
						label="手机号"
						type="tel"
						required
						placeholder="仅用于收款"
						:rules="[
							{ required: true, message: '请填写手机号' },
							{ validator: validatePhone, message: '请输入有效的手机号' },
						]"
					/>
					<van-field name="researchRole" label="科研身份" required :rules="[{ required: true, message: '请选择科研身份' }]">
						<template #input>
							<van-radio-group v-model="researchRole" direction="vertical">
								<van-radio name="教授">
									教授
								</van-radio>
								<van-radio name="博士后">
									博士后
								</van-radio>
								<van-radio name="学生">
									学生
								</van-radio>
								<van-radio name="公司科研人员">
									公司科研人员
								</van-radio>
								<van-radio name="其他">
									其他
								</van-radio>
							</van-radio-group>
						</template>
					</van-field>
					<van-field
						v-if="researchRole === '其他'"
						v-model="researchRoleOther"
						name="researchRoleOther"
						label="请说明"
						required
						placeholder="请填写您的科研身份"
						:rules="[{ required: true, message: '请填写科研身份' }]"
					/>
					<van-field
						v-model="researchYears"
						name="researchYears"
						label="科研年限"
						type="number"
						required
						placeholder="请输入数字（年）"
						:rules="[
							{ required: true, message: '请填写科研年限' },
							{ validator: validateYears, message: '请输入有效的年数' },
						]"
					/>
					<van-field name="pipelineTime" label="制作 Pipeline 图耗时" required :rules="[{ required: true, message: '请选择耗时' }]">
						<template #input>
							<van-radio-group v-model="pipelineTime" direction="vertical">
								<van-radio name="几小时">
									几小时
								</van-radio>
								<van-radio name="几天">
									几天
								</van-radio>
								<van-radio name="一周">
									一周
								</van-radio>
								<van-radio name="两三周">
									两三周
								</van-radio>
								<van-radio name="一月及以上">
									一月及以上
								</van-radio>
								<van-radio name="其他">
									其他
								</van-radio>
							</van-radio-group>
						</template>
					</van-field>
					<van-field
						v-if="pipelineTime === '其他'"
						v-model="pipelineTimeOther"
						name="pipelineTimeOther"
						label="请说明"
						required
						placeholder="请填写具体耗时"
						:rules="[{ required: true, message: '请填写具体耗时' }]"
					/>
				</van-cell-group>
				<div style="margin: 16px;">
					<van-button type="primary" class="start-button" native-type="submit">
						开始实验
					</van-button>
				</div>
			</van-form>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { checkApiStatus } from '@/utils/apiCheck'

const router = useRouter()

const gender = ref('')
const researchRole = ref('')
const researchRoleOther = ref('')
const researchYears = ref('')
const pipelineTime = ref('')
const pipelineTimeOther = ref('')
const phone = ref('')

function validateYears(val: string) {
	const years = Number.parseFloat(val)
	return !Number.isNaN(years) && years >= 0 && years < 80
}

function validatePhone(val: string) {
	return /^1[3-9]\d{9}$/.test(val)
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
		if (participantInfo && JSON.parse(participantInfo)?.phone) {
			// 如果已经填写过信息，加载参与者信息, 预加载资源, 跳转到指导语页面
			const parsedInfo = JSON.parse(participantInfo)
			gender.value = parsedInfo.gender || ''
			phone.value = parsedInfo.phone || ''
			researchRole.value = parsedInfo.researchRole || ''
			researchYears.value = parsedInfo.researchYears || ''
			pipelineTime.value = parsedInfo.pipelineTime || ''
			router.push('/instructions')
		}
	}
}

function submitInfo() {
	// 验证表单
	if (!gender.value || !phone.value || !researchRole.value || !researchYears.value || !pipelineTime.value) {
		showToast('请填写所有必填信息')
		return
	}

	if (!validateYears(researchYears.value)) {
		showToast('请输入有效的科研年限')
		return
	}

	if (researchRole.value === '其他' && !researchRoleOther.value) {
		showToast('请填写您的科研身份')
		return
	}

	if (pipelineTime.value === '其他' && !pipelineTimeOther.value) {
		showToast('请填写具体耗时')
		return
	}

	if (!validatePhone(phone.value)) {
		showToast('请输入有效的手机号')
		return
	}

	// Save participant info
	const participantInfo = {
		gender: gender.value,
		phone: phone.value,
		researchRole: researchRole.value === '其他' ? researchRoleOther.value : researchRole.value,
		researchYears: researchYears.value,
		pipelineTime: pipelineTime.value === '其他' ? pipelineTimeOther.value : pipelineTime.value,
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
	justify-content: flex-start;
	gap: 24px;
	flex-wrap: nowrap;
}

:deep(.van-radio-group--vertical) {
	display: flex;
	flex-direction: column;
	gap: 12px;
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
