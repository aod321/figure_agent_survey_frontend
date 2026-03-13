import type { RouteRecordRaw } from 'vue-router'
import ExperimentView from '@/views/index/index.vue'

const baseRoutes: Array<RouteRecordRaw> = [
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
		path: '/participant-info',
		name: 'ParticipantInfo',
		component: () => import('@/views/ParticipantInfo.vue'),
		meta: {
			title: '被试信息',
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
		path: '/preloading',
		name: 'Preloading',
		component: () => import('@/views/Preloading.vue'),
		meta: {
			title: '加载中',
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
		path: '/experiment-end',
		name: 'ExperimentEnd',
		component: () => import('@/views/ExperimentEnd.vue'),
	},
	{
		path: '/wechat-only',
		name: 'WeChatOnly',
		component: () => import('@/views/WeChatOnly.vue'),
	},
	{
		path: '/network-error',
		name: 'NetworkError',
		component: () => import('@/views/NetworkError.vue'),
		meta: {
			title: '网络错误',
		},
	},
	{
		path: '/thank-you',
		name: 'ThankYou',
		component: () => import('@/views/ThankYou.vue'),
		meta: {
			title: '感谢参与',
		},
	},
]

export default baseRoutes
