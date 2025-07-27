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
