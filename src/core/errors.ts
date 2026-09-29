export class PayFastError extends Error {
	public readonly code: number
	public readonly status: string

	constructor(message: string, code: number = 500, status: string = 'failed') {
		super(message)
		this.name = 'PayFastError'
		this.code = code
		this.status = status
		Error.captureStackTrace(this, this.constructor)
	}
}

export class ConfigurationError extends PayFastError {
	constructor(message: string) {
		super(message, 400, 'configuration_error')
		this.name = 'ConfigurationError'
	}
}

export class AuthenticationError extends PayFastError {
	constructor(message: string = 'Merchant authorization failed') {
		super(message, 401, 'authentication_error')
		this.name = 'AuthenticationError'
	}
}

export class ValidationError extends PayFastError {
	public readonly field?: string

	constructor(message: string, field?: string) {
		super(message, 422, 'validation_error')
		this.name = 'ValidationError'
		this.field = field
	}
}

export class APIError extends PayFastError {
	public readonly response?: unknown

	constructor(message: string, code: number, response?: unknown) {
		super(message, code, 'api_error')
		this.name = 'APIError'
		this.response = response
	}
}

export class NetworkError extends PayFastError {
	public readonly cause?: Error

	constructor(message: string, cause?: Error) {
		super(message, 0, 'network_error')
		this.name = 'NetworkError'
		this.cause = cause
	}
}

export class ITNValidationError extends PayFastError {
	public readonly reason: string
	public readonly payload?: Record<string, unknown>

	constructor(reason: string, payload?: Record<string, unknown>) {
		super(`ITN validation failed: ${reason}`, 400, 'itn_validation_error')
		this.name = 'ITNValidationError'
		this.reason = reason
		this.payload = payload
	}
}

export class SignatureMismatchError extends PayFastError {
	constructor(message: string = 'Signature verification failed') {
		super(message, 401, 'signature_mismatch')
		this.name = 'SignatureMismatchError'
	}
}
