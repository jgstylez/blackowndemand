# BlackOWNDemand Email System Documentation

## Overview

This document outlines the email system architecture for the BlackOWNDemand platform. The system uses Supabase Edge Functions to handle all email communications, ensuring consistent delivery and proper recipient management.

## Email Configuration

### Environment Variables

The following environment variables are used to configure email recipients:

```
VITE_PRIMARY_SUPPORT_EMAIL=support@blackdollarnetwork.com
VITE_SECONDARY_SUPPORT_EMAIL=jlgreen@blackdollarnetwork.com
```

These variables are used in the frontend to display email addresses and in Edge Functions to determine email recipients.

### Server-Side Environment Variables

The Edge Functions also use these environment variables:

```
PRIMARY_SUPPORT_EMAIL=support@blackdollarnetwork.com
SECONDARY_SUPPORT_EMAIL=jlgreen@blackdollarnetwork.com
```

These should be set in your Supabase project's Edge Function environment.

## Email Handling Architecture

### Centralized Configuration

All email addresses are managed through the `src/lib/emailConfig.ts` module, which provides:

- `PRIMARY_SUPPORT_EMAIL`: Main recipient for all communications
- `SECONDARY_SUPPORT_EMAIL`: Secondary recipient (BCC) for all communications
- Helper functions for formatting and retrieving email addresses

### Edge Functions

1. **send-contact-email**

   - Handles all contact form submissions
   - Automatically BCCs the secondary support email
   - Validates input data before sending
   - Returns standardized success/error responses

2. **subscribe**

   - Manages newsletter subscriptions
   - Stores subscriber information in the database
   - Handles duplicate subscriptions gracefully

3. **process-payment**
   - Handles payment processing for business listings
   - Integrates with payment gateway for secure transactions
   - Supports both live and test environments
   - Handles discount code application

## Email Flow

### Contact Form Submission

1. User fills out a contact form on the website
2. Form data is sent to the `send-contact-email` Edge Function
3. The function validates the data and formats the email
4. Email is sent to the primary support email with BCC to the secondary email
5. Success/error response is returned to the user

### Newsletter Subscription

1. User enters their email in a newsletter subscription form
2. Email is sent to the `subscribe` Edge Function
3. The function validates the email and checks for duplicates
4. Subscriber is added to the database
5. Success/error response is returned to the user

## Business Listing Process

### Payment-First Approach

The business listing process follows a payment-first approach, where users complete payment before entering business details. This approach has several benefits:

1. **Reduced Abandonment**: By collecting payment upfront, we ensure that only serious users proceed with the listing process
2. **Streamlined Experience**: Users who have already paid are more likely to complete the entire listing process
3. **Immediate Access**: Upon payment, users gain immediate access to all features of their chosen plan

### Business Listing Steps

The business listing process follows these steps in order:

1. **Payment**: User selects a plan and completes payment
2. **Business Information**: Basic details like name, description, category
3. **Location**: Address and geographic information
4. **Media & Contact**: Upload images and provide contact details
5. **Premium Features** (for Enhanced and VIP plans only): Add social media links and promotional videos
6. **Summary**: Review all information before final submission

## Category Filtering and URL Parameters

### How Category Filtering Works

- When a user clicks a category on the Categories page, the app links to `/browse?category=Category+Label` (e.g., `/browse?category=Arts%2C%20Crafts%20%26%20Party%20Supplies`).
- The Browse page reads the `category` parameter from the URL and attempts to match it to either the human-readable label (e.g., "Arts, Crafts & Party Supplies") or the enum value (e.g., `ARTS_CRAFTS_PARTY_SUPPLIES`).
- This means both formats are supported in the URL, and the Browse page will correctly filter businesses by category regardless of which is used.
- The code is robust to both, but for future-proofing, consider migrating to using slugs (e.g., `arts-crafts-party-supplies`) in URLs and decoding them in BrowsePage.

### Developer Note

- See `CategoriesPage.tsx` and `BrowsePage.tsx` for the relevant logic and comments.
- If you update category handling or want to use slugs, update both the link generation and the URL parsing logic accordingly.

## Deployment Instructions

### Edge Functions Deployment

1. Navigate to the Supabase Edge Functions directory:

   ```bash
   cd supabase/functions
   ```

