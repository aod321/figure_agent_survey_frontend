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

export const TOTAL_TRIALS = 500
const REGULAR_TRIALS = 495
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
	return `/main_data/${paperId}_${method}.jpg`
}

// ---- Trial generation ----

export function generateTrials(): Trial[] {
	const paperIds = Object.keys(papers)

	// 1. Build 495 regular trials
	// Use all 435 papers once, then sample 60 more
	const shuffled = fisherYatesShuffle(paperIds)
	const extra = fisherYatesShuffle(paperIds).slice(0, REGULAR_TRIALS - paperIds.length)
	const regularPapers = [...shuffled, ...extra]

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
			catchUrl: `/catch_data/${catchFile}`,
			mainPaperId: randomPaperId,
			mainMethod,
			mainUrl: mainImageUrl(randomPaperId, mainMethod),
			catchPosition: (Math.random() < 0.5 ? 0 : 1) as 0 | 1,
		}
	})

	// 3. Insert catch trials at random positions among 500 slots
	const trials: Trial[] = [...regularTrials]
	const catchPositions = pickN(
		Array.from({ length: TOTAL_TRIALS }, (_, i) => i),
		CATCH_TRIALS,
	).sort((a, b) => b - a) // sort descending so splice doesn't shift indices

	for (let i = 0; i < catchPositions.length; i++) {
		trials.splice(catchPositions[i], 0, catchTrials[i])
	}

	return trials
}

// ---- Preloading ----

const preloadedUrls = new Set<string>()

function preloadImage(url: string): void {
	if (preloadedUrls.has(url)) {
		return
	}
	preloadedUrls.add(url)
	const img = new Image()
	img.src = url
}

function getTrialUrls(trial: Trial): string[] {
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
