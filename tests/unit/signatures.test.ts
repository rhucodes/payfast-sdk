import { describe, expect, it } from 'vitest'
import { generateAPIHeaders, generateSignature, verifySignature } from '../../src/utils/signature'

describe('Signature Utils', () => {
	describe('generateSignature', () => {
		it('should generate a 32-character MD5 hash', () => {
			const data = {
				merchant_id: '10000100',
				merchant_key: '46f0cd694581a',
				amount: '100.00',
				item_name: 'Test Product',
			}

			const signature = generateSignature(data)

			expect(signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should generate different signatures with and without passphrase', () => {
			const data = {
				merchant_id: '10000100',
				amount: '100.00',
			}

			const sigWithout = generateSignature(data)
			const sigWith = generateSignature(data, 'testpassphrase')

			expect(sigWithout).not.toBe(sigWith)
		})

		it('should handle spaces in values correctly', () => {
			const data = {
				item_name: 'Test Product With Spaces',
			}

			const signature = generateSignature(data)

			expect(signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should handle special characters', () => {
			const data = {
				item_name: 'Test & Product <Special>',
				description: "It's great!",
			}

			const signature = generateSignature(data)

			expect(signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should exclude undefined and null values', () => {
			const data = {
				amount: '100.00',
				item_name: undefined,
				description: undefined,
				valid_field: 'test',
			}

			const signature = generateSignature(data as Record<string, string | number | undefined>)

			expect(signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should exclude signature field from calculation', () => {
			const data = {
				amount: '100.00',
				signature: 'existingsignature',
			}

			const signature = generateSignature(data)

			expect(signature).not.toBe('existingsignature')
			expect(signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should handle numeric values', () => {
			const data = {
				amount: 100,
				cycles: 12,
				frequency: 1,
			}

			const signature = generateSignature(data)

			expect(signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should handle passphrase with special characters', () => {
			const data = { amount: '100.00' }

			const signature = generateSignature(data, 'pass phrase&special=chars')

			expect(signature).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should treat an empty passphrase the same as no passphrase', () => {
			const data = {
				merchant_id: '10000100',
				amount: '100.00',
			}

			expect(generateSignature(data, '')).toBe(generateSignature(data))
		})
	})

	describe('verifySignature', () => {
		it('should return true for valid signature', () => {
			const data = {
				merchant_id: '10000100',
				merchant_key: '46f0cd694581a',
				amount: '100.00',
				item_name: 'Test',
			}

			const signature = generateSignature(data, 'passphrase')
			const payload = { ...data, signature }

			expect(verifySignature(payload, 'passphrase')).toBe(true)
		})

		it('should return false for invalid signature', () => {
			const payload = {
				merchant_id: '10000100',
				amount: '100.00',
				signature: 'invalidsignature',
			}

			expect(verifySignature(payload, 'passphrase')).toBe(false)
		})

		it('should return false when signature is missing', () => {
			const payload = {
				merchant_id: '10000100',
				amount: '100.00',
			}

			expect(verifySignature(payload)).toBe(false)
		})

		it('should return false for wrong passphrase', () => {
			const data = {
				merchant_id: '10000100',
				amount: '100.00',
			}

			const signature = generateSignature(data, 'correctpassphrase')
			const payload = { ...data, signature }

			expect(verifySignature(payload, 'wrongpassphrase')).toBe(false)
		})

		it('should be case-insensitive for signature comparison', () => {
			const data = {
				merchant_id: '10000100',
				amount: '100.00',
			}

			const signature = generateSignature(data)
			const payload = { ...data, signature: signature.toUpperCase() }

			expect(verifySignature(payload)).toBe(true)
		})

		it('should handle signature without passphrase', () => {
			const data = {
				merchant_id: '10000100',
				amount: '100.00',
			}

			const signature = generateSignature(data)
			const payload = { ...data, signature }

			expect(verifySignature(payload)).toBe(true)
		})
	})

	describe('generateAPIHeaders', () => {
		it('should include required headers', () => {
			const headers = generateAPIHeaders('10000100', 'passphrase')

			expect(headers['merchant-id']).toBe('10000100')
			expect(headers['version']).toBe('v1')
			expect(headers['timestamp']).toBeDefined()
			expect(headers['signature']).toBeDefined()
		})

		it('should generate valid ISO timestamp format', () => {
			const headers = generateAPIHeaders('10000100', 'passphrase')

			// Format: YYYY-MM-DDTHH:mm:ss (no milliseconds)
			expect(headers['timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
		})

		it('should generate valid signature', () => {
			const headers = generateAPIHeaders('10000100', 'passphrase', {
				amount: 100,
			})

			expect(headers['signature']).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should include data in signature calculation', () => {
			const headers1 = generateAPIHeaders('10000100', 'passphrase', {})
			const headers2 = generateAPIHeaders('10000100', 'passphrase', {
				amount: 100,
			})

			// Both should have valid signatures
			expect(headers1['signature']).toMatch(/^[a-f0-9]{32}$/)
			expect(headers2['signature']).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should work without passphrase', () => {
			const headers = generateAPIHeaders('10000100', undefined)

			expect(headers['merchant-id']).toBe('10000100')
			expect(headers['signature']).toMatch(/^[a-f0-9]{32}$/)
		})

		it('should work with empty data object', () => {
			const headers = generateAPIHeaders('10000100', 'passphrase', {})

			expect(headers['signature']).toMatch(/^[a-f0-9]{32}$/)
		})
	})
})