2. Deploy the Edge Functions:

   ```bash
   supabase functions deploy send-contact-email --project-ref your-project-ref
   supabase functions deploy subscribe --project-ref your-project-ref
   supabase functions deploy process-payment --project-ref your-project-ref
   supabase functions deploy send-newsletter --project-ref your-project-ref
   supabase functions deploy generate-newsletter-content --project-ref your-project-ref
   supabase functions deploy send-account-deletion-email --project-ref your-project-ref
   supabase functions deploy send-email --project-ref your-project-ref
   ```

3. Set environment variables for payment processing:
   ```bash
   supabase secrets set PRIMARY_SUPPORT_EMAIL=support@blackdollarnetwork.com --project-ref your-project-ref
   supabase secrets set SECONDARY_SUPPORT_EMAIL=jlgreen@blackdollarnetwork.com --project-ref your-project-ref
   supabase secrets set ECOM_LIVE_SECURITY_KEY=your-live-security-key --project-ref your-project-ref
   supabase secrets set ECOM_TEST_SECURITY_KEY=your-test-security-key --project-ref your-project-ref
   supabase secrets set NODE_ENV=production --project-ref your-project-ref
   ```

### Frontend Deployment

1. Set environment variables in your deployment platform (Netlify, Vercel, etc.):

   ```
   VITE_PRIMARY_SUPPORT_EMAIL=support@blackdollarnetwork.com
   VITE_SECONDARY_SUPPORT_EMAIL=jlgreen@blackdollarnetwork.com
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Deploy the frontend application as usual.

## Testing and Verification

### Testing Contact Form

1. Navigate to the Contact page
2. Fill out the form with test data
3. Submit the form
4. Verify that:
   - The primary email receives the message
   - The secondary email is BCC'd on the message
   - The form shows a success message

### Testing Newsletter Subscription

1. Navigate to any page with a newsletter subscription form
2. Enter a test email address
3. Submit the form
4. Verify that:
   - The email is added to the `newsletter_subscribers` table
   - The form shows a success message

### Testing Business Listing Process

1. Navigate to the Pricing page
2. Select a plan
3. Verify that:
   - The payment step appears first
   - After payment, the business information form appears
   - All required steps are presented in the correct order
   - The business is properly created in the database after completion

### Testing Payment Processing

1. Navigate to the Pricing page
2. Select a paid plan
3. Fill out payment information
4. Submit the payment form
5. Verify that:
   - Payment is processed successfully
   - Transaction ID is returned
   - User is redirected to business listing form

## Troubleshooting

### Common Issues

1. **Emails not being sent**

   - Check that SMTP is properly configured in your Supabase project
   - Verify that the Edge Functions have the correct environment variables
   - Check the Edge Function logs for any errors

2. **Edge Functions returning errors**

   - Verify that the function has been deployed correctly
   - Check that the function has the necessary permissions
   - Review the function logs for specific error messages

3. **Payment processing failures**

   - Ensure the `process-payment` Edge Function is deployed
   - Verify payment gateway credentials are set correctly
   - Check that `VITE_SUPABASE_URL` points to your deployed Supabase project
   - Review Edge Function logs for payment gateway responses

4. **Environment variables not working**

   - Ensure variables are set in both the frontend and Edge Functions
   - Restart the application after changing environment variables
   - Check for typos in variable names

5. **"Failed to fetch" errors**
   - Verify that Edge Functions are deployed to your Supabase project
   - Check that `VITE_SUPABASE_URL` is set to your deployed project URL
   - Ensure CORS headers are properly configured in Edge Functions

## Maintenance and Updates

To update email recipients:

1. Update the environment variables in your Supabase project
2. Update the environment variables in your frontend deployment
3. No code changes are required as all email addresses are pulled from environment variables

To update payment processing:

1. Update payment gateway credentials in Supabase secrets
2. Redeploy the `process-payment` Edge Function if code changes are made
3. Test payment processing in both development and production environments

## Security Considerations

- Email addresses are never hardcoded in the application code
- All user input is validated before processing
- CORS headers are properly configured on Edge Functions
- Authentication is required for sensitive operations
- Payment processing uses secure HTTPS connections
- Sensitive payment data is never logged or stored
- Payment gateway credentials are stored as encrypted secrets
