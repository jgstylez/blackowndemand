# BlackOWNDemand Database Schema Documentation

## Overview

This document outlines the complete database schema for the BlackOWNDemand platform, including all tables, fields, and their relationships.

## Database Tables

### 1. Businesses Table (`businesses`)

The core table containing all business listing information:

**Primary Fields:**

- `id` (uuid) - Primary key
- `name` (text) - Business name
- `tagline` (text) - Business tagline
- `description` (text) - Business description
- `category` (USER-DEFINED) - Business category enum
- `is_verified` (boolean) - Verification status
- `is_featured` (boolean) - Featured status
- `is_active` (boolean) - Active status (NOT NULL)

**Location Fields:**

- `city` (text) - City
- `state` (text) - State/Province
- `zip_code` (text) - Postal code
- `country` (text) - Country

**Contact Fields:**

- `website_url` (text) - Website URL
- `phone` (text) - Phone number
- `email` (text) - Email address
- `image_url` (text) - Business image URL

**Subscription & Payment Fields:**

- `subscription_id` (uuid) - Foreign key to subscriptions.id
- `subscription_status` (text) - Current subscription status
- `nmi_subscription_id` (text) - NMI subscription ID
- `nmi_customer_vault_id` (text) - NMI customer vault ID
- `next_billing_date` (timestamp with time zone) - Next billing date
- `last_payment_date` (timestamp with time zone) - Last payment date
- `payment_method_last_four` (text) - Last 4 digits of payment method

**Analytics Fields:**

- `views_count` (bigint) - Total page views
- `last_viewed_at` (timestamp with time zone) - Last view timestamp
- `total_actions` (bigint) - Total contact actions (clicks)
- `analytics_data` (jsonb) - Additional analytics data

**Content Fields:**

- `social_links` (jsonb) - Social media links
- `business_hours` (jsonb) - Operating hours
- `amenities` (ARRAY) - Business amenities
- `payment_methods` (ARRAY) - Accepted payment methods
- `categories` (ARRAY) - Additional categories
- `tags` (ARRAY) - Business tags
- `promo_video_url` (text) - Promotional video URL

**Management Fields:**

- `featured_position` (integer) - Featured listing position
- `is_claimed` (boolean) - Claimed status
- `claimed_at` (timestamp with time zone) - Claim timestamp
- `migration_source` (text) - Migration source
- `is_resource` (boolean) - Resource flag
- `owner_id` (uuid) - Business owner user ID

**Timestamps:**

- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Last update timestamp

### 2. Subscription Plans Table (`subscription_plans`)

Defines available subscription tiers:

**Core Fields:**

- `id` (uuid) - Primary key
- `name` (text) - Plan name ("Starter Plan", "Enhanced Plan", "VIP Plan")
- `price` (numeric) - Plan price
- `interval` (text) - Billing interval
- `features` (jsonb) - Plan features
- `image_limit` (integer) - Maximum images allowed
- `category_limit` (integer) - Maximum categories allowed

**Timestamps:**

- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Last update timestamp

### 3. Subscriptions Table (`subscriptions`)

Tracks active business subscriptions:

**Core Fields:**

- `id` (uuid) - Primary key
- `business_id` (uuid) - Foreign key to businesses.id
- `plan_id` (uuid) - Foreign key to subscription_plans.id
- `status` (text) - Subscription status
- `payment_status` (text) - Payment status
- `current_period_start` (timestamp with time zone) - Current period start
- `current_period_end` (timestamp with time zone) - Current period end
- `cancel_at_period_end` (boolean) - Cancel at period end flag
- `stripe_subscription_id` (text) - Stripe subscription ID
- `nmi_subscription_id` (text) - NMI subscription ID
- `nmi_customer_vault_id` (text) - NMI customer vault ID

**Timestamps:**

- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Last update timestamp

### 4. Profiles Table (`profiles`)

User profile information:

**Core Fields:**

- `id` (uuid) - Primary key (matches auth.users.id)
- `first_name` (text) - First name
- `last_name` (text) - Last name

**Timestamps:**

- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Last update timestamp

### 5. Analytics Tables

#### Business Views (`business_views`)

- `id` (uuid) - Primary key
- `business_id` (uuid) - Foreign key to businesses.id
- `viewer_ip` (text) - Viewer IP address
- `user_agent` (text) - User agent string
- `referrer` (text) - Referrer URL
- `created_at` (timestamp with time zone) - View timestamp

#### Business Actions (`business_actions`)

- `id` (uuid) - Primary key
- `business_id` (uuid) - Foreign key to businesses.id
- `action_type` (text) - Action type (click, contact, etc.)
- `created_at` (timestamp with time zone) - Action timestamp

### 6. Business Analytics View (`business_analytics`)

Aggregated analytics data:

