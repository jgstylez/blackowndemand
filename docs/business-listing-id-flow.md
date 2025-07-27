# Business Listing ID Flow & Persistence

## Overview

This document explains how the business listing process handles the creation, storage, and persistence of the business ID throughout the multi-step form and dashboard experience. It also covers how users can resume incomplete listings and best practices for robust ID management.

---

## 1. Business ID Creation and Storage (After Payment)

- **After a successful payment:**
  - A new business record is created in the `businesses` table with:
    - `owner_id` set to the current user's ID
    - `subscription_id` set to the new subscription
    - `is_active: false` (until details are filled)
  - The new business's `id` is:
    - Stored in React state (`setBusinessIdToUpdate`)
    - Stored in `sessionStorage` as `"businessIdToUpdate"`
    - Passed in navigation state when redirecting to `/business/new`

---

## 2. Multi-Step Form Persistence

- The business ID is retrieved from:

  - `location.state.businessIdToUpdate` (if navigating from payment success)
  - `sessionStorage.getItem("businessIdToUpdate")` (if page is refreshed)
  - React state (if already loaded)

- **Fallback mechanism:** If no business ID exists when submitting the form, a new business record is created with all the form data.

---

## 3. Dashboard Integration

- **Incomplete businesses** are fetched in the dashboard using:

  - `useUserBusinesses` hook
  - Query: `businesses` table filtered by `owner_id` and `is_active: false`
  - Displayed in "My Businesses" section with "Complete Listing" buttons

- **Resuming a listing:**
  - User clicks "Complete Listing" on an incomplete business
  - Navigates to `/business/new` with the business ID in state
  - Form is pre-populated with existing data
  - User can continue from where they left off

---

## 4. Database Schema Requirements

### Businesses Table

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  email TEXT,
  phone TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  region TEXT,
  country TEXT,
  postal_code TEXT,
  image_url TEXT,
  promo_video_url TEXT,
  social_links JSONB,
  is_active BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. Key Functions and Hooks

### useBusinessListingForm Hook

- Manages all form state and business logic
- Handles business ID persistence
- Provides validation and submission logic
- Manages step navigation and form data

### Business ID Management Functions

```typescript
// Create business ID after payment
const createBusinessAfterPayment = async (
  userId: string,
  subscriptionId: string
) => {
  const { data, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: userId,
      subscription_id: subscriptionId,
      is_active: false,
      is_verified: false,
    })
    .select()
    .single();

  if (data) {
    setBusinessIdToUpdate(data.id);
    sessionStorage.setItem("businessIdToUpdate", data.id);
  }
};

// Submit business data (with fallback)
const submitBusinessData = async () => {
  let businessId = businessIdToUpdate;

  // Fallback: Create new business if ID doesn't exist
  if (!businessId) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("User not authenticated");

    const { data: newBusiness } = await supabase
      .from("businesses")
      .insert({
        owner_id: userData.user.id,
        is_active: true,
        is_verified: true,
        // ... all form data
      })
      .select()
      .single();

    businessId = newBusiness?.id;
  }

  // Update existing business
  if (businessId) {
    await supabase
      .from("businesses")
      .update({
        is_active: true,
        is_verified: true,
        // ... all form data
      })
      .eq("id", businessId);
  }
};
```

---

## 6. Error Handling and Edge Cases

### Common Issues

1. **Missing Business ID:** User refreshes page after payment but before form completion
   - **Solution:** Fallback to create new business record
2. **Session Loss:** User loses session storage or navigation state
   - **Solution:** Query database for incomplete businesses by user ID
3. **Duplicate Submissions:** User submits form multiple times
   - **Solution:** Check if business already exists and is active

### Best Practices

- Always validate user authentication before creating/updating businesses
- Use transactions for critical operations
- Implement proper error handling and user feedback
- Log business creation and update events for debugging
- Consider implementing a "draft" system for incomplete listings

---

## 7. Testing Scenarios

### Test Cases to Cover

1. **Happy Path:** Complete payment → fill form → submit successfully
2. **Page Refresh:** Complete payment → refresh page → continue form
3. **Session Loss:** Complete payment → clear session → resume from dashboard
4. **Multiple Attempts:** Start form → abandon → restart → complete
5. **Network Issues:** Submit form with poor connection → retry
6. **Validation Errors:** Submit invalid data → fix → resubmit

### Manual Testing Checklist

- [ ] Payment completion creates business ID
- [ ] Business ID persists through page refresh
- [ ] Form can be resumed from dashboard
- [ ] Fallback creation works when ID is missing
- [ ] All form data is properly saved
- [ ] Business appears as active after completion
- [ ] Error handling works for edge cases

---

## 8. Future Improvements

### Potential Enhancements

1. **Auto-save:** Periodically save form data as draft
2. **Progress Tracking:** Show completion percentage
3. **Validation Feedback:** Real-time validation with helpful messages
4. **Image Upload:** Handle business image upload during form
5. **Social Links:** Validate social media URLs
6. **Phone Validation:** International phone number formatting
7. **Location Services:** Auto-detect user location
8. **Offline Support:** Queue changes when offline

### Performance Optimizations

- Implement form data caching
- Optimize database queries
- Add loading states and skeleton screens
- Implement progressive form loading
- Cache location data for faster form completion

---

## 9. Troubleshooting Guide

### Common Problems and Solutions

#### Problem: "No business ID found" Error

**Cause:** Business ID was not created or lost during navigation
**Solution:**

1. Check if payment was completed successfully
2. Verify business record exists in database
3. Check session storage for business ID
4. Implement fallback creation logic

#### Problem: Form Data Not Saving

**Cause:** Database connection issues or validation errors
**Solution:**

1. Check network connectivity
2. Verify form validation passes
3. Check database permissions
4. Review error logs for specific issues

#### Problem: Cannot Resume Incomplete Listing

**Cause:** Business record not found or user mismatch
**Solution:**

1. Verify business ownership
2. Check if business exists and is inactive
3. Ensure proper user authentication
4. Review database queries

---

## 10. API Endpoints

### Required Endpoints

```typescript
// Create business after payment
POST /api/businesses/create-after-payment
{
  userId: string,
  subscriptionId: string
}

// Update business details
PUT /api/businesses/:id
{
  // All business form fields
}

// Get user's incomplete businesses
GET /api/businesses/incomplete?userId=:userId

// Submit completed business
POST /api/businesses/:id/submit
```

---

This documentation should be updated as the business listing flow evolves and new features are added.
