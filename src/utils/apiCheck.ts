export async function checkApiStatus() {
	try {
		const response = await fetch(`${import.meta.env.VITE_EXPERIMENT_API_URL}/`, {
			method: 'GET',
			headers: {
				'accept': '*/*',
				'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
			},
		})

		if (!response.ok) {
			throw new Error('API is not responding correctly')
		}

		const data = await response.json()
		if (data.message !== 'Experiment API is running') {
			throw new Error('Unexpected API response')
		}

		return true
	}
	catch (error) {
		console.error('Error checking API status:', error)
		return false
	}
}
