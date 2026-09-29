import { ValidationError } from '../core/errors.js'
import type { PayFastConfig, RefundRequest, RefundResponse } from '../types/index.js'
import { HttpClient } from '../utils/http.js'

export class Refunds {
	private readonly client: HttpClient

	constructor(config: PayFastConfig) {
		this.client = new HttpClient(config)
	}

	async fetch(pfPaymentId: string): Promise<RefundResponse> {
		if (!pfPaymentId) {
			throw new ValidationError('pfPaymentId is required', 'pfPaymentId')
		}

		const endpoint = `/refunds/${pfPaymentId}`
		return this.client.get<RefundResponse>(endpoint)
	}

	async create(pfPaymentId: string, data: RefundRequest): Promise<RefundResponse> {
		if (!pfPaymentId) {
			throw new ValidationError('pfPaymentId is required', 'pfPaymentId')
		}

		if (!data.amount || data.amount <= 0) {
			throw new ValidationError('amount must be greater than 0', 'amount')
		}

		const endpoint = `/refunds/${pfPaymentId}`
		return this.client.post<RefundResponse>(endpoint, data as unknown as Record<string, unknown>)
	}
}
