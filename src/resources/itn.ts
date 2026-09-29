import { DEFAULT_CONFIG, PAYFAST_URLS, PAYMENT_STATUS } from '../core/constants.js'
import { ITNValidationError, NetworkError, SignatureMismatchError } from '../core/errors.js'
import type { ITNPayload, ITNValidationResult, PayFastConfig } from '../types/index.js'
import { verifySignature } from '../utils/signature.js'
import { isValidPayFastIP } from '../utils/validation.js'

export class ITN {
	private readonly merchantId: string
	private readonly passphrase?: string
	private readonly sandbox: boolean

	constructor(config: PayFastConfig) {
		this.merchantId = config.merchantId
		this.passphrase = config.passphrase
		this.sandbox = config.sandbox ?? DEFAULT_CONFIG.SANDBOX
	}

	private getValidateUrl(): string {
		return this.sandbox ? PAYFAST_URLS.VALIDATE_SANDBOX : PAYFAST_URLS.VALIDATE_LIVE
	}

	async verify(
		payload: Record<string, string>,
		ipAddress?: string,
		options: {
			skipIPValidation?: boolean
			skipServerValidation?: boolean
		} = {}
	): Promise<ITNValidationResult> {
		const { skipIPValidation = false, skipServerValidation = false } = options

		try {
			if (!this.verifySignature(payload)) {
				throw new SignatureMismatchError('ITN signature verification failed')
			}

			if (!skipIPValidation && ipAddress) {
				if (!this.verifySourceIP(ipAddress)) {
					throw new ITNValidationError('Invalid source IP address', payload)
				}
			}

			if (payload.merchant_id !== this.merchantId) {
				throw new ITNValidationError(`Merchant ID mismatch: expected ${this.merchantId}, got ${payload.merchant_id}`, payload)
			}

			if (!skipServerValidation) {
				const serverValid = await this.verifyWithServer(payload)
				if (!serverValid) {
					throw new ITNValidationError('Server validation failed', payload)
				}
			}

			return {
				valid: true,
				payload: payload as unknown as ITNPayload,
			}
		} catch (error) {
			if (error instanceof ITNValidationError || error instanceof SignatureMismatchError) {
				return {
					valid: false,
					error: error.message,
					payload: payload as unknown as ITNPayload,
				}
			}
			throw error
		}
	}

	verifySignature(payload: Record<string, string>): boolean {
		return verifySignature(payload, this.passphrase)
	}

	verifySourceIP(ipAddress: string): boolean {
		if (this.sandbox) {
			return true
		}
		return isValidPayFastIP(ipAddress)
	}

	async verifyWithServer(payload: Record<string, string>): Promise<boolean> {
		const params = new URLSearchParams()
		for (const [key, value] of Object.entries(payload)) {
			if (key !== 'signature') {
				params.append(key, value)
			}
		}

		try {
			const response = await fetch(this.getValidateUrl(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: params.toString(),
			})

			const text = await response.text()
			return text.trim().toUpperCase() === 'VALID'
		} catch (error) {
			throw new NetworkError('Failed to verify ITN with PayFast server', error instanceof Error ? error : undefined)
		}
	}

	parse(payload: Record<string, string>): ITNPayload {
		if (!this.verifySignature(payload)) {
			throw new SignatureMismatchError('Invalid ITN signature')
		}

		return payload as unknown as ITNPayload
	}

	isComplete(payload: ITNPayload): boolean {
		return payload.payment_status === PAYMENT_STATUS.COMPLETE
	}

	isFailed(payload: ITNPayload): boolean {
		return payload.payment_status === PAYMENT_STATUS.FAILED
	}

	isPending(payload: ITNPayload): boolean {
		return payload.payment_status === PAYMENT_STATUS.PENDING
	}

	isCancelled(payload: ITNPayload): boolean {
		return payload.payment_status === PAYMENT_STATUS.CANCELLED
	}
}
