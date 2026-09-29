import type { PayFastConfig, Transaction } from '../types/index.js'
import { HttpClient } from '../utils/http.js'

export interface TransactionQueryOptions {
	offset?: number
	limit?: number
}

export interface DateRangeOptions extends TransactionQueryOptions {
	from: string
	to: string
}

export interface DateOptions extends TransactionQueryOptions {
	date: string
}

export class TransactionHistory {
	private readonly client: HttpClient

	constructor(config: PayFastConfig) {
		this.client = new HttpClient(config)
	}

	async range(options: DateRangeOptions): Promise<Transaction[]> {
		return this.query('/transactions/history', { from: options.from, to: options.to }, options)
	}

	async daily(options: DateOptions): Promise<Transaction[]> {
		return this.query('/transactions/history/daily', { date: options.date }, options)
	}

	async weekly(options: DateOptions): Promise<Transaction[]> {
		return this.query('/transactions/history/weekly', { date: options.date }, options)
	}

	async monthly(options: DateOptions): Promise<Transaction[]> {
		return this.query('/transactions/history/monthly', { date: options.date }, options)
	}

	private query(endpoint: string, queryParams: Record<string, string>, options: TransactionQueryOptions): Promise<Transaction[]> {
		if (options.offset !== undefined) {
			queryParams.offset = String(options.offset)
		}
		if (options.limit !== undefined) {
			queryParams.limit = String(options.limit)
		}

		return this.client.get<Transaction[]>(endpoint, queryParams)
	}
}
