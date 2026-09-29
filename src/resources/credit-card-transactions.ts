import { ValidationError } from '../core/errors.js'
import type { CreditCardTransaction, PayFastConfig } from '../types/index.js'
import { HttpClient } from '../utils/http.js'

export class CreditCardTransactions {
	private readonly client: HttpClient

	constructor(config: PayFastConfig) {
		this.client = new HttpClient(config)
	}

	async fetch(pfPaymentId: string): Promise<CreditCardTransaction> {
		if (!pfPaymentId) {
			throw new ValidationError('pfPaymentId is required', 'pfPaymentId')
		}

		const endpoint = `/process/query/${pfPaymentId}`
		return this.client.get<CreditCardTransaction>(endpoint)
	}
}
