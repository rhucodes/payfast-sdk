import { DEFAULT_CONFIG, SANDBOX_CREDENTIALS } from './core/constants.js'
import { CreditCardTransactions } from './resources/credit-card-transactions.js'
import { ITN } from './resources/itn.js'
import { OnsitePayments } from './resources/onsite.js'
import { Payments } from './resources/payments.js'
import { Refunds } from './resources/refunds.js'
import { Subscriptions } from './resources/subscriptions.js'
import { TransactionHistory } from './resources/transaction-history.js'
import type { PayFastConfig } from './types/index.js'
import { validateConfig } from './utils/validation.js'

export class PayFast {
	public readonly payments: Payments
	public readonly itn: ITN
	public readonly subscriptions: Subscriptions
	public readonly transactionHistory: TransactionHistory
	public readonly refunds: Refunds
	public readonly creditCardTransactions: CreditCardTransactions
	public readonly onsite: OnsitePayments

	private readonly config: Required<PayFastConfig>

	constructor(config: PayFastConfig) {
		validateConfig(config)

		this.config = {
			merchantId: config.merchantId,
			merchantKey: config.merchantKey,
			passphrase: config.passphrase ?? '',
			sandbox: config.sandbox ?? DEFAULT_CONFIG.SANDBOX,
			timeout: config.timeout ?? DEFAULT_CONFIG.TIMEOUT,
		}

		this.payments = new Payments(this.config)
		this.itn = new ITN(this.config)
		this.subscriptions = new Subscriptions(this.config)
		this.transactionHistory = new TransactionHistory(this.config)
		this.refunds = new Refunds(this.config)
		this.creditCardTransactions = new CreditCardTransactions(this.config)
		this.onsite = new OnsitePayments(this.config)
	}

	get isSandbox(): boolean {
		return this.config.sandbox
	}

	get merchantId(): string {
		return this.config.merchantId
	}

	static sandbox(): PayFast {
		return new PayFast({
			merchantId: SANDBOX_CREDENTIALS.MERCHANT_ID,
			merchantKey: SANDBOX_CREDENTIALS.MERCHANT_KEY,
			passphrase: SANDBOX_CREDENTIALS.PASSPHRASE,
			sandbox: true,
		})
	}
}
