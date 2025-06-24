/**
 * Email Configuration
 * 
 * This module provides centralized email configuration for the application.
 * It retrieves email addresses from environment variables to avoid hardcoding.
 */

// Primary support email address
export const PRIMARY_SUPPORT_EMAIL = import.meta.env.VITE_PRIMARY_SUPPORT_EMAIL || 'support@blackdollarnetwork.com';

// Secondary support email address (for BCC)
export const SECONDARY_SUPPORT_EMAIL = import.meta.env.VITE_SECONDARY_SUPPORT_EMAIL || 'jlgreen@blackdollarnetwork.com';

// Get a formatted email address for display or mailto links
export const getFormattedSupportEmail = () => {
  return PRIMARY_SUPPORT_EMAIL;
};

// Get email addresses for sending (includes both primary and secondary)
export const getSupportEmailAddresses = () => {
  return {
    to: PRIMARY_SUPPORT_EMAIL,
    bcc: SECONDARY_SUPPORT_EMAIL
  };
};

export default {
  PRIMARY_SUPPORT_EMAIL,
  SECONDARY_SUPPORT_EMAIL,
  getFormattedSupportEmail,
  getSupportEmailAddresses
};