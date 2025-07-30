# Email Notifications

This document outlines the email notifications sent by the BlackOWNDemand platform.

## Email Events

### 1. Business Deactivation

- **Trigger**: When a business is deactivated by admin or system
- **Recipients**: Business owner
- **Content**: Deactivation notice, reason, reactivation instructions
- **Function**: `send-business-deactivation-email`

### 2. Subscription Cancellation

- **Trigger**: When a subscription is cancelled
- **Recipients**: Business owner
- **Content**: Cancellation confirmation, end date, refund information
- **Function**: `send-subscription-cancellation-email`

### 3. Subscription Change (Upgrade/Downgrade)

- **Trigger**: When subscription plan is changed
- **Recipients**: Business owner
- **Content**: Change confirmation, new plan details, effective date
- **Function**: `send-subscription-change-email`

### 4. Payment Method Update

- **Trigger**: When payment method is updated
- **Recipients**: Business owner
- **Content**: Update confirmation, security notice
- **Function**: `send-payment-method-update-email`

## Implementation

### Email Service Functions

All email functions are available in `src/lib/emailService.tsx`:

```typescript
import {
  sendBusinessDeactivationEmail,
  sendSubscriptionCancellationEmail,
  sendSubscriptionChangeEmail,
  sendPaymentMethodUpdateEmail,
} from "../lib/emailService";
```

### Edge Functions

Each email type has a corresponding edge function in `supabase/functions/`:

- `send-business-deactivation-email/`
- `send-subscription-cancellation-email/`
- `send-subscription-change-email/`
- `send-payment-method-update-email/`

### Usage Examples

#### Business Deactivation

```typescript
await sendBusinessDeactivationEmail(
  userEmail,
  businessName,
  "Payment overdue",
  "Please update your payment method to reactivate your business."
);
```

#### Subscription Cancellation

```typescript
await sendSubscriptionCancellationEmail(
  userEmail,
  businessName,
  "Enhanced Plan",
  "2024-01-15",
  "2024-02-15",
  25.0 // refund amount
);
```

#### Subscription Change

```typescript
await sendSubscriptionChangeEmail(
  userEmail,
  businessName,
  "Basic Plan",
  "Enhanced Plan",
  "upgrade",
  "2024-01-15",
  48.0 // price difference
);
```

#### Payment Method Update

```typescript
await sendPaymentMethodUpdateEmail(
  userEmail,
  businessName,
  "1234",
  "2024-01-15"
);
```

## Email Templates

All email templates include:

- Professional branding
- Clear, actionable information
- Security notices where appropriate
- Support contact information
- Responsive design

## Error Handling

- Email failures don't block main operations
- All email errors are logged for monitoring
- Retry mechanisms can be implemented if needed

## Testing

To test email functions:

1. Use the edge function directly with test data
2. Check logs for email delivery status
3. Verify email content and formatting
