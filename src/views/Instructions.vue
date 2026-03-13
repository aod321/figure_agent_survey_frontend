<template>
	<div class="instructions">
		<h1 class="title">
			论文 Pipeline 图质量比较问卷说明
		</h1>
		<div class="instruction-content">
			<p>您将看到<strong class="highlight">多组</strong>论文 Pipeline 图。每组包含<strong class="highlight">两张来自同一篇论文的方法流程图</strong>。请在每组中选择<strong class="highlight">您认为更好的那一张</strong>。</p>

			<p>评判时主要参考以下四个方面：</p>

			<div class="criteria-list">
				<div class="criteria-item">
					<h3>技术准确性</h3>
					<p>符号、术语和组件是否正确，数据流和箭头方向是否合理。</p>
				</div>
				<div class="criteria-item">
					<h3>视觉清晰度</h3>
					<p>图像是否清晰、层次分明，不拥挤且易于阅读。</p>
				</div>
				<div class="criteria-item">
					<h3>结构逻辑</h3>
					<p>模块划分是否清楚，流程是否连贯，结构是否合理。</p>
				</div>
				<div class="criteria-item">
					<h3>易理解性</h3>
					<p>是否直观易懂，不需要大量文字也能理解方法。</p>
				</div>
			</div>

			<p>请<strong class="highlight">根据整体质量选择更好的图像，点击对应图片即可</strong>。长按图片可放大查看细节。</p>
			<p>实验进度会自动保存，您可以中途退出，下次打开后将从上次的位置继续。</p>
			<p style="color: #e67e22; font-weight: 500;">
				如有任何问题，请联系工作人员：shuan124@jhu.edu
			</p>
		</div>
		<van-button type="primary" size="large" class="instructions-button" @click="startExperiment">
			开始实验
		</van-button>
	</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { checkApiStatus } from '@/utils/apiCheck'

const router = useRouter()

function startExperiment() {
	localStorage.setItem('hasSeenInstructions', 'true')
	router.push({ name: 'Preloading' })
}

onMounted(async () => {
	const apiIsWorking = await checkApiStatus()
	if (!apiIsWorking) {
		router.push('/network-error')
	}

	const participantInfo = localStorage.getItem('participantInfo')
	if (!participantInfo) {
		router.push({ name: 'ParticipantInfo' })
	}
	else if (localStorage.getItem('hasSeenInstructions') === 'true') {
		router.push({ name: 'Preloading' })
	}
})
</script>

<style scoped>
.instructions {
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
	font-size: 28px;
	color: #2c3e50;
	text-align: center;
}

.instruction-content {
	max-width: 800px;
	width: 100%;
	margin-bottom: 30px;
	background-color: #ffffff;
	padding: 32px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

p {
	margin-bottom: 20px;
	font-size: 18px;
	line-height: 1.8;
	color: #34495e;
	text-align: justify;
}

.highlight {
	color: #3498db;
	font-weight: 600;
}

.criteria-list {
	margin: 16px 0 24px;
}

.criteria-item {
	margin-bottom: 16px;
	padding: 16px 20px;
	background-color: #f0f6ff;
	border-radius: 6px;
	border-left: 4px solid #3498db;
}

.criteria-item h3 {
	margin: 0 0 6px;
	font-size: 22px;
	color: #2c3e50;
}

.criteria-item p {
	margin: 0;
	font-size: 20px;
	color: #555;
}

.instructions-button {
	margin-top: 24px;
	width: 100%;
	max-width: 300px;
	height: 48px;
	font-size: 20px;
	border-radius: 4px;
}

@media (max-width: 768px) {
	.instructions {
		padding: 24px 16px;
	}

	.title {
		font-size: 24px;
	}

	.instruction-content {
		padding: 24px;
	}

	p {
		font-size: 16px;
		line-height: 1.6;
	}

	.criteria-item h3 {
		font-size: 18px;
	}

	.criteria-item p {
		font-size: 16px;
	}

	.instructions-button {
		max-width: 100%;
		font-size: 18px;
	}
}
</style>
