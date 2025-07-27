## Test Card Numbers for Payment Simulation

### **Visa Test Cards:**

- **`4000000000000002`** - Standard Visa (successful payment)
- **`4000000000000127`** - Visa (simulation mode)

### **Mastercard Test Cards:**

- **`5555555555554444`** - Standard Mastercard (successful payment)

### **American Express Test Cards:**

- **`378282246310005`** - American Express (successful payment)

## How to Use These Test Cards

1. **Card Number:** Use any of the numbers above
2. **Expiry Date:** Use any future date (e.g., `12/25` for December 2025)
3. **CVV:** Use any 3-4 digit number (e.g., `123` for Visa/Mastercard, `1234` for Amex)
4. **Cardholder Name:** Any name (e.g., `Test User`)
5. **Billing Zip:** Any valid US zip code (e.g., `12345`)

## How the System Works

Your payment system has built-in logic to detect these test cards:

```typescript
const testCards = [
  "4000000000000002", // Visa success
  "5555555555554444", // Mastercard success
  "378282246310005", // Amex success
  "4000000000000127", // Visa simulation
];
```

When these card numbers are detected:

- The system automatically switches to **simulation mode**
- No actual payment processing occurs
- A simulated successful response is returned
- The business listing process continues normally

## Example Test Payment

For a business listing simulation, you can use:

- **Card:** `5555555555554444`
- **Expiry:** `12/25`
- **CVV:** `123`
- **Name:** `Test Business Owner`
- **Zip:** `12345`

This will allow you to complete the payment step and proceed to the business details form without any actual charges.

The system is designed to handle these test scenarios gracefully, so you can test the full business listing flow without processing real payments.
