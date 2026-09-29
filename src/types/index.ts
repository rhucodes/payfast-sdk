/**
 * PayFast SDK Configuration
 */
export interface PayFastConfig {
	merchantId: string
	merchantKey: string
	passphrase?: string
	sandbox?: boolean
	timeout?: number
}

/**
 * Payment Methods
 */
export type PaymentMethod =
	| 'cc' // Credit Card
	| 'dc' // Debit Card
	| 'ef' // EFT
	| 'mp' // Masterpass
	| 'mc' // Mobicred
	| 'sc' // SCode
	| 'ss' // SnapScan
	| 'zp' // Zapper
	| 'mt' // MoreTyme
	| 'cd' // 1Voucher
	| 'rcs' // Store Card

/**
 * Subscription Frequency
 */
export type SubscriptionFrequency = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Payment Data
 */
export interface PaymentData {
	amount: string
	item_name: string
	item_description?: string
	m_payment_id?: string
	name_first?: string
	name_last?: string
	email_address?: string
	cell_number?: string
	custom_str1?: string
	custom_str2?: string
	custom_str3?: string
	custom_str4?: string
	custom_str5?: string
	custom_int1?: number
	custom_int2?: number
	custom_int3?: number
	custom_int4?: number
	custom_int5?: number
	payment_method?: PaymentMethod
	return_url?: string
	cancel_url?: string
	notify_url?: string
	email_confirmation?: 0 | 1
	confirmation_address?: string
}

/**
 * Subscription Data
 */
export interface SubscriptionData extends PaymentData {
	subscription_type: 1
	billing_date?: string
	recurring_amount?: string
	frequency: SubscriptionFrequency
	cycles: number
	subscription_notify_email?: boolean
	subscription_notify_webhook?: boolean
	subscription_notify_buyer?: boolean
}

/**
 * Tokenization Data
 */
export interface TokenizationData extends PaymentData {
	subscription_type: 2
}

/**
 * ITN Payload
 */
export interface ITNPayload {
	m_payment_id: string
	pf_payment_id: string
	payment_status: 'COMPLETE' | 'FAILED' | 'PENDING' | 'CANCELLED'
	item_name: string
	item_description?: string
	amount_gross: string
	amount_fee: string
	amount_net: string
	custom_str1?: string
	custom_str2?: string
	custom_str3?: string
	custom_str4?: string
	custom_str5?: string
	custom_int1?: string
	custom_int2?: string
	custom_int3?: string
	custom_int4?: string
	custom_int5?: string
	name_first?: string
	name_last?: string
	email_address?: string
	merchant_id: string
	token?: string
	billing_date?: string
	signature: string
}

/**
 * Subscription
 */
export interface Subscription {
	token: string
	amount: number
	cycles: number
	cycles_complete: number
	frequency: SubscriptionFrequency
	run_date: string
	status: number
	status_reason?: string
	status_text: string
}

/**
 * Transaction
 */
export interface Transaction {
	pf_payment_id: string
	m_payment_id?: string
	date: string
	amount: number
	fee: number
	net: number
	status: string
	type: string
	sign?: string
	party?: string
	name?: string
	description?: string
}

/**
 * Refund Request
 */
export interface RefundRequest {
	amount: number
	reason?: 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'stock' | 'other'
	notify_buyer?: 0 | 1
}

/**
 * Refund Response
 */
export interface RefundResponse {
	pf_payment_id: string
	amount_refunded: number
	status: string
}

/**
 * API Response
 */
export interface APIResponse<T> {
	code: number
	status: 'success' | 'failed'
	data: T
}

/**
 * ITN Validation Result
 */
export interface ITNValidationResult {
	valid: boolean
	error?: string
	payload?: ITNPayload
}

/**
 * Credit Card Transaction
 */
export interface CreditCardTransaction {
	pf_payment_id: string
	transaction_type: string
	amount: number
	fee: number
	net: number
	status: string
	date: string
	card_type?: string
	card_last_four?: string
}

/**
 * Subscription Update Data
 */
export interface SubscriptionUpdateData {
	cycles?: number
	frequency?: SubscriptionFrequency
	run_date?: string
	amount?: number
}

/**
 * Adhoc Payment Data
 */
export interface AdhocPaymentData {
	amount: number
	item_name: string
	item_description?: string
	m_payment_id?: string
}

/**
 * Onsite Payment Identifier
 */
export interface OnsitePaymentIdentifier {
	uuid: string
}
