

# Plan: Update Contact Information

## Changes

### 1. Footer (`src/components/Footer.tsx`)
- Change email from `kontakt@notera.info` to `notera.info@gmail.com`
- Remove the phone number entry entirely (the `<li>` with the Phone icon and `+46 (0) 8 123 45 67`)

### 2. Contact Page (`src/pages/Contact.tsx`)
- Change email from `kontakt@notera.se` to `notera.info@gmail.com` (both the `href` and display text on line 249-251)

### 3. Pricing Page (`src/pages/Pricing.tsx`)
- Change email from `kontakt@notera.info` / `kontakt@notera.se` to `notera.info@gmail.com` in the FAQ section (line ~98)

### Files Modified
- `src/components/Footer.tsx` — update email, remove phone
- `src/pages/Contact.tsx` — update email
- `src/pages/Pricing.tsx` — update email

