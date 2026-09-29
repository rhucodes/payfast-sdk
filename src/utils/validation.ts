import { PAYFAST_IP_ADDRESSES } from '../core/constants.js'
import { ValidationError } from '../core/errors.js'
import type { PayFastConfig, PaymentData, SubscriptionData } from '../types/index.js'

export function validateConfig(config: PayFastConfig): void {
	if (!config.merchantId || config.merchantId.trim() === '') {
		throw new ValidationError('merchantId is required', 'merchantId')
	}

	if (!config.merchantKey || config.merchantKey.trim() === '') {
		throw new ValidationError('merchantKey is required', 'merchantKey')
	}

	if (!/^\d+$/.test(config.merchantId)) {
		throw new ValidationError('merchantId must be numeric', 'merchantId')
	}
}

export function validatePaymentData(data: PaymentData): void {
	if (!data.amount || data.amount.trim() === '') {
		throw new ValidationError('amount is required', 'amount')
	}

	if (!/^\d+(\.\d{1,2})?$/.test(data.amount)) {
		throw new ValidationError('amount must be a valid decimal (e.g., "100.00")', 'amount')
	}

	const amountValue = parseFloat(data.amount)

	if (amountValue < 5) {
		throw new ValidationError('Minimum payment amount is R5.00', 'amount')
	}

	if (!data.item_name || data.item_name.trim() === '') {
		throw new ValidationError('item_name is required', 'item_name')
	}

	if (data.item_name.length > 100) {
		throw new ValidationError('item_name must be 100 characters or less', 'item_name')
	}

	if (data.email_address && !isValidEmail(data.email_address)) {
		throw new ValidationError('email_address must be a valid email', 'email_address')
	}

	if (data.cell_number && !isValidCellNumber(data.cell_number)) {
		throw new ValidationError('cell_number must be a valid South African phone number', 'cell_number')
	}
}

export function validateSubscriptionData(data: SubscriptionData): void {
	validatePaymentData(data)

	if (data.subscription_type !== 1) {
		throw new ValidationError('subscription_type must be 1 for subscriptions', 'subscription_type')
	}

	if (data.frequency < 1 || data.frequency > 6) {
		throw new ValidationError('frequency must be between 1 and 6', 'frequency')
	}

	if (data.cycles < 0) {
		throw new ValidationError('cycles must be 0 or greater (0 = indefinite)', 'cycles')
	}

	if (data.billing_date !== undefined) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(data.billing_date)) {
			throw new ValidationError('billing_date must be a valid date string in YYYY-MM-DD format', 'billing_date')
		}
	}

	if (data.recurring_amount) {
		if (!/^\d+(\.\d{1,2})?$/.test(data.recurring_amount)) {
			throw new ValidationError('recurring_amount must be a valid decimal', 'recurring_amount')
		}
	}

	if (data.subscription_notify_email && !data.email_address) {
		throw new ValidationError('email_address is required when subscription_notify_email is true', 'email_address')
	}
}

export function isValidPayFastIP(ipAddress: string): boolean {
	if (ipAddress === '::ffff:127.0.0.1') {
		return true
	}

	const cleanIP = ipAddress.replace(/^::ffff:/, '')
	return PAYFAST_IP_ADDRESSES.includes(cleanIP as (typeof PAYFAST_IP_ADDRESSES)[number])
}

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

function isValidCellNumber(cellNumber: string): boolean {
	const cleaned = cellNumber.replace(/[\s-]/g, '')
	const patterns = [/^0[6-8][0-9]{8}$/, /^\+27[6-8][0-9]{8}$/, /^27[6-8][0-9]{8}$/]
	return patterns.some((pattern) => pattern.test(cleaned))
}
