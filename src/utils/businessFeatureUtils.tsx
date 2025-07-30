/**
 * Utility functions for determining business feature visibility
 * based on subscription plan and migration status
 */

/**
 * Determines if premium content should be shown for a business
 * @param business The business object
 * @returns boolean indicating if premium content should be shown
 */
export const shouldShowPremiumContent = (business: any): boolean => {
  // Show premium content based on subscription plan
  return (
    business?.subscription_plans === "Enhanced Plan" ||
    business?.subscription_plans === "VIP Plan"
  );
};

/**
 * Determines if image gallery should be shown for a business
 * @param business The business object
 * @returns boolean indicating if image gallery should be shown
 */
export const shouldShowImageGallery = (business: any): boolean => {
  return (
    business?.subscription_plans === "Starter Plan" ||
    business?.subscription_plans === "Enhanced Plan" ||
    business?.subscription_plans === "VIP Plan" ||
    business?.subscription_plans === "Migrated"
  );
};

/**
 * Determines if contact info should be shown for a business
 * @param business The business object
 * @returns boolean indicating if contact info should be shown
 */
export const shouldShowContactInfo = (business: any): boolean => {
  return (
    business?.subscription_plans === "Starter Plan" ||
    business?.subscription_plans === "Enhanced Plan" ||
    business?.subscription_plans === "VIP Plan"
  );
};

/**
 * Checks if a business is an unclaimed migrated business
 * @param business The business object
 * @returns boolean indicating if the business is unclaimed and migrated
 */
export const isUnclaimedMigratedBusiness = (business: any): boolean => {
  return !!business?.migration_source && !business?.claimed_at;
};

/**
 * Gets the effective plan name for a business
 * @param business The business object
 * @returns The effective plan name
 */
export const getEffectivePlanName = (business: any): string => {
  // If it's an unclaimed migrated business, show as "Migrated" regardless of plan_name
  if (isUnclaimedMigratedBusiness(business)) {
    return "Migrated";
  }

  // Otherwise return the actual plan name
  return business?.plan_name || "Free";
};

/**
 * Determines if a business is a VIP member
 * @param business The business object
 * @returns boolean indicating if the business is a VIP member
 */
export const isVipMember = (business: any): boolean => {
  // Unclaimed migrated businesses are not active VIP members
  if (isUnclaimedMigratedBusiness(business)) {
    return false;
  }

  return business?.plan_name === "VIP Plan";
};

/**
 * Checks if a business should show VIP features
 * @param business The business object
 * @returns boolean indicating if VIP features should be shown
 */
export const shouldShowVipFeatures = (business: any): boolean => {
  return isVipMember(business) && !isUnclaimedMigratedBusiness(business);
};

/**
 * Determines if a business is a legacy member
 * @param business The business object
 * @returns boolean indicating if the business is a legacy member
 */
export const isLegacyMember = (business: any): boolean => {
  return business?.subscription_plans === "Migrated";
};
