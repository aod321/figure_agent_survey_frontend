<template>
	<div class="thank-you">
		<h1>感谢参与</h1>
		<template v-if="canWechatPay === '是'">
			<p>实验已经结束，感谢您的宝贵时间和贡献。</p>
			<van-button type="primary" @click="goToWjx">
				跳转问卷星领取红包
			</van-button>
		</template>
		<template v-else>
			<p>感谢您的参与！请联系工作人员 shuan124@jhu.edu 领取您的被试费。</p>
		</template>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const canWechatPay = ref('')

function goToWjx() {
	window.location.href = 'https://v.wjx.cn/vm/YfS5uW4.aspx#'
}

onMounted(() => {
	// 防止用户通过后退按钮返回到之前的页面
	window.history.pushState(null, '', window.location.href)
	window.onpopstate = function () {
		window.history.pushState(null, '', window.location.href)
	}

	// 读取 canWechatPay
	const storedInfo = localStorage.getItem('participantInfo')
	if (storedInfo) {
		const parsed = JSON.parse(storedInfo)
		canWechatPay.value = parsed.canWechatPay || ''
	}
})
</script>

<style scoped>
.thank-you {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100vh;
	text-align: center;
}

h1 {
	font-size: 24px;
	margin-bottom: 20px;
}

p {
	margin-bottom: 10px;
}

.van-button {
	margin-top: 20px;
	font-size: 18px;
	padding: 12px 24px;
}
</style>
