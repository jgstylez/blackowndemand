/**
 * Validates payment form data
 * @param formData The payment form data to validate
 * @returns An object with isValid flag and errorMessage if validation fails
 */

// Standardized test cards for all payment functions
export const TEST_CARDS = {
  // Primary test cards (most reliable)
  PRIMARY: [
    "4000000000000002", // Visa success
    "5555555555554444", // Mastercard success
    "378282246310005", // Amex success
  ],
  // Extended test cards (for comprehensive testing)
  EXTENDED: [
    "4000000000000002", // Visa success
    "4000000000000127", // Visa simulation
    "5555555555554444", // Mastercard success
    "378282246310005", // Amex success
    "4111111111111111", // Visa test
    "4222222222222222", // Visa test
    "5105105105105100", // Mastercard test
    "371449635398431", // Amex test
  ],
  // Legacy test cards (for backward compatibility)
  LEGACY: [
    "4000000000000002",
    "5555555555554444",
    "378282246310005",
    "4000000000000127",
  ],
};

export const isValidTestCard = (cardNumber: string): boolean => {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  return (
    TEST_CARDS.PRIMARY.includes(cleanCardNumber) ||
    TEST_CARDS.EXTENDED.includes(cleanCardNumber)
  );
};

export const validateForm = (formData: {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingZip?: string;
}): { isValid: boolean; errorMessage: string | null } => {
  // Card number validation - support 13-19 digits (covers all major card types)
  const cardNumberClean = formData.cardNumber.replace(/\s/g, "");
  if (
    !cardNumberClean ||
    cardNumberClean.length < 13 ||
    cardNumberClean.length > 19
  ) {
    return {
      isValid: false,
      errorMessage: "Please enter a valid card number (13-19 digits)",
    };
  }

  // Expiry date validation
  if (!formData.expiryDate || formData.expiryDate.length < 5) {
    return {
      isValid: false,
      errorMessage: "Please enter a valid expiry date",
    };
  }

  // Check if expiry date is in the future
  const [month, year] = formData.expiryDate.split("/");
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const expYear = parseInt(year);
  const expMonth = parseInt(month);

  if (
    expYear < currentYear ||
    (expYear === currentYear && expMonth < currentMonth)
  ) {
    return {
      isValid: false,
      errorMessage: "Card has expired",
    };
  }

  // CVV validation - 3-4 digits (Amex uses 4 digits, others use 3)
  // Determine if it's an Amex card (starts with 34 or 37)
  const isAmex = /^3[47]/.test(cardNumberClean);
  const expectedCvvLength = isAmex ? 4 : 3;

  if (!formData.cvv || formData.cvv.length !== expectedCvvLength) {
    return {
      isValid: false,
      errorMessage: `Please enter a valid ${expectedCvvLength}-digit CVV`,
    };
  }

  // Cardholder name validation
  if (!formData.cardholderName.trim()) {
    return {
      isValid: false,
      errorMessage: "Please enter the cardholder name",
    };
  }

  // Billing zip validation (if required)
  if (formData.billingZip !== undefined && !formData.billingZip.trim()) {
    return {
      isValid: false,
      errorMessage: "Please enter your billing zip code",
    };
  }

  return { isValid: true, errorMessage: null };
};

export default { validateForm, isValidTestCard, TEST_CARDS };
