# Business Listing ID Flow & Persistence

## Overview

This document explains how the business listing process handles the creation, storage, and persistence of the business ID throughout the multi-step form and dashboard experience. It also covers how users can resume incomplete listings and best practices for robust ID management.

---

## 1. Business ID Creation and Storage (After Payment)

- **After a successful payment:**
  - A new business record is created in the `businesses` table with:
    - `owner_id` set to the current user’s ID
    - `subscription_id` set to the new subscription
    - `is_active: false` (until details are filled)
  - The new business’s `id` is:
    - Stored in React state (`setBusinessIdToUpdate`)
    - Stored in `sessionStorage` as `"businessIdToUpdate"`
    - Passed in navigation state when redirecting to `/business/new`

---

## 2. Multi-Step Form Persistence

- The business ID is retrieved from:
  - `location.state.businessIdToUpdate` (if navigating directly after payment)
  - `sessionStorage.getItem("businessIdToUpdate")` (if the user refreshes or returns later)
- All updates to the business listing use this ID to update the correct record in the database.

---

## 3. Dashboard/Resume Incomplete Listings

- The dashboard uses the `useUserBusinesses` hook to fetch all businesses for the current user.
- Incomplete businesses (e.g., those with `is_active: false` or name `"Pending Business Listing"`) are shown in a special "Incomplete Listings" section.
- Each incomplete listing has a "Complete Listing" button, which calls `onContinueListing(business)`.
- This handler should navigate the user to the multi-step form, passing the business ID so the form can load and update the correct record.

---

## 4. Potential Issues

- If the user clears their sessionStorage and does not use the dashboard to resume, the business ID may be lost unless always fetched from the backend.
- If the business record is not created after payment (due to an error), the ID will not exist.
- If the navigation to `/business/new` is bypassed, the form may not have the business ID in state or session.

---

## 5. Recommendations

- **Always fetch incomplete businesses from the backend (by user ID) in the dashboard and on `/business/new` if no ID is present in state/session.**
- **When resuming, always pass the business ID in navigation state or as a URL param.**
- **Consider adding a check on `/business/new` to fetch the latest incomplete business for the user if no ID is present.**

---

## 6. Summary Table

| Step            | How ID is Handled                                 |
| --------------- | ------------------------------------------------- |
| After payment   | Created, stored in state, sessionStorage, and nav |
| Multi-step form | Reads from state, sessionStorage, or nav state    |
| Dashboard       | Fetches all businesses for user, shows incomplete |
| Resume listing  | Passes business ID to form for update             |

---

## 7. Best Practices

- The business ID should always be available in the multi-step form, either from navigation state, sessionStorage, or by fetching from the backend.
- The dashboard should clearly show incomplete listings and allow users to resume them with a single click.
- All updates and submissions should use the correct business ID to ensure data integrity.

---

_Last updated: 2024-07-07_
