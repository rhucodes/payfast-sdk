# PayFast Node.js SDK

A comprehensive, type-safe Node.js SDK for integrating with [PayFast](https://www.payfast.co.za) - South Africa's leading payment gateway.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Disclaimer:** This is an unofficial, community-maintained SDK and is not affiliated with, endorsed by, or supported by PayFast (Pty) Ltd. For official support, visit [payfast.co.za](https://www.payfast.co.za).

## Features

- **Full TypeScript support** with comprehensive type definitions
- **Payment initiation** - Generate payment URLs and forms
- **ITN (Webhook) verification** - Validate incoming notifications
- **Subscription management** - Create, pause, cancel recurring payments
- **Transaction history** - Query past transactions
- **Refunds** - Process refunds via API
- **Onsite payments** - Keep customers on your site during checkout
- **Sandbox support** - Test before going live
- **Zero dependencies** - Uses native Node.js APIs

## Requirements

- Node.js 18.0.0 or higher
- PayFast merchant account

## Installation

```bash
npm install @rhucodes/payfast-sdk
```

## Quick Start

```typescript
import { PayFast } from '@rhucodes/payfast-sdk'

// Initialize the client
const payfast = new PayFast({
	merchantId: process.env.PAYFAST_MERCHANT_ID!,
	merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
	passphrase: process.env.PAYFAST_PASSPHRASE,
	sandbox: process.env.NODE_ENV !== 'production',
})

// Generate a payment URL
const paymentUrl = payfast.payments.generatePaymentUrl({
	amount: '100.00',
	item_name: 'Premium Subscription',
	return_url: 'https://yoursite.com/success',
	cancel_url: 'https://yoursite.com/cancel',
	notify_url: 'https://yoursite.com/webhook/payfast',
})

// Redirect user to paymentUrl
```

## Configuration

### Environment Variables

Create a `.env` file with your PayFast credentials:

```env
# Production credentials
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase

# For development/testing
NODE_ENV=development
```

### Configuration Options

| Option        | Type    | Required | Default | Description                                    |
| ------------- | ------- | -------- | ------- | ---------------------------------------------- |
| `merchantId`  | string  | Yes      | -       | Your PayFast Merchant ID                       |
| `merchantKey` | string  | Yes      | -       | Your PayFast Merchant Key                      |
| `passphrase`  | string  | No       | -       | Security passphrase (set in PayFast dashboard) |
| `sandbox`     | boolean | No       | `false` | Enable sandbox/test mode                       |
| `timeout`     | number  | No       | `30000` | Request timeout in milliseconds                |

### Sandbox Testing

For development, use the built-in sandbox helper:

```typescript
// Quick sandbox setup with test credentials
const payfast = PayFast.sandbox()
```

Or configure manually:

```typescript
const payfast = new PayFast({
	merchantId: '10000100',
	merchantKey: '46f0cd694581a',
	passphrase: 'jt7NOE43FZPn',
	sandbox: true,
})
```

## Usage Examples

### Payment Initiation

#### Generate Payment URL

```typescript
const url = payfast.payments.generatePaymentUrl({
	amount: '250.00',
	item_name: 'Order #12345',
	item_description: 'Premium widget pack',
	m_payment_id: 'order-12345', // Your reference
	email_address: 'customer@example.com',
	name_first: 'John',
	name_last: 'Doe',
	return_url: 'https://yoursite.com/payment/success',
	cancel_url: 'https://yoursite.com/payment/cancel',
	notify_url: 'https://yoursite.com/webhook/payfast',
})

// Redirect the user
res.redirect(url)
```

#### Generate HTML Form

```typescript
const formHtml = payfast.payments.generateFormHtml(
	{
		amount: '100.00',
		item_name: 'Test Product',
	},
	{
		submitText: 'Pay Now',
		submitClass: 'btn btn-primary',
		autoSubmit: false,
	},
)

// Render in your template
```

#### Subscription Payments

**Frequency values:**

- `3` — Monthly
- `4` — Quarterly
- `5` — Biannually
- `6` — Annual

```typescript
const subscriptionUrl = payfast.payments.generateSubscriptionUrl({
	amount: '99.00',
	item_name: 'Monthly Pro Plan',
	subscription_type: 1,
	frequency: 3,
	cycles: 12, // 12 months, or 0 for indefinite
	billing_date: '2026-03-01', // 1st of each month
	return_url: 'https://yoursite.com/subscribe/success',
	cancel_url: 'https://yoursite.com/subscribe/cancel',
	notify_url: 'https://yoursite.com/webhook/payfast',
})
```

### ITN (Webhook) Verification

```typescript
import express from 'express'

const app = express()
app.use(express.urlencoded({ extended: true }))

app.post('/webhook/payfast', async (req, res) => {
	try {
		// Verify the ITN notification
		const result = await payfast.itn.verify(req.body, req.ip)

		if (!result.valid) {
			console.error('ITN validation failed:', result.error)
			return res.status(400).send('Validation failed')
		}

		const { payload } = result

		// Check payment status
		if (payfast.itn.isComplete(payload)) {
			// Payment successful - fulfill the order
			await fulfillOrder(payload.m_payment_id, payload)
		} else if (payfast.itn.isFailed(payload)) {
			// Payment failed
			await handleFailedPayment(payload.m_payment_id)
		}

		// Always respond with 200 OK
		res.status(200).send('OK')
	} catch (error) {
		console.error('Webhook error:', error)
		res.status(500).send('Error')
	}
})
```

### Subscription Management

```typescript
// Fetch subscription details
const subscription = await payfast.subscriptions.fetch('subscription-token')
console.log(`Status: ${subscription.status_text}`)
console.log(
	`Cycles complete: ${subscription.cycles_complete}/${subscription.cycles}`,
)

// Pause a subscription
await payfast.subscriptions.pause('subscription-token', { cycles: 1 })

// Resume a subscription
await payfast.subscriptions.unpause('subscription-token')

// Cancel a subscription
await payfast.subscriptions.cancel('subscription-token')

// Update subscription
await payfast.subscriptions.update('subscription-token', {
	cycles: 24,
	amount: 12900, // Amount in cents
})

// Ad-hoc charge (for tokenized subscriptions)
const charge = await payfast.subscriptions.adhoc('subscription-token', {
	amount: 5000, // R50.00 in cents
	item_name: 'One-time add-on',
})
```

### Transaction History

```typescript
// Get transactions by date range
const transactions = await payfast.transactionHistory.range({
	from: '2024-01-01',
	to: '2024-01-31',
	offset: 0,
	limit: 100,
})

// Get daily transactions
const daily = await payfast.transactionHistory.daily({
	date: '2024-01-15',
})

// Get weekly transactions
const weekly = await payfast.transactionHistory.weekly({
	date: '2024-01-15',
})

// Get monthly transactions
const monthly = await payfast.transactionHistory.monthly({
	date: '2024-01', // YYYY-MM format
})
```

### Refunds

```typescript
// Create a refund
const refund = await payfast.refunds.create('pf_payment_id', {
	amount: 5000, // Amount in cents (R50.00)
	reason: 'requested_by_customer',
	notify_buyer: 1,
})

// Fetch refund details
const refundDetails = await payfast.refunds.fetch('pf_payment_id')
```

### Credit Card Transactions

```typescript
const transaction = await payfast.creditCardTransactions.fetch('pf_payment_id')
console.log(
	`Card: ${transaction.card_type} ending in ${transaction.card_last_four}`,
)
```

### Onsite Payments

Keep customers on your site during checkout:

```typescript
// Note: Onsite payments are NOT available in sandbox mode

// Generate payment identifier
const { uuid } = await payfast.onsite.generatePaymentIdentifier({
	amount: '100.00',
	item_name: 'Test Product',
	return_url: 'https://yoursite.com/success',
	cancel_url: 'https://yoursite.com/cancel',
	notify_url: 'https://yoursite.com/webhook',
})

// Get the engine script URL
const engineUrl = payfast.onsite.getEngineUrl()

// Generate the payment HTML
const html = payfast.onsite.generatePaymentHtml(uuid)
```

In your frontend:

```html
<script src="https://www.payfast.co.za/onsite/engine.js"></script>
<script>
	window.payfast_do_onsite_payment({ uuid: 'your-uuid-here' })
</script>
```

## Error Handling

The SDK provides specific error classes for different scenarios:

```typescript
import {
	PayFastError,
	ConfigurationError,
	AuthenticationError,
	ValidationError,
	APIError,
	NetworkError,
	ITNValidationError,
	SignatureMismatchError,
} from '@rhucodes/payfast-sdk'

try {
	await payfast.subscriptions.fetch('invalid-token')
} catch (error) {
	if (error instanceof AuthenticationError) {
		console.error('Check your merchant credentials')
	} else if (error instanceof ValidationError) {
		console.error(`Validation failed: ${error.message} (field: ${error.field})`)
	} else if (error instanceof APIError) {
		console.error(`API error: ${error.message} (code: ${error.code})`)
	} else if (error instanceof NetworkError) {
		console.error('Network issue - retry later')
	}
}
```

## Constants & Utilities

### Payment Status Constants

```typescript
import { PAYMENT_STATUS } from '@rhucodes/payfast-sdk'

if (payload.payment_status === PAYMENT_STATUS.COMPLETE) {
	// Handle completed payment
}
```

### Subscription Frequencies

```typescript
import { SUBSCRIPTION_FREQUENCY } from '@rhucodes/payfast-sdk'

const subscription = {
	frequency: SUBSCRIPTION_FREQUENCY.MONTHLY, // 1
	// Other options: QUARTERLY (2), BIANNUALLY (3), ANNUALLY (4), WEEKLY (5), DAILY (6)
}
```

### Valid PayFast IPs

```typescript
import { PAYFAST_IP_ADDRESSES, isValidPayFastIP } from '@rhucodes/payfast-sdk'

// Check if an IP is from PayFast
const isValid = isValidPayFastIP(req.ip)

// Get list of valid IPs for firewall configuration
console.log(PAYFAST_IP_ADDRESSES)
```

### Signature Utilities

```typescript
import { generateSignature, verifySignature } from '@rhucodes/payfast-sdk'

// Generate a signature manually
const signature = generateSignature(paymentData, passphrase)

// Verify a signature
const isValid = verifySignature(payload, passphrase)
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import type {
	PayFastConfig,
	PaymentData,
	SubscriptionData,
	ITNPayload,
	Subscription,
	Transaction,
	RefundRequest,
} from '@rhucodes/payfast-sdk'

// Full IntelliSense and type checking
const paymentData: PaymentData = {
	amount: '100.00',
	item_name: 'Test',
	// ... IDE will show all available fields
}
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Resources

- [PayFast Developer Documentation](https://developers.payfast.co.za/docs)
- [PayFast API Reference](https://developers.payfast.co.za/api)
- [PayFast Sandbox](https://sandbox.payfast.co.za/)

## Support

- For SDK issues, open a [GitHub issue](https://github.com/rhucodes/payfast-sdk/issues)
- For PayFast account issues, contact [PayFast Support](https://www.payfast.co.za/contact/)
