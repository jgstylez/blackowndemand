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
 * Determines if a business is a VIP member
 * @param business The business object
 * @returns boolean indicating if the business is a VIP member
 */
export const isVipMember = (business: any): boolean => {
  return business?.subscription_plans === "VIP Plan";
};

/**
 * Determines if a business is a legacy member
 * @param business The business object
 * @returns boolean indicating if the business is a legacy member
 */
export const isLegacyMember = (business: any): boolean => {
  return business?.subscription_plans === "Migrated";
};
