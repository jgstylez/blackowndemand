/**
 * Utility functions for email operations
 */

/**
 * Masks an email address for privacy/security purposes
 * Example: "john.doe@example.com" becomes "jo**@e*****.com"
 * 
 * @param email - The email address to mask
 * @returns The masked email address
 */
export const maskEmail = (email: string): string => {
  if (!email) return '';
  
  const [localPart, domainFull] = email.split('@');
  if (!domainFull) return email;
  
  // Mask the local part with asterisks, keeping first 2 characters
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '*'.repeat(Math.max(1, localPart.length - 2))
    : localPart;
  
  // Split domain into domain name and TLD
  const lastDotIndex = domainFull.lastIndexOf('.');
  if (lastDotIndex === -1) return `${maskedLocal}@${domainFull}`;
  
  const domain = domainFull.substring(0, lastDotIndex);
  const tld = domainFull.substring(lastDotIndex);
  
  // Mask the domain part with asterisks, keeping first character
  const maskedDomain = domain.length > 1
    ? domain.substring(0, 1) + '*'.repeat(Math.max(1, domain.length - 1))
    : domain;
  
  return `${maskedLocal}@${maskedDomain}${tld}`;
};