- `business_id` (uuid) - Business ID
- `business_name` (text) - Business name
- `views_count` (bigint) - Total views
- `last_viewed_at` (timestamp with time zone) - Last view
- `total_actions` (bigint) - Total actions
- `total_views` (bigint) - Total views (duplicate)
- `total_actions_count` (bigint) - Total actions count
- `contact_clicks` (bigint) - Contact clicks
- `website_clicks` (bigint) - Website clicks
- `phone_clicks` (bigint) - Phone clicks

### 7. Paid Subscriptions Overview View (`paid_subscriptions_overview`)

Subscription management view:

- `subscription_id` (uuid) - Subscription ID
- `plan_name` (text) - Plan name
- `plan_price` (numeric) - Plan price
- `subscription_status` (text) - Subscription status
- `payment_status` (text) - Payment status
- `current_period_start` (timestamp with time zone) - Period start
- `current_period_end` (timestamp with time zone) - Period end
- `cancel_at_period_end` (boolean) - Cancel flag
- `business_id` (uuid) - Business ID
- `business_name` (text) - Business name
- `is_verified` (boolean) - Verification status
- `is_featured` (boolean) - Featured status
- `city` (text) - City
- `state` (text) - State
- `country` (text) - Country
- `owner_id` (uuid) - Owner ID
- `owner_email` (character varying) - Owner email
- `owner_first_name` (text) - Owner first name
- `owner_last_name` (text) - Owner last name
- `owner_full_name` (text) - Owner full name
- `subscription_created_at` (timestamp with time zone) - Subscription created
- `subscription_updated_at` (timestamp with time zone) - Subscription updated

### 8. Admin Management Tables

#### Ads (`ads`)

- `id` (uuid) - Primary key
- `name` (text) - Ad name
- `ad_type` (text) - Ad type
- `image_url` (text) - Ad image URL
- `link_url` (text) - Ad link URL
- `cta_text` (text) - Call-to-action text
- `description` (text) - Ad description
- `start_date` (timestamp with time zone) - Start date
- `end_date` (timestamp with time zone) - End date
- `is_active` (boolean) - Active status
- `placement_area` (text) - Placement area
- `priority` (integer) - Priority
- `impressions_count` (bigint) - Impressions count
- `clicks_count` (bigint) - Clicks count
- `business_id` (uuid) - Associated business
- `position` (integer) - Position
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

#### Announcements (`announcements`)

- `id` (uuid) - Primary key
- `title` (text) - Announcement title
- `message` (text) - Announcement message
- `link_url` (text) - Link URL
- `link_text` (text) - Link text
- `is_active` (boolean) - Active status
- `background_color` (text) - Background color
- `text_color` (text) - Text color
- `created_by` (uuid) - Created by user
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

#### Feature Flags (`feature_flags`)

- `id` (uuid) - Primary key
- `name` (text) - Feature name
- `description` (text) - Feature description
- `is_enabled` (boolean) - Enabled status
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

### 9. User Management Tables

#### User Bookmarks (`user_bookmarks`)

- `id` (uuid) - Primary key
- `user_id` (uuid) - User ID
- `business_id` (uuid) - Business ID
- `created_at` (timestamp with time zone) - Creation timestamp

#### User Roles (`user_roles`)

- `id` (uuid) - Primary key
- `user_id` (uuid) - User ID
- `role_id` (uuid) - Role ID
- `assigned_by` (uuid) - Assigned by user
- `assigned_at` (timestamp with time zone) - Assignment timestamp

#### User Settings (`user_settings`)

- `user_id` (uuid) - User ID
- `settings` (jsonb) - User settings
- `updated_at` (timestamp with time zone) - Update timestamp

#### Roles (`roles`)

- `id` (uuid) - Primary key
- `name` (text) - Role name
- `description` (text) - Role description
- `permissions` (jsonb) - Role permissions
- `created_at` (timestamp with time zone) - Creation timestamp

### 10. Newsletter System Tables

#### Newsletter Subscribers (`newsletter_subscribers`)

- `id` (uuid) - Primary key
- `email` (text) - Email address
- `first_name` (text) - First name
- `last_name` (text) - Last name
- `status` (text) - Subscription status
- `source` (text) - Subscription source
- `preferences` (jsonb) - User preferences
- `last_sent_at` (timestamp with time zone) - Last sent timestamp
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

#### Newsletter Issues (`newsletter_issues`)

- `id` (uuid) - Primary key
- `subject` (text) - Newsletter subject
- `preview_text` (text) - Preview text
- `status` (text) - Issue status
- `scheduled_for` (timestamp with time zone) - Scheduled date
- `sent_at` (timestamp with time zone) - Sent timestamp
- `html_content` (text) - HTML content
- `text_content` (text) - Text content
- `created_by` (uuid) - Created by user
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

#### Newsletter Content Items (`newsletter_content_items`)

- `id` (uuid) - Primary key
- `newsletter_id` (uuid) - Newsletter ID
- `type` (text) - Content type
- `position` (integer) - Position
- `title` (text) - Content title
- `content` (text) - Content text
- `image_url` (text) - Image URL
- `link_url` (text) - Link URL
- `business_id` (uuid) - Associated business
- `ad_id` (uuid) - Associated ad
- `is_ai_generated` (boolean) - AI generated flag
- `ai_prompt` (text) - AI prompt used
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

