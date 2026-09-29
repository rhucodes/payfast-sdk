// Main client

// Constants
export {
	PAYFAST_IP_ADDRESSES,
	PAYFAST_URLS,
	PAYMENT_STATUS,
	SANDBOX_CREDENTIALS,
	SUBSCRIPTION_FREQUENCY,
} from './core/constants.js'
// Errors
export {
	APIError,
	AuthenticationError,
	ConfigurationError,
	ITNValidationError,
	NetworkError,
	PayFastError,
	SignatureMismatchError,
	ValidationError,
} from './core/errors.js'
export { PayFast, PayFast as default } from './payfast.js'
// Resource types
export type {
	DateOptions,
	DateRangeOptions,
	TransactionQueryOptions,
} from './resources/index.js'
// Types
export type {
	AdhocPaymentData,
	APIResponse,
	CreditCardTransaction,
	ITNPayload,
	ITNValidationResult,
	OnsitePaymentIdentifier,
	PayFastConfig,
	PaymentData,
	PaymentMethod,
	RefundRequest,
	RefundResponse,
	Subscription,
	SubscriptionData,
	SubscriptionFrequency,
	SubscriptionUpdateData,
	TokenizationData,
	Transaction,
} from './types/index.js'

// Utilities
export {
	generateAPIHeaders,
	generateSignature,
	verifySignature,
} from './utils/signature.js'
export { isValidPayFastIP } from './utils/validation.js'
