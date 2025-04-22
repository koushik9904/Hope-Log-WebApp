# PayPal Sandbox Testing Instructions

## Account Setup
In PayPal's sandbox environment, you need two types of accounts to test payments:
1. **Business Account** - This is the merchant account that receives payments (already configured in our app)
2. **Personal Account** - This is the buyer/customer account that makes payments (you need this for testing)

## How to Test Payments

### Method 1: Log in with a Sandbox Personal Account
1. When redirected to PayPal login, use one of these test accounts:
   - Email: `sb-47syrg2235716@personal.example.com`
   - Password: `S=5g&)up`

   This is a default sandbox personal account that PayPal typically provides. If this doesn't work, you'll need to check your PayPal Developer Dashboard for the personal test accounts.

### Method 2: Use a Test Credit Card
When choosing the credit card option, use these test card details:
- Card Number: `4111 1111 1111 1111` (Visa)
- Expiry Date: Any future date
- CVV: Any 3 digits
- Name: Any name
- Address: Any valid address format

## Troubleshooting
- If you see "Check the card details" error, make sure you're using exactly the test card number format shown above
- If PayPal login fails, verify you're using a sandbox personal account, not your real PayPal credentials
- Remember that in sandbox mode, real payment methods and real PayPal accounts won't work

## For Development Only
These are test accounts and test cards provided by PayPal for development purposes only. No real charges are made when using the sandbox environment.