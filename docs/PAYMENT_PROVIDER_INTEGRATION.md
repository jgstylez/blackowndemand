# Payment Provider Integration Guide

## Overview

The BlackOWNDemand platform supports multiple payment providers through a unified payment system. Currently, we support:

- **Stripe**: Modern payment platform with checkout sessions
- **Ecom Payments**: Direct payment processing with modal interface

## Architecture

### Core Components

1. **Payment Configuration** (`src/config/paymentConfig.ts`)

   - Plan definitions with provider-specific IDs
   - Provider configuration settings
   - Helper functions for plan validation

2. **Payment Service** (`src/services/paymentService.ts`)

   - Unified payment processing
   - Provider routing logic
   - Error handling and validation

3. **Unified Payment Hook** (`src/hooks/useUnifiedPayment.ts`)

   - React hook for payment processing
   - Provider-specific flow handling
   - Error management and retry logic

4. **Error Handler** (`src/utils/paymentErrorHandler.ts`)
   - Provider-specific error normalization
   - User-friendly error messages
   - Retry logic for transient errors

### Provider-Specific Components

#### Stripe

- **Edge Function**: `supabase/functions/create-checkout-session/index.ts`
- **Flow**: Redirect to Stripe Checkout → Return to success URL
- **Features**: Native discount codes, customer portal, subscription management

#### Ecom Payments

- **Edge Function**: `supabase/functions/process-payment/index.ts`
- **Component**: `src/components/payment/PaymentModal.tsx`
- **Flow**: Modal popup → Direct API call → Immediate response
- **Features**: Direct payment processing, vault customer management

## Configuration

### Plan Configuration

Each plan must be configured for both providers:

```typescript
{
  id: "starter",
  name: "Starter Plan",
  price: 12,
  stripePriceId: "price_starter_plan", // Stripe Price ID
  ecomPaymentsPlanId: "starter_plan_annual", // Ecom Payments Plan ID
  features: [...],
  description: "..."
}
```

### Environment Variables

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Ecom Payments Configuration
VITE_ECOM_SECURITY_KEY=your_security_key
ECOM_LIVE_SECURITY_KEY=live_security_key
ECOM_TEST_SECURITY_KEY=test_security_key
```

## Usage

### Basic Payment Processing

```typescript
import { useUnifiedPayment } from "../hooks/useUnifiedPayment";

const { handlePayment, loading, error } = useUnifiedPayment({
  onSuccess: (result) => {
    // Handle successful payment
  },
  onError: (error) => {
    // Handle payment error
  },
  redirectTo: "/success",
  showPaymentModal: true, // Enable PaymentModal for Ecom Payments
});

// Process payment
await handlePayment({
  planName: "Starter Plan",
  planPrice: 12,
  customerEmail: "user@example.com",
  provider: "stripe", // Optional: override current provider
});
```

### Ecom Payments Modal Flow

```typescript
import PaymentModal from "../components/payment/PaymentModal";

// Show PaymentModal for Ecom Payments
<PaymentModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={handleSuccess}
  amount={planPrice}
  description={`${planName} - Annual Subscription`}
  planName={planName}
  customerEmail={userEmail}
/>;
```

## Admin Management

### Provider Switching

Admins can switch payment providers through:

1. **Feature Flag**: `payment_provider_switching` (enabled by default)
2. **Admin Panel**: `/admin/payment-providers`
3. **Local Storage**: `payment_provider` preference

### Provider Configuration

```typescript
// Check current provider
const { provider, isStripe, isEcomPayments } = usePaymentProvider();

// Switch provider
const { switchProvider } = usePaymentProvider();
switchProvider("stripe"); // or "ecomPayments"
```

## Error Handling

### Error Types

- **Validation Errors**: Invalid payment information
- **Network Errors**: Connection issues
- **Provider Errors**: Gateway-specific errors
- **Authentication Errors**: API key issues

### Error Recovery

```typescript
const { retryPayment, isRetryable } = useUnifiedPayment();

if (isRetryable) {
  await retryPayment(paymentOptions, attemptNumber);
}
```

### User-Friendly Messages

The system automatically converts provider-specific errors to user-friendly messages:

```typescript
import { PaymentErrorHandler } from "../utils/paymentErrorHandler";

const userMessage = PaymentErrorHandler.getUserFriendlyMessage(error);
```

## Testing

### Test Cards

Both providers support test cards:

- **Success**: `4111111111111111`
- **Decline**: `4000000000000002`

### Simulation Mode

Ecom Payments automatically uses simulation mode when:

- No security key is configured
- Test cards are used
- Development environment is detected

## Security

### Data Protection

- Payment information is never stored in the database
- All sensitive data is encrypted in transit
- Provider-specific security measures are enforced

### PCI Compliance

- Stripe: Handles PCI compliance automatically
- Ecom Payments: Direct API calls with proper security measures

## Monitoring

### Error Logging

All payment errors are logged with:

- Provider information
- Error codes and messages
- User context (anonymized)
- Timestamp

### Analytics

Track payment success rates by provider:

- Success/failure ratios
- Error type distribution
- Provider performance metrics

## Troubleshooting

### Common Issues

1. **Plan Not Found**: Ensure plan is configured for both providers
2. **Provider Not Available**: Check feature flags and admin settings
3. **Payment Declined**: Verify test cards and provider configuration
4. **Network Errors**: Check API endpoints and security keys

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log("Payment provider:", provider);
console.log("Plan configuration:", planConfig);
```

## Future Enhancements

### Planned Features

1. **Additional Providers**: PayPal, Square, etc.
2. **Dynamic Pricing**: Provider-specific pricing
3. **Advanced Analytics**: Detailed payment insights
4. **Webhook Management**: Unified webhook handling

### Migration Guide

When adding new providers:

1. Extend `PlanConfig` interface
2. Add provider-specific edge functions
3. Update error handling
4. Add admin configuration
5. Update documentation

## Support

For payment-related issues:

1. Check provider documentation
2. Review error logs
3. Test with known good cards
4. Contact support with error details
