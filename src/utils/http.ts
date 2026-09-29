import { DEFAULT_CONFIG, PAYFAST_URLS } from '../core/constants.js'
import { APIError, AuthenticationError, NetworkError } from '../core/errors.js'
import type { APIResponse, PayFastConfig } from '../types/index.js'
import { generateAPIHeaders } from './signature.js'

export class HttpClient {
	private readonly merchantId: string
	private readonly passphrase?: string
	private readonly baseUrl: string
	private readonly timeout: number
	private readonly sandbox: boolean

	constructor(config: PayFastConfig) {
		this.merchantId = config.merchantId
		this.passphrase = config.passphrase
		this.sandbox = config.sandbox ?? DEFAULT_CONFIG.SANDBOX
		this.baseUrl = PAYFAST_URLS.API_LIVE
		this.timeout = config.timeout ?? DEFAULT_CONFIG.TIMEOUT
	}

	private buildUrl(endpoint: string, params?: Record<string, string>): string {
		let url = `${this.baseUrl}${endpoint}`

		const queryParams = new URLSearchParams(params)

		if (this.sandbox) {
			queryParams.set('testing', 'true')
		}

		const queryString = queryParams.toString()
		if (queryString) {
			url += `?${queryString}`
		}

		return url
	}

	async get<T>(
		endpoint: string,
		queryParams?: Record<string, string>,
	): Promise<T> {
		const url = this.buildUrl(endpoint, queryParams)
		const headers = generateAPIHeaders(this.merchantId, this.passphrase)

		return this.request<T>(url, {
			method: 'GET',
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
		})
	}

	async post<T>(
		endpoint: string,
		data?: Record<string, unknown>,
		queryParams?: Record<string, string>,
	): Promise<T> {
		return this.send<T>('POST', endpoint, data, queryParams)
	}

	async put<T>(
		endpoint: string,
		data?: Record<string, unknown>,
		queryParams?: Record<string, string>,
	): Promise<T> {
		return this.send<T>('PUT', endpoint, data, queryParams)
	}

	async patch<T>(
		endpoint: string,
		data?: Record<string, unknown>,
		queryParams?: Record<string, string>,
	): Promise<T> {
		return this.send<T>('PATCH', endpoint, data, queryParams)
	}

	private async send<T>(
		method: 'POST' | 'PUT' | 'PATCH',
		endpoint: string,
		data?: Record<string, unknown>,
		queryParams?: Record<string, string>,
	): Promise<T> {
		const url = this.buildUrl(endpoint, queryParams)

		const signatureData: Record<string, string | number | undefined> = {}
		if (data) {
			for (const [key, value] of Object.entries(data)) {
				if (typeof value === 'string' || typeof value === 'number') {
					signatureData[key] = value
				}
			}
		}

		const headers = generateAPIHeaders(
			this.merchantId,
			this.passphrase,
			signatureData,
		)

		return this.request<T>(url, {
			method,
			headers: {
				...headers,
				'Content-Type': 'application/json',
			},
			body: data ? JSON.stringify(data) : undefined,
		})
	}

	private async request<T>(url: string, options: RequestInit): Promise<T> {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), this.timeout)

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
			})

			clearTimeout(timeoutId)

			const json = (await response.json()) as
				| APIResponse<T>
				| {
						code: number
						status: string
						data: { response: string; message: string }
				  }

			if (!response.ok || json.status === 'failed') {
				const errorData = json as {
					code: number
					status: string
					data: { response: string; message: string }
				}

				if (
					response.status === 401 ||
					errorData.data?.response?.includes('authorization')
				) {
					throw new AuthenticationError(
						errorData.data?.response ?? 'Merchant authorization failed',
					)
				}

				throw new APIError(
					errorData.data?.response ?? 'API request failed',
					errorData.code ?? response.status,
					errorData.data,
				)
			}

			return (json as APIResponse<T>).data
		} catch (error) {
			clearTimeout(timeoutId)

			if (error instanceof APIError || error instanceof AuthenticationError) {
				throw error
			}

			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					throw new NetworkError(`Request timed out after ${this.timeout}ms`)
				}
				throw new NetworkError(error.message, error)
			}

			throw new NetworkError('Unknown network error')
		}
	}
}
