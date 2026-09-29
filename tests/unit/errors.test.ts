import { describe, expect, it } from 'vitest'
import {
	APIError,
	AuthenticationError,
	ConfigurationError,
	ITNValidationError,
	NetworkError,
	PayFastError,
	SignatureMismatchError,
	ValidationError,
} from '../../src/core/errors'

describe('Error Classes', () => {
	describe('PayFastError', () => {
		it('should create error with message', () => {
			const error = new PayFastError('Test error')

			expect(error.message).toBe('Test error')
			expect(error.name).toBe('PayFastError')
			expect(error.code).toBe(500)
			expect(error.status).toBe('failed')
		})

		it('should create error with custom code and status', () => {
			const error = new PayFastError('Test error', 400, 'bad_request')

			expect(error.code).toBe(400)
			expect(error.status).toBe('bad_request')
		})

		it('should be instanceof Error', () => {
			const error = new PayFastError('Test')

			expect(error).toBeInstanceOf(Error)
			expect(error).toBeInstanceOf(PayFastError)
		})

		it('should have stack trace', () => {
			const error = new PayFastError('Test')

			expect(error.stack).toBeDefined()
		})
	})

	describe('ConfigurationError', () => {
		it('should have correct defaults', () => {
			const error = new ConfigurationError('Invalid config')

			expect(error.name).toBe('ConfigurationError')
			expect(error.code).toBe(400)
			expect(error.status).toBe('configuration_error')
		})
	})

	describe('AuthenticationError', () => {
		it('should have default message', () => {
			const error = new AuthenticationError()

			expect(error.message).toBe('Merchant authorization failed')
		})

		it('should accept custom message', () => {
			const error = new AuthenticationError('Custom auth error')

			expect(error.message).toBe('Custom auth error')
		})

		it('should have correct defaults', () => {
			const error = new AuthenticationError()

			expect(error.name).toBe('AuthenticationError')
			expect(error.code).toBe(401)
			expect(error.status).toBe('authentication_error')
		})
	})

	describe('ValidationError', () => {
		it('should store field name', () => {
			const error = new ValidationError('Invalid amount', 'amount')

			expect(error.field).toBe('amount')
		})

		it('should work without field name', () => {
			const error = new ValidationError('General validation error')

			expect(error.field).toBeUndefined()
		})

		it('should have correct defaults', () => {
			const error = new ValidationError('Test')

			expect(error.name).toBe('ValidationError')
			expect(error.code).toBe(422)
			expect(error.status).toBe('validation_error')
		})
	})

	describe('APIError', () => {
		it('should store response data', () => {
			const responseData = { detail: 'Not found' }
			const error = new APIError('Not found', 404, responseData)

			expect(error.response).toEqual(responseData)
		})

		it('should work without response', () => {
			const error = new APIError('Server error', 500)

			expect(error.response).toBeUndefined()
		})

		it('should have correct defaults', () => {
			const error = new APIError('Test', 400)

			expect(error.name).toBe('APIError')
			expect(error.status).toBe('api_error')
		})
	})

	describe('NetworkError', () => {
		it('should store cause error', () => {
			const cause = new Error('Connection refused')
			const error = new NetworkError('Network failed', cause)

			expect(error.cause).toBe(cause)
		})

		it('should work without cause', () => {
			const error = new NetworkError('Timeout')

			expect(error.cause).toBeUndefined()
		})

		it('should have correct defaults', () => {
			const error = new NetworkError('Test')

			expect(error.name).toBe('NetworkError')
			expect(error.code).toBe(0)
			expect(error.status).toBe('network_error')
		})
	})

	describe('ITNValidationError', () => {
		it('should format message with reason', () => {
			const error = new ITNValidationError('Invalid signature')

			expect(error.message).toBe('ITN validation failed: Invalid signature')
		})

		it('should store reason and payload', () => {
			const payload = { merchant_id: '123', amount: '100.00' }
			const error = new ITNValidationError('Merchant mismatch', payload)

			expect(error.reason).toBe('Merchant mismatch')
			expect(error.payload).toEqual(payload)
		})

		it('should have correct defaults', () => {
			const error = new ITNValidationError('Test')

			expect(error.name).toBe('ITNValidationError')
			expect(error.code).toBe(400)
			expect(error.status).toBe('itn_validation_error')
		})
	})

	describe('SignatureMismatchError', () => {
		it('should have default message', () => {
			const error = new SignatureMismatchError()

			expect(error.message).toBe('Signature verification failed')
		})

		it('should accept custom message', () => {
			const error = new SignatureMismatchError('ITN signature invalid')

			expect(error.message).toBe('ITN signature invalid')
		})

		it('should have correct defaults', () => {
			const error = new SignatureMismatchError()

			expect(error.name).toBe('SignatureMismatchError')
			expect(error.code).toBe(401)
			expect(error.status).toBe('signature_mismatch')
		})
	})

	describe('Error inheritance chain', () => {
		it('all errors should be catchable as PayFastError', () => {
			const errors = [
				new ConfigurationError('test'),
				new AuthenticationError('test'),
				new ValidationError('test'),
				new APIError('test', 400),
				new NetworkError('test'),
				new ITNValidationError('test'),
				new SignatureMismatchError('test'),
			]

			errors.forEach((error) => {
				expect(error).toBeInstanceOf(PayFastError)
				expect(error).toBeInstanceOf(Error)
			})
		})
	})
})
