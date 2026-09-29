import { describe, it, expect } from 'vitest'
import { Payments } from '../../src/resources/payments'
import { ValidationError } from '../../src/core/errors'

describe('Payments Resource', () => {
	const config = {
		merchantId: '10000100',
		merchantKey: '46f0cd694581a',
		passphrase: 'jt7NOE43FZPn',
		sandbox: true,
	}

	const payments = new Payments(config)

	const validPaymentData = {
		amount: '100.00',
		item_name: 'Test Product',
	}

	describe('generatePaymentUrl', () => {
		it('should generate URL with required parameters', () => {
			const url = payments.generatePaymentUrl(validPaymentData)

			expect(url).toContain('https://sandbox.payfast.co.za/eng/process')
			expect(url).toContain('merchant_id=10000100')
			expect(url).toContain('merchant_key=46f0cd694581a')
			expect(url).toContain('amount=100.00')
			expect(url).toContain('item_name=Test+Product')
			expect(url).toContain('signature=')
		})

		it('should include optional parameters when provided', () => {
			const url = payments.generatePaymentUrl({
				...validPaymentData,
				item_description: 'A test product',
				m_payment_id: 'order-123',
				name_first: 'John',
				name_last: 'Doe',
				email_address: 'john@example.com',
				return_url: 'https://example.com/success',
				cancel_url: 'https://example.com/cancel',
				notify_url: 'https://example.com/webhook',
			})

			expect(url).toContain('item_description=A+test+product')
			expect(url).toContain('m_payment_id=order-123')
			expect(url).toContain('name_first=John')
			expect(url).toContain('name_last=Doe')
			expect(url).toContain('email_address=john%40example.com')
			expect(url).toContain('return_url=')
			expect(url).toContain('cancel_url=')
			expect(url).toContain('notify_url=')
		})

		it('should use sandbox URL when sandbox is true', () => {
			const url = payments.generatePaymentUrl(validPaymentData)

			expect(url).toContain('sandbox.payfast.co.za')
		})

		it('should use production URL when sandbox is false', () => {
			const prodPayments = new Payments({ ...config, sandbox: false })
			const url = prodPayments.generatePaymentUrl(validPaymentData)

			expect(url).toContain('www.payfast.co.za')
			expect(url).not.toContain('sandbox')
		})

		it('should throw ValidationError for invalid data', () => {
			expect(() =>
				payments.generatePaymentUrl({
					amount: '',
					item_name: 'Test',
				})
			).toThrow(ValidationError)
		})

		it('should include custom fields', () => {
			const url = payments.generatePaymentUrl({
				...validPaymentData,
				custom_str1: 'custom-value-1',
				custom_int1: 123,
			})

			expect(url).toContain('custom_str1=custom-value-1')
			expect(url).toContain('custom_int1=123')
		})

		it('should handle special characters in item_name', () => {
			const url = payments.generatePaymentUrl({
				amount: '100.00',
				item_name: 'Test & Product <Special>',
			})

			expect(url).toContain('item_name=Test+%26+Product+%3CSpecial%3E')
		})
	})

	describe('generateFormHtml', () => {
		it('should generate valid HTML form', () => {
			const html = payments.generateFormHtml(validPaymentData)

			expect(html).toContain('<form')
			expect(html).toContain('action="https://sandbox.payfast.co.za/eng/process"')
			expect(html).toContain('method="POST"')
			expect(html).toContain('type="hidden"')
			expect(html).toContain('name="merchant_id"')
			expect(html).toContain('name="amount"')
			expect(html).toContain('name="signature"')
			expect(html).toContain('<button type="submit"')
			expect(html).toContain('</form>')
		})

		it('should use custom submit text', () => {
			const html = payments.generateFormHtml(validPaymentData, {
				submitText: 'Pay R100.00 Now',
			})

			expect(html).toContain('>Pay R100.00 Now</button>')
		})

		it('should add submit button class', () => {
			const html = payments.generateFormHtml(validPaymentData, {
				submitClass: 'btn btn-primary',
			})

			expect(html).toContain('class="btn btn-primary"')
		})

		it('should use custom form ID', () => {
			const html = payments.generateFormHtml(validPaymentData, {
				formId: 'my-payment-form',
			})

			expect(html).toContain('id="my-payment-form"')
		})

		it('should add auto-submit script when requested', () => {
			const html = payments.generateFormHtml(validPaymentData, {
				formId: 'auto-form',
				autoSubmit: true,
			})

			expect(html).toContain("<script>document.getElementById('auto-form').submit();</script>")
		})

		it('should escape HTML in values', () => {
			const html = payments.generateFormHtml({
				amount: '100.00',
				item_name: '<script>alert("xss")</script>',
			})

			expect(html).not.toContain('<script>alert')
			expect(html).toContain('&lt;script&gt;')
		})

		it('should throw ValidationError for invalid data', () => {
			expect(() =>
				payments.generateFormHtml({
					amount: '1.00', // Below minimum
					item_name: 'Test',
				})
			).toThrow(ValidationError)
		})
	})

	describe('generateFormFields', () => {
		it('should return object with all fields', () => {
			const fields = payments.generateFormFields(validPaymentData)

			expect(fields).toHaveProperty('merchant_id', '10000100')
			expect(fields).toHaveProperty('merchant_key', '46f0cd694581a')
			expect(fields).toHaveProperty('amount', '100.00')
			expect(fields).toHaveProperty('item_name', 'Test Product')
			expect(fields).toHaveProperty('signature')
		})

		it('should include signature', () => {
			const fields = payments.generateFormFields(validPaymentData)

			expect(fields.signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should include optional fields when provided', () => {
			const fields = payments.generateFormFields({
				...validPaymentData,
				m_payment_id: 'order-123',
				custom_str1: 'custom',
			})

			expect(fields).toHaveProperty('m_payment_id', 'order-123')
			expect(fields).toHaveProperty('custom_str1', 'custom')
		})

		it('should throw ValidationError for invalid data', () => {
			expect(() =>
				payments.generateFormFields({
					amount: 'invalid',
					item_name: 'Test',
				})
			).toThrow(ValidationError)
		})
	})

	describe('generateSubscriptionUrl', () => {
		const validSubscription = {
			amount: '99.00',
			item_name: 'Monthly Plan',
			subscription_type: 1 as const,
			frequency: 1 as const,
			cycles: 12,
			billing_date: '2026-05-01',
		}

		it('should generate URL with subscription parameters', () => {
			const url = payments.generateSubscriptionUrl(validSubscription)

			expect(url).toContain('subscription_type=1')
			expect(url).toContain('frequency=1')
			expect(url).toContain('cycles=12')
		})

		it('should include billing_date when provided', () => {
			const url = payments.generateSubscriptionUrl({
				...validSubscription,
				billing_date: '2025-05-01',
			})

			expect(url).toContain('billing_date=2025-05-01')
		})

		it('should include recurring_amount when provided', () => {
			const url = payments.generateSubscriptionUrl({
				...validSubscription,
				recurring_amount: '89.00',
			})

			expect(url).toContain('recurring_amount=89.00')
		})

		it('should throw for invalid subscription data', () => {
			expect(() =>
				payments.generateSubscriptionUrl({
					...validSubscription,
					frequency: 7 as any,
				})
			).toThrow(ValidationError)
		})
	})

	describe('generateTokenizationUrl', () => {
		it('should generate URL with subscription_type=2', () => {
			const url = payments.generateTokenizationUrl({
				amount: '100.00',
				item_name: 'Tokenization',
				subscription_type: 2,
			})

			expect(url).toContain('subscription_type=2')
		})

		it('should throw for wrong subscription_type', () => {
			expect(() =>
				payments.generateTokenizationUrl({
					amount: '100.00',
					item_name: 'Test',
					subscription_type: 1 as any,
				})
			).toThrow()
		})
	})

	describe('getProcessUrl', () => {
		it('should return sandbox URL when sandbox is true', () => {
			expect(payments.getProcessUrl()).toBe('https://sandbox.payfast.co.za/eng/process')
		})

		it('should return production URL when sandbox is false', () => {
			const prodPayments = new Payments({ ...config, sandbox: false })

			expect(prodPayments.getProcessUrl()).toBe('https://www.payfast.co.za/eng/process')
		})
	})
})
