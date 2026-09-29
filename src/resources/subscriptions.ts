import type { AdhocPaymentData, PayFastConfig, Subscription, SubscriptionUpdateData } from '../types/index.js'
import { HttpClient } from '../utils/http.js'

export class Subscriptions {
	private readonly client: HttpClient

	constructor(config: PayFastConfig) {
		this.client = new HttpClient(config)
	}

	async fetch(token: string): Promise<Subscription> {
		const endpoint = `/subscriptions/${token}/fetch`
		return this.client.get<Subscription>(endpoint)
	}

	async pause(token: string, options: { cycles: number }): Promise<{ response: string }> {
		const endpoint = `/subscriptions/${token}/pause`
		return this.client.put<{ response: string }>(endpoint, options)
	}

	async unpause(token: string): Promise<{ response: string }> {
		const endpoint = `/subscriptions/${token}/unpause`
		return this.client.put<{ response: string }>(endpoint)
	}

	async cancel(token: string): Promise<{ response: string }> {
		const endpoint = `/subscriptions/${token}/cancel`
		return this.client.put<{ response: string }>(endpoint)
	}

	async update(token: string, data: SubscriptionUpdateData): Promise<{ response: string }> {
		const endpoint = `/subscriptions/${token}/update`
		return this.client.patch<{ response: string }>(endpoint, data as Record<string, unknown>)
	}

	async adhoc(token: string, data: AdhocPaymentData): Promise<{ pf_payment_id: string }> {
		const endpoint = `/subscriptions/${token}/adhoc`
		return this.client.post<{ pf_payment_id: string }>(endpoint, data as unknown as Record<string, unknown>)
	}
}
