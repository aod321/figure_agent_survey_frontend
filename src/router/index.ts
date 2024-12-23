/*
 * @Author: DaiYu
 * @Date: 2022-02-18 17:29:40
 * @LastEditors: DaiYu
 * @LastEditTime: 2022-10-13 10:42:46
 * @FilePath: \src\router\index.ts
 */
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import WeChatOnly from '../views/WeChatOnly.vue'
import baseRoutes from './modules/base' // 确保正确导入
import NProgress from '@/plugins/progress'
import ExperimentView from '@/views/index/index.vue'
import NetworkErrorView from '@/views/NetworkError.vue'

// 批量加载路由模块
const modules: Record<string, any> = import.meta.glob(
	// ['./modules/**/*.ts', '!**/dashboard.ts', '!**/about.ts'],
	['./modules/**/*.ts'],
	{
		eager: true,
	},
)
const routes: RouteRecordRaw[] = [
	...baseRoutes,
	{
		path: '/',
		redirect: '/informed-consent',
	},
	{
		path: '/informed-consent',
		name: 'InformedConsent',
		component: () => import('@/views/InformedConsent.vue'),
		meta: {
			title: '知情同意',
		},
	},
	{
		path: '/instructions',
		name: 'Instructions',
		component: () => import('@/views/Instructions.vue'),
		meta: {
			title: '实验指导',
		},
	},
	{
		path: '/experiment',
		name: 'Experiment',
		component: ExperimentView,
		meta: {
			title: '实验',
		},
	},
	{
		path: '/wechat-only',
		name: 'WeChatOnly',
		component: WeChatOnly,
	},
	{
		path: '/network-error',
		name: 'NetworkError',
		component: NetworkErrorView,
		meta: {
			title: '网络错误',
		},
	},
]

// 加入到路由集合中
Object.keys(modules).forEach((key) => {
	const mod = modules[key].default || {}
	const modList = Array.isArray(mod) ? [...mod] : [mod]
	routes.push(...modList)
})

const router = createRouter({
	history: createWebHistory(),
	routes,
})

// // Add this function to check if the browser is WeChat
// function isWeChatBrowser() {
// 	const ua = navigator.userAgent.toLowerCase()
// 	return ua.includes('micromessenger')
// }

router.beforeEach(async (to, from, next) => {
	NProgress.start()

	// // Check if the browser is WeChat before any other checks
	// if (!isWeChatBrowser() && to.name !== 'WeChatOnly') {
	// 	next({ name: 'WeChatOnly' })
	// 	return
	// }

	const hasGivenConsent = localStorage.getItem('hasGivenConsent')
	const hasSeenInstructions = localStorage.getItem('hasSeenInstructions')
	const dataSubmitted = localStorage.getItem('dataSubmitted')

	if (to.name === 'InformedConsent') {
		if (dataSubmitted === 'true') {
			next({ name: 'ExperimentEnd' })
		}
		else {
			next()
		}
	}
	else if (to.name === 'Instructions') {
		if (!hasGivenConsent) {
			next({ name: 'InformedConsent' })
		}
		else if (dataSubmitted === 'true') {
			next({ name: 'ExperimentEnd' })
		}
		else {
			next()
		}
	}
	else if (to.name === 'Experiment') {
		if (!hasGivenConsent) {
			next({ name: 'InformedConsent' })
		}
		else if (!hasSeenInstructions) {
			next({ name: 'Instructions' })
		}
		else {
			next()
		}
	}
	else {
		next()
	}
})

router.afterEach((_to) => {
	NProgress.done()
})

export default router
