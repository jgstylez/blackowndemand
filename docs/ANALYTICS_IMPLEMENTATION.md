# Business Analytics Implementation Documentation

## Overview

This document tracks the implementation status of business owner analytics for the BlackOWNDemand platform. The analytics system provides business owners with insights into their listing performance, including views, clicks, and engagement metrics.

## Implementation Phases

### Phase 1: Database Infrastructure ✅ COMPLETE

**Status**: COMPLETED - January 2025

#### Database Tables Created:

- ✅ `business_views` - Tracks individual business page views
- ✅ `business_actions` - Tracks user interactions (clicks, contact actions)
- ✅ `business_analytics` - View that aggregates analytics data

#### Database Columns Added to `businesses` table:

- ✅ `views_count` (bigint) - Cached view count for performance
- ✅ `last_viewed_at` (timestamp) - Last time business was viewed
- ✅ `total_actions` (bigint) - Cached total actions count

#### Database Functions Created:

- ✅ `record_business_action(business_id uuid, action_type text)` - Records user actions

#### Database Schema:

```sql
-- business_views table
CREATE TABLE business_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  viewer_ip inet,
  user_agent text,
  viewed_at timestamp with time zone DEFAULT now(),
  source text DEFAULT 'direct'
);

-- business_actions table
CREATE TABLE business_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_data jsonb,
  user_id uuid REFERENCES profiles(id),
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- business_analytics view
CREATE VIEW business_analytics AS
SELECT
  b.id as business_id,
  b.name as business_name,
  b.views_count,
  b.last_viewed_at,
  b.total_actions,
  COUNT(DISTINCT bv.id) as total_views,
  COUNT(DISTINCT ba.id) as total_actions_count,
  COUNT(DISTINCT ba.id) FILTER (WHERE ba.action_type = 'contact_click') as contact_clicks,
  COUNT(DISTINCT ba.id) FILTER (WHERE ba.action_type = 'website_click') as website_clicks,
  COUNT(DISTINCT ba.id) FILTER (WHERE ba.action_type = 'phone_click') as phone_clicks
FROM businesses b
LEFT JOIN business_views bv ON b.id = bv.business_id
LEFT JOIN business_actions ba ON b.id = ba.business_id
GROUP BY b.id, b.name, b.views_count, b.last_viewed_at, b.total_actions;
```

### Phase 2: View/Click Tracking ❌ NOT STARTED

**Status**: PENDING

#### Components to Update:

- `src/pages/BusinessDetailPage.tsx` - Add view tracking on page load
- Contact buttons (phone, email, website) - Add click tracking
- Social media links - Add click tracking

#### Tracking Events to Implement:

- `page_view` - When someone visits business detail page
- `contact_click` - When someone clicks contact information
- `website_click` - When someone clicks website link
- `phone_click` - When someone clicks phone number
- `email_click` - When someone clicks email address
- `social_click` - When someone clicks social media links

### Phase 3: Business Owner Analytics Dashboard ❌ NOT STARTED

**Status**: PENDING

#### Components to Create:

- `src/components/dashboard/analytics/BusinessAnalytics.tsx` - Main analytics dashboard
- `src/components/dashboard/analytics/AnalyticsCharts.tsx` - Charts and graphs
- `src/components/dashboard/analytics/AnalyticsMetrics.tsx` - Key metrics display

#### Features to Implement:

- View count trends over time
- Click-through rates for contact actions
- Engagement metrics comparison
- Performance vs. other businesses in category
- Export analytics data

### Phase 4: Dashboard Integration ❌ NOT STARTED

**Status**: PENDING

#### Integration Points:

- Add analytics tab to existing business owner dashboard
- Integrate with `src/pages/DashboardPage.tsx`
- Add analytics section to business management

## Current Status Summary

| Phase   | Status      | Completion Date | Notes                              |
| ------- | ----------- | --------------- | ---------------------------------- |
| Phase 1 | ✅ COMPLETE | January 2025    | Database infrastructure ready      |
| Phase 2 | ❌ PENDING  | -               | View/click tracking implementation |
| Phase 3 | ❌ PENDING  | -               | Analytics dashboard creation       |
| Phase 4 | ❌ PENDING  | -               | Dashboard integration              |

## Next Steps

1. **Implement Phase 2**: Add tracking code to business detail pages
2. **Create Phase 3**: Build business owner analytics dashboard
3. **Complete Phase 4**: Integrate analytics into existing dashboard
4. **Testing**: Verify tracking accuracy and dashboard functionality

