import { DEFAULT_CONFIG, PAYFAST_URLS } from '../core/constants.js'
import { ValidationError } from '../core/errors.js'
import type { OnsitePaymentIdentifier, PayFastConfig, PaymentData } from '../types/index.js'
import { generateSignature } from '../utils/signature.js'
import { validatePaymentData } from '../utils/validation.js'

export class OnsitePayments {
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

	getEngineUrl(): string {
		return this.sandbox ? PAYFAST_URLS.ONSITE_ENGINE_SANDBOX : PAYFAST_URLS.ONSITE_ENGINE_LIVE
	}

	async generatePaymentIdentifier(data: PaymentData): Promise<OnsitePaymentIdentifier> {
		if (this.sandbox) {
			throw new Error('Onsite payments are not available in sandbox mode')
		}

		validatePaymentData(data)

		if (!data.email_address && !data.cell_number) {
			throw new ValidationError('Onsite payments require email_address or cell_number', 'email_address')
		}

		// Build in exact PayFast order
		const paymentData: Record<string, string> = {}

		paymentData.merchant_id = this.merchantId
		paymentData.merchant_key = this.merchantKey

		if (data.return_url) paymentData.return_url = data.return_url
		if (data.cancel_url) paymentData.cancel_url = data.cancel_url
		if (data.notify_url) paymentData.notify_url = data.notify_url

		if (data.name_first) paymentData.name_first = data.name_first
		if (data.name_last) paymentData.name_last = data.name_last
		if (data.email_address) paymentData.email_address = data.email_address
		if (data.cell_number) paymentData.cell_number = data.cell_number

		if (data.m_payment_id) paymentData.m_payment_id = data.m_payment_id
		paymentData.amount = data.amount
		paymentData.item_name = data.item_name
		if (data.item_description) paymentData.item_description = data.item_description

		const signature = generateSignature(paymentData, this.passphrase)
		paymentData.signature = signature

		// Build body using same encoding as generateSignature
		let paramString = ''
		for (const key in paymentData) {
			paramString += `${key}=${encodeURIComponent(String(paymentData[key]).trim()).replace(/%20/g, '+')}&`
		}
		paramString = paramString.slice(0, -1)

		const response = await fetch('https://www.payfast.co.za/onsite/process', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: paramString,
		})

		if (!response.ok) {
			const text = await response.text()
			throw new Error(`PayFast returned ${response.status}: ${text.slice(0, 200)}`)
		}

		const json = (await response.json()) as { uuid?: string }

		if (!json.uuid) {
			throw new Error('No UUID in PayFast response')
		}

		return { uuid: json.uuid }
	}

	generatePaymentScript(uuid: string): string {
		return `window.payfast_do_onsite_payment({"uuid":"${uuid}"});`
	}

	generatePaymentHtml(uuid: string): string {
		return `<script src="${this.getEngineUrl()}"></script>
<script type="text/javascript">
  ${this.generatePaymentScript(uuid)}
</script>`
	}
}
