# BlackOWNDemand Platform Documentation

## Overview

BlackOWNDemand is a comprehensive business directory platform empowering Black-owned businesses and professionals. The platform features advanced business management, payment processing, analytics, and administrative tools.

## Current Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payment Processing**: Stripe + Ecom Payments (dual provider support)
- **State Management**: React Context API + Custom Hooks
- **Routing**: React Router v6
- **UI Components**: Custom components with Lucide React icons
- **Forms**: React Hook Form with validation
- **Image Handling**: Supabase Storage with fallback support
- **Deployment**: Netlify with Vercel configuration

### Core Features

#### 1. Business Directory & Listings

- **Multi-tier Business Plans**: Starter ($12), Enhanced ($60), VIP ($99) annually
- **Advanced Business Profiles**: Images, videos, social media links, contact info
- **Category & Tag System**: Comprehensive categorization with premium multi-category support
- **Search & Filtering**: Location-based, category-based, and tag-based filtering
- **Business Verification**: Verified badge system for authenticated businesses
- **Featured Business Management**: Admin-controlled featured listings

#### 2. Payment & Subscription System

- **Dual Payment Providers**: Stripe and Ecom Payments integration
- **Subscription Management**: Automatic billing, plan upgrades/downgrades
- **Discount Codes**: Admin-managed promotional codes
- **Payment History**: Comprehensive transaction tracking
- **Customer Portal**: Self-service subscription management

#### 3. User Management & Authentication

- **Role-Based Access**: User, Business Owner, Admin, Editor roles
- **Business Claiming**: Process for claiming existing business listings
- **Account Management**: Profile settings, preferences, deletion
- **Password Management**: Forgot password, update password flows

#### 4. Admin Panel

- **Business Management**: CRUD operations, verification, status management
- **User Role Management**: Role assignment and permissions
- **Analytics Dashboard**: Platform-wide statistics and insights
- **Payment Provider Management**: Stripe/Ecom Payments configuration
- **Feature Flag Management**: Dynamic feature toggles
- **Announcement Management**: Site-wide announcements
- **Newsletter Management**: Email campaign creation and sending
- **Promotion Management**: Time-limited promotional campaigns
- **Ad Management**: Advertisement placement and tracking

#### 5. Analytics & Tracking

- **Business Analytics**: View counts, click tracking, engagement metrics
- **Platform Analytics**: User behavior, business performance
- **Real-time Data**: Live statistics and monitoring

## Database Schema

### Core Tables

#### `businesses`

