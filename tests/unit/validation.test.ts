import { describe, it, expect } from 'vitest'
import { validateConfig, validatePaymentData, validateSubscriptionData, isValidPayFastIP } from '../../src/utils/validation'
import { ValidationError } from '../../src/core/errors'

describe('Validation Utils', () => {
	describe('validateConfig', () => {
		it('should pass with valid config', () => {
			expect(() =>
				validateConfig({
					merchantId: '10000100',
					merchantKey: '46f0cd694581a',
				})
			).not.toThrow()
		})

		it('should pass with all optional fields', () => {
			expect(() =>
				validateConfig({
					merchantId: '10000100',
					merchantKey: '46f0cd694581a',
					passphrase: 'testpass',
					sandbox: true,
					timeout: 60000,
				})
			).not.toThrow()
		})

		it('should throw for empty merchantId', () => {
			expect(() =>
				validateConfig({
					merchantId: '',
					merchantKey: '46f0cd694581a',
				})
			).toThrow(ValidationError)
		})

		it('should throw for whitespace-only merchantId', () => {
			expect(() =>
				validateConfig({
					merchantId: '   ',
					merchantKey: '46f0cd694581a',
				})
			).toThrow(ValidationError)
		})

		it('should throw for empty merchantKey', () => {
			expect(() =>
				validateConfig({
					merchantId: '10000100',
					merchantKey: '',
				})
			).toThrow(ValidationError)
		})

		it('should throw for non-numeric merchantId', () => {
			expect(() =>
				validateConfig({
					merchantId: 'abc123',
					merchantKey: '46f0cd694581a',
				})
			).toThrow(ValidationError)
		})

		it('should throw for merchantId with letters', () => {
			expect(() =>
				validateConfig({
					merchantId: '1000010a',
					merchantKey: '46f0cd694581a',
				})
			).toThrow(ValidationError)
		})

		it('should include field name in error', () => {
			try {
				validateConfig({
					merchantId: '',
					merchantKey: '46f0cd694581a',
				})
			} catch (error) {
				expect(error).toBeInstanceOf(ValidationError)
				expect((error as ValidationError).field).toBe('merchantId')
			}
		})
	})

	describe('validatePaymentData', () => {
		const validPayment = {
			amount: '100.00',
			item_name: 'Test Product',
		}

		it('should pass with minimal valid data', () => {
			expect(() => validatePaymentData(validPayment)).not.toThrow()
		})

		it('should pass with all optional fields', () => {
			expect(() =>
				validatePaymentData({
					...validPayment,
					item_description: 'A test product',
					m_payment_id: 'order-123',
					name_first: 'John',
					name_last: 'Doe',
					email_address: 'john@example.com',
					cell_number: '0821234567',
					return_url: 'https://example.com/success',
					cancel_url: 'https://example.com/cancel',
					notify_url: 'https://example.com/webhook',
				})
			).not.toThrow()
		})

		it('should throw for empty amount', () => {
			expect(() =>
				validatePaymentData({
					amount: '',
					item_name: 'Test',
				})
			).toThrow(ValidationError)
		})

		it('should throw for invalid amount format - three decimals', () => {
			expect(() =>
				validatePaymentData({
					amount: '100.000',
					item_name: 'Test',
				})
			).toThrow(ValidationError)
		})

		it('should throw for invalid amount format - text', () => {
			expect(() =>
				validatePaymentData({
					amount: 'one hundred',
					item_name: 'Test',
				})
			).toThrow(ValidationError)
		})

		it('should throw for amount below R5.00 minimum', () => {
			expect(() =>
				validatePaymentData({
					amount: '4.99',
					item_name: 'Test',
				})
			).toThrow(ValidationError)
		})

		it('should pass for amount exactly R5.00', () => {
			expect(() =>
				validatePaymentData({
					amount: '5.00',
					item_name: 'Test',
				})
			).not.toThrow()
		})

		it('should pass for large amounts', () => {
			expect(() =>
				validatePaymentData({
					amount: '999999.99',
					item_name: 'Test',
				})
			).not.toThrow()
		})

		it('should throw for empty item_name', () => {
			expect(() =>
				validatePaymentData({
					amount: '100.00',
					item_name: '',
				})
			).toThrow(ValidationError)
		})

		it('should throw for item_name over 100 characters', () => {
			expect(() =>
				validatePaymentData({
					amount: '100.00',
					item_name: 'a'.repeat(101),
				})
			).toThrow(ValidationError)
		})

		it('should pass for item_name exactly 100 characters', () => {
			expect(() =>
				validatePaymentData({
					amount: '100.00',
					item_name: 'a'.repeat(100),
				})
			).not.toThrow()
		})

		it('should throw for invalid email format', () => {
			const invalidEmails = ['invalid', 'invalid@', '@example.com', 'invalid@.com', 'a@b']

			invalidEmails.forEach((email) => {
				expect(() =>
					validatePaymentData({
						...validPayment,
						email_address: email,
					})
				).toThrow(ValidationError)
			})
		})

		it('should pass for valid email formats', () => {
			const validEmails = ['test@example.com', 'user.name@domain.co.za', 'user+tag@example.org']

			validEmails.forEach((email) => {
				expect(() =>
					validatePaymentData({
						...validPayment,
						email_address: email,
					})
				).not.toThrow()
			})
		})

		it('should throw for invalid cell number', () => {
			const invalidNumbers = ['12345', '1234567890', '+1234567890', 'abcdefghij']

			invalidNumbers.forEach((number) => {
				expect(() =>
					validatePaymentData({
						...validPayment,
						cell_number: number,
					})
				).toThrow(ValidationError)
			})
		})

		it('should pass for valid SA cell number formats', () => {
			const validNumbers = [
				'0821234567', // Standard format
				'0721234567', // Vodacom
				'0611234567', // Cell C
				'+27821234567', // International with +
				'27821234567', // International without +
				'082 123 4567', // With spaces
				'082-123-4567', // With dashes
			]

			validNumbers.forEach((number) => {
				expect(() =>
					validatePaymentData({
						...validPayment,
						cell_number: number,
					})
				).not.toThrow()
			})
		})
	})

	describe('validateSubscriptionData', () => {
		const validSubscription = {
			amount: '100.00',
			item_name: 'Monthly Subscription',
			subscription_type: 1 as const,
			frequency: 1 as const,
			cycles: 12,
		}

		it('should pass with valid subscription data', () => {
			expect(() => validateSubscriptionData(validSubscription)).not.toThrow()
		})

		it('should pass with all optional fields', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					recurring_amount: '99.00',
				})
			).not.toThrow()
		})

		it('should throw for invalid subscription_type', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					subscription_type: 2 as any,
				})
			).toThrow(ValidationError)
		})

		it('should throw for frequency below 1', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					frequency: 0 as any,
				})
			).toThrow(ValidationError)
		})

		it('should throw for frequency above 6', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					frequency: 7 as any,
				})
			).toThrow(ValidationError)
		})

		it('should pass for all valid frequencies', () => {
			;[1, 2, 3, 4, 5, 6].forEach((freq) => {
				expect(() =>
					validateSubscriptionData({
						...validSubscription,
						frequency: freq as any,
					})
				).not.toThrow()
			})
		})

		it('should throw for negative cycles', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					cycles: -1,
				})
			).toThrow(ValidationError)
		})

		it('should pass for cycles = 0 (indefinite)', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					cycles: 0,
				})
			).not.toThrow()
		})

		it('should throw for invalid recurring_amount format', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					recurring_amount: 'invalid',
				})
			).toThrow(ValidationError)
		})

		it('should also validate base payment data', () => {
			expect(() =>
				validateSubscriptionData({
					...validSubscription,
					amount: '1.00', // Below minimum
				})
			).toThrow(ValidationError)
		})
	})

	describe('isValidPayFastIP', () => {
		it('should return true for known PayFast production IPs', () => {
			const validIPs = ['197.97.145.144', '197.97.145.151', '41.74.179.192', '41.74.179.207']

			validIPs.forEach((ip) => {
				expect(isValidPayFastIP(ip)).toBe(true)
			})
		})

		it('should return true for localhost (testing)', () => {
			expect(isValidPayFastIP('127.0.0.1')).toBe(true)
			expect(isValidPayFastIP('::1')).toBe(true)
		})

		it('should handle IPv6-mapped IPv4 addresses', () => {
			expect(isValidPayFastIP('::ffff:127.0.0.1')).toBe(true)
		})

		it('should return false for unknown IPs', () => {
			const invalidIPs = ['192.168.1.1', '8.8.8.8', '10.0.0.1', '172.16.0.1']

			invalidIPs.forEach((ip) => {
				expect(isValidPayFastIP(ip)).toBe(false)
			})
		})

		it('should return false for malformed IPs', () => {
			expect(isValidPayFastIP('not-an-ip')).toBe(false)
			expect(isValidPayFastIP('')).toBe(false)
		})
	})
})
