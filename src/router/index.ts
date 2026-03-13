import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import NProgress from '@/plugins/progress'
import { TOTAL_TRIALS } from '@/utils/preloader'

// 批量加载路由模块
const modules: Record<string, any> = import.meta.glob(
	['./modules/**/*.ts'],
	{
		eager: true,
	},
)

const routes: RouteRecordRaw[] = []

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

router.beforeEach(async (to, from, next) => {
	NProgress.start()

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
	else if (to.name === 'Preloading') {
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
	else if (to.name === 'ExperimentEnd') {
		if (dataSubmitted === 'true') {
			next()
		}
		else if (!hasGivenConsent) {
			next({ name: 'InformedConsent' })
		}
		else if (!hasSeenInstructions) {
			next({ name: 'Instructions' })
		}
		else {
			// 检查实验是否真正完成
			const experimentState = localStorage.getItem('experimentState')
			if (experimentState) {
				try {
					const parsed = JSON.parse(experimentState)
					if (parsed.currentTrial > TOTAL_TRIALS) {
						next()
						return
					}
				}
				catch {}
			}
			// 未完成则重定向回实验
			next({ name: 'Experiment' })
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