```sql
- id (uuid, primary key)
- owner_id (uuid, references profiles.id)
- name (text, required)
- tagline (text)
- description (text, required)
- category (text, required)
- categories (text[], premium plans only)
- tags (text[])
- email (text, required)
- phone (text)
- website (text)
- city (text, required)
- state (text, required)
- country (text, required)
- postal_code (text, required)
- image_url (text)
- gallery_images (jsonb)
- promo_video_url (text)
- social_links (jsonb)
- is_active (boolean, default true)
- is_verified (boolean, default false)
- is_featured (boolean, default false)
- subscription_id (uuid, references subscriptions.id)
- subscription_status (text: 'pending', 'active', 'cancelled')
- nmi_subscription_id (text)
- nmi_customer_vault_id (text)
- next_billing_date (timestamp)
- last_payment_date (timestamp)
- payment_method_last_four (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `subscriptions`

```sql
- id (uuid, primary key)
- user_id (uuid, references profiles.id)
- plan_name (text)
- plan_price (numeric)
- status (text)
- provider (text: 'stripe', 'ecomPayments')
- provider_subscription_id (text)
- current_period_start (timestamp)
- current_period_end (timestamp)
- created_at (timestamp)
```

#### `business_views` & `business_actions`

```sql
- Analytics tracking tables for business performance
- View counts, click tracking, engagement metrics
```

### Analytics Views

- `business_analytics`: Aggregated business performance data
- `paid_subscriptions`: Active subscription information

## Business Listing Flow

### 1. Payment-First Approach

1. **Plan Selection**: User selects Starter, Enhanced, or VIP plan
2. **Payment Processing**: Payment completed via Stripe or Ecom Payments
3. **Business Creation**: Business record created with `is_active: true`
4. **Form Completion**: Multi-step form for business details

### 2. Multi-Step Form Process

1. **Business Information**: Name, description, category (required)
2. **Location**: Address details (required)
3. **Media**: Business images and gallery
4. **Premium Features**: Videos, social links (Enhanced/VIP only)
5. **Summary**: Review and final submission

### 3. Form Validation Requirements

- **Required Fields**: Name, description, category, email, city, state, country, postal code
- **Premium Features**: Multiple categories, unlimited tags, social media links
- **Media**: Optional business images, promotional videos

## Payment Processing

### Dual Provider Architecture

- **Stripe**: Primary provider for credit card processing
- **Ecom Payments**: Alternative provider with different fee structure
- **Unified Interface**: Single payment service with provider abstraction

### Payment Flow

1. **Plan Selection**: User chooses plan and payment method
2. **Session Creation**: Payment session created via Edge Function
3. **Processing**: Payment processed through selected provider
4. **Confirmation**: Email confirmation sent to customer
5. **Business Creation**: Business record created upon successful payment

### Edge Functions

- `create-checkout-session`: Stripe checkout session creation
- `process-payment`: Ecom Payments processing
- `create-customer-portal`: Customer portal session creation
- `cancel-subscription`: Subscription cancellation
- `update-payment-method`: Payment method updates

## Admin Features

### Business Management

- **CRUD Operations**: Create, read, update, delete businesses
- **Verification System**: Approve/reject business verification requests
- **Status Management**: Activate/deactivate businesses
- **Featured Management**: Control featured business placement
- **Bulk Operations**: Mass updates and management

### User Management

- **Role Assignment**: Assign admin, editor, business owner roles
- **Permission Management**: Granular access control
- **Account Monitoring**: User activity and status tracking

### Analytics & Reporting

- **Platform Statistics**: Total businesses, active users, revenue
- **Business Performance**: Individual business analytics
- **Payment Analytics**: Revenue tracking, subscription metrics
- **User Behavior**: Engagement and conversion tracking

### Content Management

- **Announcements**: Site-wide announcement system
- **Newsletter Management**: Email campaign creation and automation
- **Promotion Management**: Time-limited promotional campaigns
- **Feature Flags**: Dynamic feature toggles for A/B testing

## Email System

### Configuration

```env
VITE_PRIMARY_SUPPORT_EMAIL=support@blackdollarnetwork.com
VITE_SECONDARY_SUPPORT_EMAIL=jlgreen@blackdollarnetwork.com
```

### Email Functions

- `send-contact-email`: Contact form submissions
- `send-newsletter`: Newsletter distribution
- `send-verification-code`: Email verification
- `send-account-deletion-email`: Account deletion confirmation
- `generate-newsletter-content`: AI-powered newsletter content

## Security & Privacy

### Authentication

- **Supabase Auth**: Secure user authentication
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure session handling

### Data Protection

- **RLS Policies**: Row-level security for data access
- **Input Validation**: Comprehensive form validation
- **XSS Protection**: Sanitized user input
- **CORS Configuration**: Proper cross-origin settings

### Payment Security

- **PCI Compliance**: Secure payment processing
- **Tokenization**: Secure payment method storage
- **Encryption**: All sensitive data encrypted

## Deployment

### Environment Setup

```bash
# Required Environment Variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PRIMARY_SUPPORT_EMAIL=support@blackdollarnetwork.com
VITE_SECONDARY_SUPPORT_EMAIL=jlgreen@blackdollarnetwork.com
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_ECOM_SECURITY_KEY=your_ecom_key
```

### Deployment Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to Netlify
npm run deploy:dev    # Development deployment
npm run deploy:prod   # Production deployment
```

### Supabase Functions Deployment

```bash
# Deploy all functions
supabase functions deploy --project-ref your-project-ref

# Deploy specific functions
supabase functions deploy send-contact-email --project-ref your-project-ref
supabase functions deploy process-payment --project-ref your-project-ref
# ... (repeat for all functions)
```

## Testing

### Payment Testing

- **Test Cards**: Available in `TEST_CARDS.md`
- **Sandbox Mode**: Development environment testing
- **Error Handling**: Comprehensive error scenarios

### Business Listing Testing

1. Select plan and complete payment
2. Verify business creation with active status
3. Complete multi-step form
4. Verify all validation requirements
5. Test premium features (Enhanced/VIP plans)

### Admin Panel Testing

1. Verify role-based access control
2. Test business management operations
3. Verify analytics data accuracy
4. Test email system functionality

## Maintenance

### Database Migrations

- **Migration Files**: Located in `supabase/migrations/`
- **Schema Updates**: Tracked through migration system
- **Data Integrity**: Maintained through constraints and triggers

### Monitoring

- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Analytics and metrics tracking
- **Security Monitoring**: Authentication and access logging

### Updates

- **Feature Flags**: Dynamic feature deployment
- **A/B Testing**: Controlled feature rollouts
- **Backup Strategy**: Regular database backups

## Future Enhancements

### Planned Features

- **Advanced Analytics**: Geographic analytics, competitor comparison
- **Mobile App**: Native mobile application
- **API Integration**: Third-party integrations
- **AI Features**: Automated insights and recommendations
- **Internationalization**: Multi-language support

### Technical Improvements

- **Performance Optimization**: Caching and optimization
- **Scalability**: Horizontal scaling capabilities
- **Monitoring**: Enhanced observability
- **Security**: Advanced security features

## Support & Contact

For technical support or questions:

- **Email**: support@blackdollarnetwork.com
- **Documentation**: This document and related guides
- **Issues**: GitHub issue tracking system

---

_Last Updated: January 2025_
_Version: 2.0_
