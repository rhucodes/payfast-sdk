import { createHash } from 'node:crypto'

export function generateSignature(
	data: Record<string, string | number | undefined>,
	passphrase?: string,
) {
	const { signature: _, ...dataWithoutSignature } = data // always strip signature

	let pfOutput = ''
	for (const key in dataWithoutSignature) {
		if (
			Object.hasOwn(dataWithoutSignature, key) &&
			dataWithoutSignature[key] !== undefined &&
			dataWithoutSignature[key] !== ''
		) {
			pfOutput += `${key}=${encodeURIComponent(String(dataWithoutSignature[key]).trim()).replace(/%20/g, '+')}&`
		}
	}

	let getString = pfOutput.slice(0, -1)

	if (passphrase !== null && passphrase !== undefined) {
		getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`
	}

	return createHash('md5').update(getString).digest('hex')
}

/**
 * Verify a signature from PayFast ITN
 */
export function verifySignature(
	payload: Record<string, string | number | undefined>,
	passphrase?: string,
): boolean {
	const receivedSignature = payload.signature
	if (!receivedSignature || typeof receivedSignature !== 'string') {
		return false
	}

	const calculatedSignature = generateSignature(payload, passphrase)
	return calculatedSignature.toLowerCase() === receivedSignature.toLowerCase()
}

/**
 * Generate API request headers
 */
export function generateAPIHeaders(
	merchantId: string,
	passphrase: string | undefined,
	data: Record<string, string | number | undefined> = {},
): Record<string, string> {
	const timestamp = new Date().toISOString().split('.')[0] ?? ''

	const headers: Record<string, string> = {
		'merchant-id': merchantId,
		version: 'v1',
		timestamp: timestamp,
	}

	const signatureData: Record<string, string | number | undefined> = {
		...data,
		...headers,
	}

	if (passphrase && passphrase.length > 0) {
		signatureData.passphrase = passphrase
	}

	const signature = generateSignatureForAPI(signatureData)
	headers.signature = signature

	return headers
}

function generateSignatureForAPI(
	data: Record<string, string | number | undefined>,
): string {
	const filteredData: Record<string, string> = {}

	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined && value !== null && key !== 'signature') {
			filteredData[key] = String(value)
		}
	}

	const sortedKeys = Object.keys(filteredData).sort()

	const paramString = sortedKeys
		.map((key) => {
			const value = filteredData[key] ?? ''
			const encodedValue = encodeURIComponent(value).replace(/%20/g, '+')
			return `${key}=${encodedValue}`
		})
		.join('&')

	return createHash('md5').update(paramString).digest('hex')
}