### 11. Payment & Discount Tables

#### Payment History (`payment_history`)

- `id` (uuid) - Primary key
- `business_id` (uuid) - Business ID
- `nmi_transaction_id` (text) - NMI transaction ID
- `amount` (numeric) - Payment amount
- `status` (text) - Payment status
- `type` (text) - Payment type
- `response_text` (text) - Response text
- `created_at` (timestamp with time zone) - Creation timestamp

#### Discount Codes (`discount_codes`)

- `id` (uuid) - Primary key
- `code` (text) - Discount code
- `description` (text) - Code description
- `discount_type` (text) - Discount type
- `discount_value` (numeric) - Discount value
- `max_uses` (integer) - Maximum uses
- `current_uses` (integer) - Current uses
- `valid_from` (timestamp with time zone) - Valid from date
- `valid_until` (timestamp with time zone) - Valid until date
- `is_active` (boolean) - Active status
- `applies_to_plan` (text) - Applies to plan
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

#### Promotions (`promotions`)

- `id` (uuid) - Primary key
- `name` (text) - Promotion name
- `description` (text) - Promotion description
- `original_plan_id` (uuid) - Original plan ID
- `promotional_price` (numeric) - Promotional price
- `start_date` (timestamp with time zone) - Start date
- `end_date` (timestamp with time zone) - End date
- `target_audience` (text) - Target audience
- `is_active` (boolean) - Active status
- `created_at` (timestamp with time zone) - Creation timestamp
- `updated_at` (timestamp with time zone) - Update timestamp

### 12. Support Tables

#### Business Amenities (`business_amenities`)

- `id` (uuid) - Primary key
- `name` (text) - Amenity name
- `created_at` (timestamp with time zone) - Creation timestamp

#### Business Payment Methods (`business_payment_methods`)

- `id` (uuid) - Primary key
- `name` (text) - Payment method name
- `created_at` (timestamp with time zone) - Creation timestamp

#### Business Images (`business_images`)

- `id` (uuid) - Primary key
- `business_id` (uuid) - Business ID
- `url` (text) - Image URL
- `created_at` (timestamp with time zone) - Creation timestamp

#### Verification Codes (`verification_codes`)

- `id` (uuid) - Primary key
- `business_id` (uuid) - Business ID
- `email` (text) - Email address
- `code` (text) - Verification code
- `created_at` (timestamp with time zone) - Creation timestamp
- `expires_at` (timestamp with time zone) - Expiration timestamp
- `used` (boolean) - Used status

#### VIP Member (`vip_member`)

- `business_id` (uuid) - Business ID
- `joined_at` (timestamp with time zone) - Join timestamp
- `benefits` (jsonb) - VIP benefits
- `created_at` (timestamp with time zone) - Creation timestamp

### 13. Migration & Logging Tables

#### Migration Sources (`migration_sources`)

- `id` (uuid) - Primary key
- `name` (text) - Source name
- `description` (text) - Source description
- `created_at` (timestamp with time zone) - Creation timestamp

#### Image Migration Log (`image_migration_log`)

- `id` (uuid) - Primary key
- `old_url` (text) - Old image URL
- `new_url` (text) - New image URL
- `business_id` (uuid) - Business ID
- `table_name` (text) - Table name
- `column_name` (text) - Column name
- `status` (text) - Migration status
- `error_message` (text) - Error message
- `migrated_at` (timestamp with time zone) - Migration timestamp
- `created_at` (timestamp with time zone) - Creation timestamp

### 14. Views

#### Business Category Enum Values (`business_category_enum_values`)

- `category_value` (name) - Category value
- `sort_order` (real) - Sort order

## Key Relationships

1. **Businesses → Subscriptions**: `businesses.subscription_id` → `subscriptions.id`
2. **Subscriptions → Subscription Plans**: `subscriptions.plan_id` → `subscription_plans.id`
3. **Businesses → Profiles**: `businesses.owner_id` → `profiles.id`
4. **Business Views → Businesses**: `business_views.business_id` → `businesses.id`
5. **Business Actions → Businesses**: `business_actions.business_id` → `businesses.id`
6. **User Bookmarks → Businesses**: `user_bookmarks.business_id` → `businesses.id`
7. **User Bookmarks → Profiles**: `user_bookmarks.user_id` → `profiles.id`

## Important Notes

- All timestamps use `timestamp with time zone` for consistency
- The `businesses.category` field is a USER-DEFINED enum type
- Array fields (`amenities`, `payment_methods`, `categories`, `tags`) store text arrays
- JSONB fields (`social_links`, `business_hours`, `analytics_data`) store structured JSON data
- The `paid_subscriptions_overview` view provides a comprehensive view of all active subscriptions with business and owner details
- The `business_analytics` view aggregates analytics data for dashboard display