## Technical Notes

- Analytics data is cached in the `businesses` table for performance
- Real-time data is available through the `business_analytics` view
- Tracking respects user privacy (no PII stored)
- Analytics are business-owner specific (RLS policies applied)

## Future Enhancements

- Geographic analytics (where views come from)
- Referral source tracking
- A/B testing for business listings
- Competitor comparison analytics
- Automated insights and recommendations

## Documentation Updates Needed

### 1. **Business Listing Flow Documentation** (`docs/business-listing-id-flow.md`)

**Current Issue**: The documentation describes a flow where businesses are created with `is_active: false` after payment, but the current code creates businesses with `is_active: true`.

**Update Needed**:

```markdown
## 1. Business ID Creation and Storage (After Payment)

- **After a successful payment:**
  - A new business record is created in the `businesses` table with:
    - `owner_id` set to the current user's ID
    - `subscription_id` set to the new subscription
    - `is_active: true` (business is active after payment)
  - The new business's `id` is:
    - Stored in React state (`setBusinessIdToUpdate`)
    - Stored in `sessionStorage` as `"businessIdToUpdate"`
    - Passed in navigation state when redirecting to `/business/new`

## 3. Dashboard Integration

- **Incomplete businesses** are fetched in the dashboard using:

  - `useUserBusinesses` hook
  - Query: `businesses` table filtered by `owner_id` and missing essential details
  - Displayed in "My Businesses" section with "Complete Listing" buttons

- **Incomplete business criteria:**
  - Business has a subscription (payment completed)
  - Missing essential details: name, description, category, email, city, state
```

### 2. **Payment Provider Integration** (`docs/PAYMENT_PROVIDER_INTEGRATION.md`)

**Current Issue**: The documentation references `paymentErrorHandler.ts` but this file is deprecated and now uses `unifiedErrorHandler.ts`.

**Update Needed**:

```markdown
4. **Error Handler** (`src/utils/unifiedErrorHandler.ts`)
   - Provider-specific error normalization
   - User-friendly error messages
   - Retry logic for transient errors

**Note**: The old `paymentErrorHandler.ts` is deprecated and now re-exports from `unifiedErrorHandler.ts` for backward compatibility.
```

### 3. **Database Schema Documentation** (`docs/DOCUMENTATION.md`)

**Current Issue**: The documentation doesn't reflect the current subscription status values and form validation requirements.

**Update Needed**:

```markdown
**Subscription & Payment Fields:**

- `subscription_id` (uuid) - Foreign key to subscriptions.id
- `subscription_status` (text) - Current subscription status ('pending', 'active', 'cancelled')
- `nmi_subscription_id` (text) - NMI subscription ID
- `nmi_customer_vault_id` (text) - NMI customer vault ID
- `next_billing_date` (timestamp with time zone) - Next billing date
- `last_payment_date` (timestamp with time zone) - Last payment date
- `payment_method_last_four` (text) - Last 4 digits of payment method

**Form Validation Requirements:**

**Business Information Step:**

- Business Name (required)
- Description (required)
- Category (required) - Single for basic plans, multiple for premium plans

**Location Step:**

- Country (required)
- State/Province (required)
- City (required)
- Postal Code (required)

**Media Step:**

- Business Image (optional)

**Premium Features Step:**

- Promotional Video URL (optional)
- Social Media Links (optional)
```

### 4. **Missing Migration Documentation**

**Current Issue**: The subscription status constraint update is not documented.

**New Migration Needed**:

```sql
-- Create new migration file: supabase/migrations/20250725000000_fix_subscription_status_values.sql

-- First, update existing statuses to the new format
UPDATE businesses
SET subscription_status =
  CASE
    WHEN subscription_status IN ('Starter Plan', 'Enhanced Plan', 'VIP Plan') THEN 'active'
    WHEN subscription_status IS NULL THEN 'pending'
    ELSE subscription_status -- keeps 'pending', 'active', or 'cancelled' as is
  END;

-- Drop the existing constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS check_subscription_status;

-- Add the new constraint
ALTER TABLE businesses
  ADD CONSTRAINT check_subscription_status
  CHECK (subscription_status IN ('pending', 'active', 'cancelled'));
```

### 5. **Form Validation Documentation**

**Current Issue**: The documentation doesn't reflect the current step-by-step validation.

**New Section Needed**:

```markdown
<code_block_to_apply_changes_from>
```

These updates will bring the documentation in line with the current codebase implementation and provide accurate guidance for developers working with the system.
