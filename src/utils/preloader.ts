import { ref } from 'vue'

const isPreloaded = ref(false)
const imagePairs = ref<number[][]>([])
const TOTAL_IMAGES = 300 // 需要选择的图片总数

// 生成实验所需的图片序列
function generateTrialImageSequence(): number[][] {
	// 1. 从10000中随机选择200张图片
	const allIds: number[] = Array.from({ length: 10000 }, (_, i) => i)
	const selectedIds: number[] = []

	// Fisher-Yates shuffle 前TOTAL_IMAGES个位置
	for (let i = 0; i < TOTAL_IMAGES; i++) {
		const randomIndex = i + Math.floor(Math.random() * (10000 - i))
		const temp = allIds[i]
		allIds[i] = allIds[randomIndex]
		allIds[randomIndex] = temp
		selectedIds.push(allIds[i])
	}

	// 2. 将这200张图片随机配对
	const pairs: number[][] = []
	const shuffledSelected = [...selectedIds]

	// 再次打乱200张图片的顺序
	for (let i = shuffledSelected.length - 1; i > 0; i--) {
		const randomIndex = Math.floor(Math.random() * (i + 1))
		const temp = shuffledSelected[i]
		shuffledSelected[i] = shuffledSelected[randomIndex]
		shuffledSelected[randomIndex] = temp
	}

	// 每两张配成一对
	for (let i = 0; i < shuffledSelected.length; i += 2) {
		pairs.push([shuffledSelected[i], shuffledSelected[i + 1]])
	}

	return pairs
}

// 预加载实验所需的所有图片
export function preloadImages(progressCallback: (_progress: number) => void): Promise<void> {
	if (isPreloaded.value) {
		return Promise.resolve()
	}

	return new Promise((resolve) => {
		// 生成实验需要的图片对
		imagePairs.value = generateTrialImageSequence()

		// 获取所有需要加载的图片ID
		const uniqueIds = [...new Set(imagePairs.value.flat())]

		// 加上catch trial需要的图片
		const catchImages = ['empty.jpg', 'hard.jpg']
		const totalImages = uniqueIds.length + catchImages.length
		let loadedCount = 0

		const updateProgress = () => {
			loadedCount++
			const progress = Math.floor((loadedCount / totalImages) * 100)
			progressCallback(progress)
			if (loadedCount === totalImages) {
				isPreloaded.value = true
				resolve()
			}
		}

		// 预加载实验图片
		uniqueIds.forEach((id) => {
			const img = new Image()
			img.src = `https://image.blog1.top/inz/${id.toString().padStart(5, '0')}.jpg`
			img.onload = img.onerror = updateProgress
		})

		// 预加载catch trial图片
		catchImages.forEach((filename) => {
			const img = new Image()
			img.src = `https://image.blog1.top/${filename}`
			img.onload = img.onerror = updateProgress
		})
	})
}

export function getPreloadStatus() {
	return isPreloaded
}

export function setPreloadStatus(status: boolean) {
	isPreloaded.value = status
}

// 获取预生成的图片对
export function getImagePairs() {
	return imagePairs.value
}
