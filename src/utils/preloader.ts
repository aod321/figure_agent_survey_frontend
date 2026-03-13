import { catchFiles, papers } from '@/data/paperManifest'

// ---- Types ----

export interface RegularTrial {
	type: 'regular'
	paperId: string
	method1: string
	method2: string
	image1Url: string
	image2Url: string
}

export interface CatchTrial {
	type: 'catch'
	catchFile: string
	catchUrl: string
	mainPaperId: string
	mainMethod: string
	mainUrl: string
	catchPosition: 0 | 1
}

export type Trial = RegularTrial | CatchTrial

// ---- Constants ----

const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL as string

export const TOTAL_TRIALS = 200
export const STATE_VERSION = 4
const REGULAR_TRIALS = 195
const CATCH_TRIALS = 5
const LOOKAHEAD = 10

// ---- Helpers ----

function fisherYatesShuffle<T>(arr: T[]): T[] {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

function pickN<T>(arr: T[], n: number): T[] {
	const shuffled = fisherYatesShuffle(arr)
	return shuffled.slice(0, n)
}

function mainImageUrl(paperId: string, method: string): string {
	return `${CDN_BASE}/${paperId}_${method}.jpg`
}

// ---- Trial generation ----

export function generateTrials(): Trial[] {
	const paperIds = Object.keys(papers)

	// 1. Build 195 regular trials
	const shuffled = fisherYatesShuffle(paperIds)
	const regularPapers = shuffled.slice(0, REGULAR_TRIALS)

	const regularTrials: RegularTrial[] = regularPapers.map((paperId) => {
		const methods = papers[paperId]
		const [method1, method2] = pickN(methods, 2)
		return {
			type: 'regular',
			paperId,
			method1,
			method2,
			image1Url: mainImageUrl(paperId, method1),
			image2Url: mainImageUrl(paperId, method2),
		}
	})

	// 2. Build 5 catch trials
	const catchTrials: CatchTrial[] = catchFiles.map((catchFile) => {
		const randomPaperId = paperIds[Math.floor(Math.random() * paperIds.length)]
		const methods = papers[randomPaperId]
		const mainMethod = methods[Math.floor(Math.random() * methods.length)]
		return {
			type: 'catch',
			catchFile,
			catchUrl: `${CDN_BASE}/${catchFile}`,
			mainPaperId: randomPaperId,
			mainMethod,
			mainUrl: mainImageUrl(randomPaperId, mainMethod),
			catchPosition: (Math.random() < 0.5 ? 0 : 1) as 0 | 1,
		}
	})

	// 3. Insert catch trials at random positions
	const trials: Trial[] = [...regularTrials]
	const catchPositions = pickN(
		Array.from({ length: TOTAL_TRIALS }, (_, i) => i),
		CATCH_TRIALS,
	).sort((a, b) => b - a)

	for (let i = 0; i < catchPositions.length; i++) {
		trials.splice(catchPositions[i], 0, catchTrials[i])
	}

	return trials
}

// ---- Preloading ----

const preloadedUrls = new Set<string>()
const pendingImages = new Set<HTMLImageElement>()

function preloadImage(url: string): void {
	if (preloadedUrls.has(url)) {
		return
	}
	const img = new Image()
	pendingImages.add(img)
	img.onload = () => {
		preloadedUrls.add(url)
		pendingImages.delete(img)
	}
	img.onerror = () => {
		pendingImages.delete(img)
	}
	img.src = url
}

export function getTrialUrls(trial: Trial): string[] {
	if (trial.type === 'regular') {
		return [trial.image1Url, trial.image2Url]
	}
	return [trial.catchUrl, trial.mainUrl]
}

export function preloadAhead(trials: Trial[], currentIndex: number): void {
	const end = Math.min(currentIndex + LOOKAHEAD, trials.length)
	for (let i = currentIndex; i < end; i++) {
		for (const url of getTrialUrls(trials[i])) {
			preloadImage(url)
		}
	}
}

export function preloadAllImages(
	trials: Trial[],
	startIndex: number,
	onProgress?: (_loaded: number, _total: number, _failed: number) => void,
): Promise<{ failedUrls: string[] }> {
	const urls = new Set<string>()
	for (let i = startIndex; i < trials.length; i++) {
		for (const url of getTrialUrls(trials[i])) {
			if (!preloadedUrls.has(url)) {
				urls.add(url)
			}
		}
	}

	const total = urls.size
	let loaded = 0
	const failedUrls: string[] = []

	if (total === 0) {
		onProgress?.(0, 0, 0)
		return Promise.resolve({ failedUrls: [] })
	}

	const BATCH_SIZE = 20
	const urlArray = [...urls]

	return new Promise((resolve) => {
		let index = 0
		const activeImages = new Set<HTMLImageElement>()

		function loadNext() {
			while (activeImages.size < BATCH_SIZE && index < urlArray.length) {
				const url = urlArray[index++]
				const img = new Image()
				activeImages.add(img)

				const done = (success: boolean) => {
					loaded++
					activeImages.delete(img)
					if (success) {
						preloadedUrls.add(url)
					}
					else {
						failedUrls.push(url)
					}
					onProgress?.(loaded, total, failedUrls.length)
					if (loaded >= total) {
						resolve({ failedUrls })
					}
					else {
						loadNext()
					}
				}

				img.onload = () => done(true)
				img.onerror = () => done(false)
				img.src = url
			}
		}

		loadNext()
	})
}
