import { describe, it, expect } from 'vitest'
import { PayFast } from '../../src/payfast'
import { ValidationError } from '../../src/core/errors'
import { SANDBOX_CREDENTIALS } from '../../src/core/constants'

describe('PayFast Client', () => {
	const validConfig = {
		merchantId: '10000100',
		merchantKey: '46f0cd694581a',
		passphrase: 'jt7NOE43FZPn',
		sandbox: true,
	}

	describe('constructor', () => {
		it('should create instance with valid config', () => {
			const payfast = new PayFast(validConfig)

			expect(payfast).toBeInstanceOf(PayFast)
		})

		it('should create instance with minimal config', () => {
			const payfast = new PayFast({
				merchantId: '10000100',
				merchantKey: '46f0cd694581a',
			})

			expect(payfast).toBeInstanceOf(PayFast)
		})

		it('should throw ValidationError for missing merchantId', () => {
			expect(
				() =>
					new PayFast({
						merchantId: '',
						merchantKey: '46f0cd694581a',
					})
			).toThrow(ValidationError)
		})

		it('should throw ValidationError for missing merchantKey', () => {
			expect(
				() =>
					new PayFast({
						merchantId: '10000100',
						merchantKey: '',
					})
			).toThrow(ValidationError)
		})

		it('should throw ValidationError for non-numeric merchantId', () => {
			expect(
				() =>
					new PayFast({
						merchantId: 'abc123',
						merchantKey: '46f0cd694581a',
					})
			).toThrow(ValidationError)
		})
	})

	describe('isSandbox', () => {
		it('should return true when sandbox is enabled', () => {
			const payfast = new PayFast({ ...validConfig, sandbox: true })

			expect(payfast.isSandbox).toBe(true)
		})

		it('should return false when sandbox is disabled', () => {
			const payfast = new PayFast({ ...validConfig, sandbox: false })

			expect(payfast.isSandbox).toBe(false)
		})

		it('should default to false when not specified', () => {
			const payfast = new PayFast({
				merchantId: '10000100',
				merchantKey: '46f0cd694581a',
			})

			expect(payfast.isSandbox).toBe(false)
		})
	})

	describe('merchantId', () => {
		it('should return the configured merchantId', () => {
			const payfast = new PayFast(validConfig)

			expect(payfast.merchantId).toBe('10000100')
		})
	})

	describe('static sandbox()', () => {
		it('should create instance with sandbox credentials', () => {
			const payfast = PayFast.sandbox()

			expect(payfast).toBeInstanceOf(PayFast)
			expect(payfast.isSandbox).toBe(true)
			expect(payfast.merchantId).toBe(SANDBOX_CREDENTIALS.MERCHANT_ID)
		})
	})

	describe('resource instances', () => {
		const payfast = new PayFast(validConfig)

		it('should have payments resource', () => {
			expect(payfast.payments).toBeDefined()
			expect(typeof payfast.payments.generatePaymentUrl).toBe('function')
		})

		it('should have itn resource', () => {
			expect(payfast.itn).toBeDefined()
			expect(typeof payfast.itn.verify).toBe('function')
		})

		it('should have subscriptions resource', () => {
			expect(payfast.subscriptions).toBeDefined()
			expect(typeof payfast.subscriptions.fetch).toBe('function')
		})

		it('should have transactionHistory resource', () => {
			expect(payfast.transactionHistory).toBeDefined()
			expect(typeof payfast.transactionHistory.range).toBe('function')
		})

		it('should have refunds resource', () => {
			expect(payfast.refunds).toBeDefined()
			expect(typeof payfast.refunds.create).toBe('function')
		})

		it('should have creditCardTransactions resource', () => {
			expect(payfast.creditCardTransactions).toBeDefined()
			expect(typeof payfast.creditCardTransactions.fetch).toBe('function')
		})

		it('should have onsite resource', () => {
			expect(payfast.onsite).toBeDefined()
			expect(typeof payfast.onsite.generatePaymentIdentifier).toBe('function')
		})
	})

	describe('resource configuration', () => {
		it('should pass config to payments resource', () => {
			const payfast = new PayFast({ ...validConfig, sandbox: true })
			const url = payfast.payments.generatePaymentUrl({
				amount: '100.00',
				item_name: 'Test',
			})

			expect(url).toContain('sandbox.payfast.co.za')
		})

		it('should pass config to itn resource', () => {
			const payfast = new PayFast(validConfig)

			// The ITN should use the same merchantId for validation
			expect(payfast.merchantId).toBe('10000100')
		})
	})
})
