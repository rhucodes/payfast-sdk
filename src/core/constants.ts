export const PAYFAST_URLS = {
	PAYMENT_LIVE: 'https://www.payfast.co.za/eng/process',
	PAYMENT_SANDBOX: 'https://sandbox.payfast.co.za/eng/process',
	API_LIVE: 'https://api.payfast.co.za',
	API_SANDBOX: 'https://sandbox.payfast.co.za',
	ONSITE_ENGINE_LIVE: 'https://www.payfast.co.za/onsite/engine.js',
	ONSITE_ENGINE_SANDBOX: 'https://sandbox.payfast.co.za/onsite/engine.js',
	VALIDATE_LIVE: 'https://www.payfast.co.za/eng/query/validate',
	VALIDATE_SANDBOX: 'https://sandbox.payfast.co.za/eng/query/validate',
} as const

export const SANDBOX_CREDENTIALS = {
	MERCHANT_ID: '10000100',
	MERCHANT_KEY: '46f0cd694581a',
	PASSPHRASE: 'jt7NOE43FZPn',
} as const

export const PAYFAST_IP_ADDRESSES = [
	'197.97.145.144',
	'197.97.145.145',
	'197.97.145.146',
	'197.97.145.147',
	'197.97.145.148',
	'197.97.145.149',
	'197.97.145.150',
	'197.97.145.151',
	'41.74.179.192',
	'41.74.179.193',
	'41.74.179.194',
	'41.74.179.195',
	'41.74.179.196',
	'41.74.179.197',
	'41.74.179.198',
	'41.74.179.199',
	'41.74.179.200',
	'41.74.179.201',
	'41.74.179.202',
	'41.74.179.203',
	'41.74.179.204',
	'41.74.179.205',
	'41.74.179.206',
	'41.74.179.207',
	'127.0.0.1',
	'::1',
] as const

export const DEFAULT_CONFIG = {
	TIMEOUT: 30000,
	SANDBOX: false,
} as const

export const PAYMENT_STATUS = {
	COMPLETE: 'COMPLETE',
	FAILED: 'FAILED',
	PENDING: 'PENDING',
	CANCELLED: 'CANCELLED',
} as const

export const SUBSCRIPTION_FREQUENCY = {
	MONTHLY: 3,
	QUARTERLY: 4,
	BIANNUALLY: 5,
	ANNUALLY: 6,
	WEEKLY: 2,
	DAILY: 1,
} as const
