import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignatureMismatchError } from '../../src/core/errors'
import { ITN } from '../../src/resources/itn'
import { generateSignature } from '../../src/utils/signature'

describe('ITN Resource', () => {
	const config = {
		merchantId: '10000100',
		merchantKey: '46f0cd694581a',
		passphrase: 'jt7NOE43FZPn',
		sandbox: true,
	}

	const itn = new ITN(config)

	const createValidPayload = (): Record<string, string> => {
		const data: Record<string, string> = {
			m_payment_id: 'order-123',
			pf_payment_id: '1234567',
			payment_status: 'COMPLETE',
			item_name: 'Test Product',
			amount_gross: '100.00',
			amount_fee: '-2.30',
			amount_net: '97.70',
			merchant_id: '10000100',
		}

		const signature = generateSignature(data, config.passphrase)

		return { ...data, signature }
	}

	describe('verifySignature', () => {
		it('should return true for valid signature', () => {
			const payload = createValidPayload()

			expect(itn.verifySignature(payload)).toBe(true)
		})

		it('should return false for invalid signature', () => {
			const payload = createValidPayload()
			payload.signature = 'invalidsignature'

			expect(itn.verifySignature(payload)).toBe(false)
		})

		it('should return false for tampered data', () => {
			const payload = createValidPayload()
			payload.amount = '200.00' // Tampered

			expect(itn.verifySignature(payload)).toBe(false)
		})

		it('should return false for missing signature', () => {
			const payload = createValidPayload()
			delete (payload as any).signature

			expect(itn.verifySignature(payload)).toBe(false)
		})
	})

	describe('verifySourceIP', () => {
		it('should return true for valid PayFast IPs', () => {
			expect(itn.verifySourceIP('197.97.145.144')).toBe(true)
			expect(itn.verifySourceIP('41.74.179.192')).toBe(true)
		})

		it('should return true for localhost in sandbox mode', () => {
			expect(itn.verifySourceIP('127.0.0.1')).toBe(true)
		})

		it('should return true for any IP in sandbox mode', () => {
			// In sandbox mode, IP validation is skipped
			expect(itn.verifySourceIP('192.168.1.1')).toBe(true)
		})

		it('should return false for invalid IPs in production mode', () => {
			const prodItn = new ITN({ ...config, sandbox: false })

			expect(prodItn.verifySourceIP('192.168.1.1')).toBe(false)
			expect(prodItn.verifySourceIP('8.8.8.8')).toBe(false)
		})

		it('should return true for valid IPs in production mode', () => {
			const prodItn = new ITN({ ...config, sandbox: false })

			expect(prodItn.verifySourceIP('197.97.145.144')).toBe(true)
		})
	})

	describe('verify', () => {
		beforeEach(() => {
			vi.restoreAllMocks()
		})

		it('should return valid result for correct payload', async () => {
			const payload = createValidPayload()

			const result = await itn.verify(payload, '127.0.0.1', {
				skipServerValidation: true,
			})

			expect(result.valid).toBe(true)
			expect(result.payload).toBeDefined()
			expect(result.error).toBeUndefined()
		})

		it('should return invalid result for bad signature', async () => {
			const payload = createValidPayload()
			payload.signature = 'badsignature'

			const result = await itn.verify(payload, '127.0.0.1', {
				skipServerValidation: true,
			})

			expect(result.valid).toBe(false)
			expect(result.error).toContain('signature')
		})

		it('should return invalid result for merchant ID mismatch', async () => {
			const payload = createValidPayload()
			// Recalculate signature with wrong merchant_id
			payload.merchant_id = '99999999'
			payload.signature = generateSignature(payload, config.passphrase)

			const result = await itn.verify(payload, '127.0.0.1', {
				skipServerValidation: true,
			})

			expect(result.valid).toBe(false)
			expect(result.error).toContain('Merchant ID mismatch')
		})

		it('should skip IP validation when option is set', async () => {
			const payload = createValidPayload()

			const result = await itn.verify(payload, '1.2.3.4', {
				skipIPValidation: true,
				skipServerValidation: true,
			})

			expect(result.valid).toBe(true)
		})

		it('should return invalid for bad IP in production with validation enabled', async () => {
			const prodItn = new ITN({ ...config, sandbox: false })
			const payload = createValidPayload()

			const result = await prodItn.verify(payload, '1.2.3.4', {
				skipIPValidation: false,
				skipServerValidation: true,
			})

			expect(result.valid).toBe(false)
			expect(result.error).toContain('IP')
		})

		it('should include payload in result even on failure', async () => {
			const payload = createValidPayload()
			payload.signature = 'bad'

			const result = await itn.verify(payload, '127.0.0.1', {
				skipServerValidation: true,
			})

			expect(result.valid).toBe(false)
			expect(result.payload).toBeDefined()
		})
	})

	describe('parse', () => {
		it('should return typed payload for valid signature', () => {
			const payload = createValidPayload()

			const parsed = itn.parse(payload)

			expect(parsed.m_payment_id).toBe('order-123')
			expect(parsed.payment_status).toBe('COMPLETE')
		})

		it('should throw SignatureMismatchError for invalid signature', () => {
			const payload = createValidPayload()
			payload.signature = 'invalid'

			expect(() => itn.parse(payload)).toThrow(SignatureMismatchError)
		})
	})

	describe('status helpers', () => {
		it('isComplete should return true for COMPLETE status', () => {
			const payload = { payment_status: 'COMPLETE' } as any

			expect(itn.isComplete(payload)).toBe(true)
			expect(itn.isFailed(payload)).toBe(false)
			expect(itn.isPending(payload)).toBe(false)
			expect(itn.isCancelled(payload)).toBe(false)
		})

		it('isFailed should return true for FAILED status', () => {
			const payload = { payment_status: 'FAILED' } as any

			expect(itn.isComplete(payload)).toBe(false)
			expect(itn.isFailed(payload)).toBe(true)
		})

		it('isPending should return true for PENDING status', () => {
			const payload = { payment_status: 'PENDING' } as any

			expect(itn.isPending(payload)).toBe(true)
		})

		it('isCancelled should return true for CANCELLED status', () => {
			const payload = { payment_status: 'CANCELLED' } as any

			expect(itn.isCancelled(payload)).toBe(true)
		})
	})

	describe('verifyWithServer', () => {
		beforeEach(() => {
			vi.restoreAllMocks()
		})

		it('should return true when server responds VALID', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				text: () => Promise.resolve('VALID'),
			})

			const payload = createValidPayload()
			const result = await itn.verifyWithServer(payload)

			expect(result).toBe(true)
		})

		it('should return false when server responds INVALID', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				text: () => Promise.resolve('INVALID'),
			})

			const payload = createValidPayload()
			const result = await itn.verifyWithServer(payload)

			expect(result).toBe(false)
		})

		it('should handle case-insensitive response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				text: () => Promise.resolve('valid'),
			})

			const payload = createValidPayload()
			const result = await itn.verifyWithServer(payload)

			expect(result).toBe(true)
		})

		it('should throw NetworkError on fetch failure', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

			const payload = createValidPayload()

			await expect(itn.verifyWithServer(payload)).rejects.toThrow('Failed to verify ITN')
		})

		it('should use correct validation URL for sandbox', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				text: () => Promise.resolve('VALID'),
			})

			const payload = createValidPayload()
			await itn.verifyWithServer(payload)

			expect(fetch).toHaveBeenCalledWith('https://sandbox.payfast.co.za/eng/query/validate', expect.any(Object))
		})

		it('should use correct validation URL for production', async () => {
			const prodItn = new ITN({ ...config, sandbox: false })

			global.fetch = vi.fn().mockResolvedValue({
				text: () => Promise.resolve('VALID'),
			})

			const payload = createValidPayload()
			await prodItn.verifyWithServer(payload)

			expect(fetch).toHaveBeenCalledWith('https://www.payfast.co.za/eng/query/validate', expect.any(Object))
		})

		it('should exclude signature from validation request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				text: () => Promise.resolve('VALID'),
			})

			const payload = createValidPayload()
			await itn.verifyWithServer(payload)

			const [, options] = (fetch as any).mock.calls[0]
			expect(options.body).not.toContain('signature=')
		})
	})
})
