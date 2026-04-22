# Stripe Payment Integration for OBS Jeans

## Overview

Integrate Stripe as the payment processor for the OBS Jeans e-commerce platform (Medusa v2.13.1), supporting credit/debit card payments and OXXO cash payments for the Mexican market.

## Context

- **Platform**: Medusa v2.13.1 backend + Next.js 15 storefront
- **Market**: Mexico
- **Domain**: jeansobs.com (production)
- **Current state**: No payment processor configured. Storefront has partial Stripe infrastructure (CardElement, StripeWrapper) but no active configuration.

## Requirements

### Must Have
- Credit/debit card payments (Visa, Mastercard, AMEX)
- OXXO cash payments (voucher-based, pay at convenience stores)
- Automatic payment status updates via webhooks (no manual reporting)
- Working checkout flow in the storefront

### Nice to Have (future scope)
- SPEI bank transfers
- MSI (Meses Sin Intereses)
- Saved payment methods

## Decision: Why Stripe

| Criteria | Stripe | MercadoPago | Conekta |
|---|---|---|---|
| Medusa v2 plugin | Official, built-in | Community, immature (v0.2.6) | None, build from scratch |
| Cards | Yes | Yes | Yes |
| OXXO | Native since v2.12 | Not confirmed in plugin | Yes but no plugin |
| Integration effort | Minimal (config only) | High (fork needed) | Very high (1-3 days) |
| Fees (Mexico) | 3.6% + $3 MXN | 2.95-3.49% + $4 MXN + IVA | 3.4% + $3 MXN |
| Documentation | Excellent | Limited for Medusa | N/A for Medusa |

Stripe wins on integration effort and reliability despite slightly higher fees.

## Architecture

### Payment Flow: Cards

```
Customer enters card in checkout (CardElement)
  -> stripe.confirmCardPayment(client_secret)
  -> Stripe authorizes + auto-captures (capture: true)
  -> Webhook: payment_intent.succeeded
  -> Medusa updates order status to "paid"
```

### Payment Flow: OXXO

```
Customer selects "Pagar en OXXO" in checkout
  -> stripe.confirmOxxoPayment(client_secret, { name, email })
  -> Stripe generates OXXO voucher with reference number
  -> Order created with status "pending payment"
  -> Customer pays at any OXXO store (up to 3 days)
  -> Webhook: payment_intent.succeeded
  -> Medusa updates order status to "paid"
```

## Implementation Plan

### Part 1: Backend (obs-jeans-platform)

#### 1.1 Configure medusa-config.ts

Add the payment module with Stripe provider:

```typescript
{
  resolve: "@medusajs/medusa/payment",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/payment-stripe",
        id: "stripe",
        options: {
          apiKey: process.env.STRIPE_API_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          capture: true,
          oxxoExpiresDays: 3,
        },
      },
    ],
  },
},
```

#### 1.2 Update .env.template

Add:
```
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Part 2: Storefront (obs-jeans-platform-storefront)

#### 2.1 Update Stripe packages

Current versions are outdated (major version behind):

| Package | Current | Target |
|---|---|---|
| @stripe/stripe-js | 8.2.0 | 9.2.0 |
| @stripe/react-stripe-js | 5.3.0 | 6.2.0 |

Review breaking changes before upgrading. If breaking changes are significant, evaluate staying on current versions (they should still work for our use case).

#### 2.2 Configure environment variable

Set `NEXT_PUBLIC_STRIPE_KEY` in `.env.local` with the publishable key from Stripe dashboard.

#### 2.3 Add OXXO support to constants.tsx

Register `pp_stripe-oxxo_stripe` as a known payment provider in the constants/provider detection logic.

#### 2.4 Add OXXO payment UI

**payment/index.tsx**: Add OXXO as a selectable payment method. When selected, show informational message instead of card input: "Recibiras un voucher para pagar en cualquier tienda OXXO. Tienes 3 dias para completar el pago."

**payment-container/index.tsx**: Add an OXXO container component (no card input needed, just customer name/email confirmation).

**payment-button/index.tsx**: Add `OxxoPaymentButton` that calls `stripe.confirmOxxoPayment()` instead of `confirmCardPayment()`. Required params: customer name and email (already available from checkout address step).

#### 2.5 Card payments

Card payments should work with existing infrastructure once `NEXT_PUBLIC_STRIPE_KEY` is configured. The existing `CardElement` + `confirmCardPayment()` flow is functional. Verify after Stripe package upgrade.

### Part 3: Manual Configuration (documented, not coded)

#### 3.1 Stripe Dashboard (client's account)
1. Create Stripe account (Mexican entity)
2. Get API keys (secret + publishable)
3. Enable OXXO in Settings -> Payment Methods

#### 3.2 Medusa Admin Dashboard
1. Go to Settings -> Regions
2. Edit Mexico region (or create it)
3. Enable payment providers:
   - "Stripe (STRIPE)" for cards
   - "OXXO Payments" for cash

#### 3.3 Production Webhooks
Create two webhooks in Stripe dashboard:

| Type | Webhook URL |
|---|---|
| Cards | `https://api.jeansobs.com/hooks/payment/stripe_stripe` |
| OXXO | `https://api.jeansobs.com/hooks/payment/stripe-oxxo_stripe` |

Events to listen for:
- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.partially_funded`

## Files to Modify

### Backend (obs-jeans-platform)
| File | Change |
|---|---|
| `medusa-config.ts` | Add payment module with Stripe provider |
| `.env.template` | Add STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET |

### Storefront (obs-jeans-platform-storefront)
| File | Change |
|---|---|
| `package.json` | Update @stripe/stripe-js and @stripe/react-stripe-js |
| `.env.local` | Set NEXT_PUBLIC_STRIPE_KEY |
| `src/lib/constants.tsx` | Add OXXO provider detection |
| `src/modules/checkout/components/payment/index.tsx` | Add OXXO payment method UI |
| `src/modules/checkout/components/payment-container/index.tsx` | Add OXXO container (info display) |
| `src/modules/checkout/components/payment-button/index.tsx` | Add OxxoPaymentButton |
| `src/modules/checkout/components/payment-wrapper/index.tsx` | Ensure OXXO provider triggers Stripe wrapper |

## Testing Strategy

1. **Backend**: Run `npm run build` to verify config is valid
2. **Cards**: Complete a test checkout with Stripe test card `4242 4242 4242 4242`
3. **OXXO**: Complete a test checkout selecting OXXO, verify voucher generation
4. **Webhooks**: Use Stripe CLI (`stripe listen --forward-to`) to test webhook delivery locally
5. **Edge cases**: Expired OXXO voucher, failed card payment, insufficient funds

## Stripe Test Cards (for development)

| Scenario | Card Number |
|---|---|
| Successful payment | 4242 4242 4242 4242 |
| Requires authentication (3DS) | 4000 0025 0000 3155 |
| Declined | 4000 0000 0000 0002 |
| Insufficient funds | 4000 0000 0000 9995 |

OXXO test mode generates test vouchers automatically - no special test data needed.

## Out of Scope

- SPEI bank transfers
- MSI (Meses Sin Intereses)
- Saved payment methods
- Custom payment failure email notifications
- Payment analytics dashboard
