import { DEFAULT_CONFIG, PAYFAST_URLS } from '../core/constants.js'
import type { PayFastConfig, PaymentData, SubscriptionData, TokenizationData } from '../types/index.js'
import { generateSignature } from '../utils/signature.js'
import { validatePaymentData, validateSubscriptionData } from '../utils/validation.js'

export class Payments {
	private readonly merchantId: string
	private readonly merchantKey: string
	private readonly passphrase?: string
	private readonly sandbox: boolean

	constructor(config: PayFastConfig) {
		this.merchantId = config.merchantId
		this.merchantKey = config.merchantKey
		this.passphrase = config.passphrase
		this.sandbox = config.sandbox ?? DEFAULT_CONFIG.SANDBOX
	}

	private getPaymentUrl(): string {
		return this.sandbox ? PAYFAST_URLS.PAYMENT_SANDBOX : PAYFAST_URLS.PAYMENT_LIVE
	}

	private buildPaymentData(data: PaymentData | SubscriptionData | TokenizationData): Record<string, string> {
		// PayFast requires fields in a specific order for signature generation
		// Order: merchant details -> URLs -> buyer details -> transaction details ->
		//        custom fields -> subscription details -> email confirmation

		const paymentData: Record<string, string> = {}

		// 1. Merchant details (required)
		paymentData.merchant_id = this.merchantId
		paymentData.merchant_key = this.merchantKey

		// 2. URLs
		if (data.return_url) paymentData.return_url = data.return_url
		if (data.cancel_url) paymentData.cancel_url = data.cancel_url
		if (data.notify_url) paymentData.notify_url = data.notify_url

		// 3. Buyer details
		if (data.name_first) paymentData.name_first = data.name_first
		if (data.name_last) paymentData.name_last = data.name_last
		if (data.email_address) paymentData.email_address = data.email_address
		if (data.cell_number) paymentData.cell_number = data.cell_number

		// 4. Transaction details
		if (data.m_payment_id) paymentData.m_payment_id = data.m_payment_id
		if (data.amount) paymentData.amount = data.amount
		if (data.item_name) paymentData.item_name = data.item_name
		if (data.item_description) paymentData.item_description = data.item_description

		// 5. Custom fields
		if (data.custom_str1) paymentData.custom_str1 = data.custom_str1
		if (data.custom_str2) paymentData.custom_str2 = data.custom_str2
		if (data.custom_str3) paymentData.custom_str3 = data.custom_str3
		if (data.custom_str4) paymentData.custom_str4 = data.custom_str4
		if (data.custom_str5) paymentData.custom_str5 = data.custom_str5
		if (data.custom_int1 !== undefined) paymentData.custom_int1 = String(data.custom_int1)
		if (data.custom_int2 !== undefined) paymentData.custom_int2 = String(data.custom_int2)
		if (data.custom_int3 !== undefined) paymentData.custom_int3 = String(data.custom_int3)
		if (data.custom_int4 !== undefined) paymentData.custom_int4 = String(data.custom_int4)
		if (data.custom_int5 !== undefined) paymentData.custom_int5 = String(data.custom_int5)

		// 6. Payment method
		if (data.payment_method) paymentData.payment_method = data.payment_method

		// 7. Subscription details (if applicable)
		if ('subscription_type' in data) {
			paymentData.subscription_type = String(data.subscription_type)

			if (data.subscription_type === 1) {
				const subData = data as SubscriptionData
				if (subData.billing_date !== undefined) paymentData.billing_date = String(subData.billing_date)
				if (subData.recurring_amount) paymentData.recurring_amount = subData.recurring_amount
				paymentData.frequency = String(subData.frequency)
				paymentData.cycles = String(subData.cycles)
			}
		}

		// 8. Email confirmation
		if (data.email_confirmation !== undefined) paymentData.email_confirmation = String(data.email_confirmation)
		if (data.confirmation_address) paymentData.confirmation_address = data.confirmation_address

		// Generate signature from ordered data
		const signature = generateSignature(paymentData, this.passphrase)
		paymentData.signature = signature

		return paymentData
	}

	generatePaymentUrl(data: PaymentData): string {
		validatePaymentData(data)

		const paymentData = this.buildPaymentData(data)
		const params = new URLSearchParams(paymentData)

		return `${this.getPaymentUrl()}?${params.toString()}`
	}

	generateFormHtml(
		data: PaymentData,
		options: {
			submitText?: string
			submitClass?: string
			formId?: string
			autoSubmit?: boolean
		} = {}
	): string {
		validatePaymentData(data)

		const paymentData = this.buildPaymentData(data)
		const { submitText = 'Pay Now', submitClass = '', formId = 'payfast-form', autoSubmit = false } = options

		const fields = Object.entries(paymentData)
			.map(([key, value]) => `  <input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`)
			.join('\n')

		const classAttr = submitClass ? ` class="${escapeHtml(submitClass)}"` : ''
		const autoSubmitScript = autoSubmit ? `\n<script>document.getElementById('${formId}').submit();</script>` : ''

		return `<form id="${formId}" action="${this.getPaymentUrl()}" method="POST">
${fields}
  <button type="submit"${classAttr}>${escapeHtml(submitText)}</button>
</form>${autoSubmitScript}`
	}

	generateFormFields(data: PaymentData): Record<string, string> {
		validatePaymentData(data)
		return this.buildPaymentData(data)
	}

	generateSubscriptionUrl(data: SubscriptionData): string {
		validateSubscriptionData(data)

		const paymentData = this.buildPaymentData(data)
		const params = new URLSearchParams(paymentData)

		return `${this.getPaymentUrl()}?${params.toString()}`
	}

	generateTokenizationUrl(data: TokenizationData): string {
		validatePaymentData(data)

		if (data.subscription_type !== 2) {
			throw new Error('subscription_type must be 2 for tokenization')
		}

		const paymentData = this.buildPaymentData(data)
		const params = new URLSearchParams(paymentData)

		return `${this.getPaymentUrl()}?${params.toString()}`
	}

	getProcessUrl(): string {
		return this.getPaymentUrl()
	}
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
