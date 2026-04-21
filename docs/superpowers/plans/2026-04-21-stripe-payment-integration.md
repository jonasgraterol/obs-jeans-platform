# Stripe Payment Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Stripe as payment processor for OBS Jeans, supporting credit/debit cards and OXXO cash payments in the Mexican market.

**Architecture:** Backend config-only change in Medusa (official Stripe plugin). Storefront requires upgrading Stripe packages to latest major versions, configuring the publishable key, and adding OXXO as a new payment method in the checkout flow alongside existing card support.

**Tech Stack:** Medusa v2.13.1, Next.js 15, @stripe/stripe-js 9.x, @stripe/react-stripe-js 6.x, TypeScript

---

## File Structure

### Backend (obs-jeans-platform)
| File | Action | Responsibility |
|---|---|---|
| `medusa-config.ts` | Modify | Add payment module with Stripe provider config |
| `.env.template` | Modify | Add STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET |

### Storefront (obs-jeans-platform-storefront)
| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Upgrade @stripe/stripe-js and @stripe/react-stripe-js |
| `src/lib/constants.tsx` | Modify | Add OXXO provider entry and isOxxo helper |
| `src/modules/checkout/components/payment-wrapper/index.tsx` | Modify | Extend isStripeLike check to include OXXO |
| `src/modules/checkout/components/payment/index.tsx` | Modify | Add OXXO payment method UI with info message |
| `src/modules/checkout/components/payment-container/index.tsx` | Modify | Add OxxoContainer component |
| `src/modules/checkout/components/payment-button/index.tsx` | Modify | Add OxxoPaymentButton with confirmOxxoPayment |

---

### Task 1: Configure Stripe Payment Module in Backend

**Files:**
- Modify: `medusa-config.ts:5-35`
- Modify: `.env.template:1-10`

- [ ] **Step 1: Add Stripe payment provider to medusa-config.ts**

In `medusa-config.ts`, add the payment module to the `modules` array alongside the existing notification module:

```typescript
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-sendgrid",
            id: "sendgrid",
            options: {
              channels: ["email"],
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM,
            },
          },
        ],
      },
    },
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
  ],
})
```

- [ ] **Step 2: Add Stripe environment variables to .env.template**

Append to `.env.template`:

```
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
```

- [ ] **Step 3: Verify backend builds successfully**

Run: `cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add medusa-config.ts .env.template
git commit -m "feat: add Stripe payment provider with OXXO support"
```

---

### Task 2: Upgrade Stripe Packages in Storefront

**Files:**
- Modify: `../obs-jeans-platform-storefront/package.json`

Breaking changes analysis for our use case (CardElement, confirmCardPayment, loadStripe, Elements, useStripe, useElements):
- `@stripe/stripe-js` 8.x → 9.x: Removes `createSource`/`retrieveSource` (we don't use). Changes `elements.update()` to return Promise (we don't use). Our APIs are unaffected.
- `@stripe/react-stripe-js` 5.x → 6.x: Type updates for "Dahlia", renames `createEmbeddedCheckoutPage` (we don't use). Our APIs (Elements, CardElement, useStripe, useElements) are unaffected.

- [ ] **Step 1: Upgrade Stripe packages**

Run:
```bash
cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform-storefront
npm install @stripe/stripe-js@latest @stripe/react-stripe-js@latest
```

Expected: Both packages update to 9.x and 6.x respectively. No peer dependency errors.

- [ ] **Step 2: Verify storefront builds successfully**

Run: `npm run build`
Expected: Build succeeds. If there are type errors related to Stripe, note them for fixing in subsequent steps.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade @stripe/stripe-js to 9.x and @stripe/react-stripe-js to 6.x"
```

---

### Task 3: Add OXXO Provider to Constants

**Files:**
- Modify: `../obs-jeans-platform-storefront/src/lib/constants.tsx:1-76`

- [ ] **Step 1: Add OXXO entry to paymentInfoMap and isOxxo helper**

In `src/lib/constants.tsx`, add the OXXO provider entry to the `paymentInfoMap` object and add an `isOxxo` helper function:

```typescript
import React from "react"
import { CreditCard } from "@medusajs/icons"

import Ideal from "@modules/common/icons/ideal"
import Bancontact from "@modules/common/icons/bancontact"
import PayPal from "@modules/common/icons/paypal"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-oxxo_stripe": {
    title: "Pago en OXXO",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isOxxo = (providerId?: string) => {
  return providerId === "pp_stripe-oxxo_stripe"
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
```

Key changes:
- Added `"pp_stripe-oxxo_stripe"` entry in `paymentInfoMap` with title "Pago en OXXO"
- Added `isOxxo()` helper function that checks for the exact OXXO provider ID

- [ ] **Step 2: Verify build**

Run: `cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.tsx
git commit -m "feat: add OXXO payment provider to constants"
```

---

### Task 4: Extend PaymentWrapper to Support OXXO

**Files:**
- Modify: `../obs-jeans-platform-storefront/src/modules/checkout/components/payment-wrapper/index.tsx:1-51`

OXXO uses the same Stripe.js infrastructure as cards (it needs `stripe.confirmOxxoPayment()`), so the `PaymentWrapper` must also wrap OXXO sessions with the `StripeWrapper`. The `isStripeLike` function doesn't match OXXO because OXXO's provider ID is `pp_stripe-oxxo_stripe` which starts with `pp_stripe-` not `pp_stripe_`.

- [ ] **Step 1: Update PaymentWrapper to include OXXO**

In `src/modules/checkout/components/payment-wrapper/index.tsx`, import `isOxxo` and extend the condition:

```typescript
"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripeLike, isOxxo } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  : null

const needsStripe = (providerId?: string) =>
  isStripeLike(providerId) || isOxxo(providerId)

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  if (
    needsStripe(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
```

Key change: Added `needsStripe()` helper that returns true for both card (`isStripeLike`) and OXXO (`isOxxo`) providers, so the Stripe Elements context is available for OXXO payments.

- [ ] **Step 2: Verify build**

Run: `cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/modules/checkout/components/payment-wrapper/index.tsx
git commit -m "feat: extend PaymentWrapper to initialize Stripe for OXXO payments"
```

---

### Task 5: Add OXXO Container to Payment Container

**Files:**
- Modify: `../obs-jeans-platform-storefront/src/modules/checkout/components/payment-container/index.tsx:1-130`

- [ ] **Step 1: Add OxxoContainer component**

In `src/modules/checkout/components/payment-container/index.tsx`, add a new exported component `OxxoContainer` after the existing `StripeCardContainer`:

```typescript
import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@medusajs/ui"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "flex flex-col gap-y-2 text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
        {
          "border-ui-border-interactive":
            selectedPaymentOptionId === paymentProviderId,
        }
      )}
    >
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-x-4">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <Text className="text-base-regular">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden small:block" />
          )}
        </div>
        <span className="justify-self-end text-ui-fg-base">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="small:hidden text-[10px]" />
      )}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Enter your card details:
            </Text>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}

export const OxxoContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
}: Omit<PaymentContainerProps, "children">) => {
  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId && (
        <div className="my-4 p-4 bg-ui-bg-subtle rounded-md transition-all duration-150 ease-in-out">
          <Text className="txt-medium text-ui-fg-base">
            Al confirmar tu pedido, se generara un voucher con un numero de
            referencia para pagar en cualquier tienda OXXO.
          </Text>
          <Text className="txt-small text-ui-fg-subtle mt-2">
            Tendras 3 dias para completar el pago. Tu pedido se confirmara
            automaticamente una vez que realices el pago.
          </Text>
        </div>
      )}
    </PaymentContainer>
  )
}
```

Key change: Added `OxxoContainer` component at the end of the file. It reuses `PaymentContainer` (radio button + title + icon) and shows an informational message instead of a card input when selected.

- [ ] **Step 2: Verify build**

Run: `cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/modules/checkout/components/payment-container/index.tsx
git commit -m "feat: add OxxoContainer component for OXXO payment display"
```

---

### Task 6: Add OXXO to Payment Method Selection UI

**Files:**
- Modify: `../obs-jeans-platform-storefront/src/modules/checkout/components/payment/index.tsx:1-259`

- [ ] **Step 1: Update Payment component to render OXXO option**

In `src/modules/checkout/components/payment/index.tsx`, import `isOxxo` and `OxxoContainer`, then add OXXO rendering logic in the payment methods list and update the submit button logic:

```typescript
"use client"

import { RadioGroup } from "@headlessui/react"
import { isOxxo, isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  OxxoContainer,
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method) || isOxxo(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : isOxxo(paymentMethod.id) ? (
                      <OxxoContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? " Enter card details"
              : "Continue to review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : isOxxo(selectedPaymentMethod)
                      ? "Pago en efectivo"
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
```

Key changes:
- Import `isOxxo` from constants and `OxxoContainer` from payment-container
- In `setPaymentMethod`: also call `initiatePaymentSession` for OXXO (`isOxxo(method)`)
- In RadioGroup render: add `isOxxo` check to render `OxxoContainer` instead of generic `PaymentContainer`
- In closed state summary: show "Pago en efectivo" for OXXO instead of card brand
- The submit button does NOT disable for OXXO (no card completeness check needed) — OXXO only needs `selectedPaymentMethod` to be set

- [ ] **Step 2: Verify build**

Run: `cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/modules/checkout/components/payment/index.tsx
git commit -m "feat: add OXXO as selectable payment method in checkout"
```

---

### Task 7: Add OXXO Payment Button

**Files:**
- Modify: `../obs-jeans-platform-storefront/src/modules/checkout/components/payment-button/index.tsx:1-194`

- [ ] **Step 1: Add OxxoPaymentButton component and update switch logic**

In `src/modules/checkout/components/payment-button/index.tsx`, import `isOxxo`, add `OxxoPaymentButton`, and update the switch statement:

```typescript
"use client"

import { isManual, isOxxo, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isOxxo(paymentSession?.provider_id):
      return (
        <OxxoPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const OxxoPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stripe = useStripe()

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !cart) {
      setSubmitting(false)
      return
    }

    const billingName =
      (cart.billing_address?.first_name ?? "") +
      " " +
      (cart.billing_address?.last_name ?? "")

    await stripe
      .confirmOxxoPayment(session?.data.client_secret as string, {
        payment_method: {
          billing_details: {
            name: billingName.trim(),
            email: cart.email,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          setErrorMessage(error.message || null)
          setSubmitting(false)
          return
        }

        if (
          paymentIntent &&
          (paymentIntent.status === "requires_action" ||
            paymentIntent.status === "requires_capture" ||
            paymentIntent.status === "succeeded")
        ) {
          return onPaymentCompleted()
        }

        setSubmitting(false)
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Generar voucher OXXO
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="oxxo-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
```

Key changes:
- Import `isOxxo` from constants
- Add `isOxxo` case in the `switch` statement, before `isManual`
- New `OxxoPaymentButton` component that:
  - Uses `stripe.confirmOxxoPayment()` with `billing_details.name` and `billing_details.email`
  - Handles `requires_action` status (OXXO generates a voucher modal via Stripe.js)
  - Shows "Generar voucher OXXO" as button text
  - Does NOT need `useElements()` or card element — only needs `useStripe()`

- [ ] **Step 2: Verify build**

Run: `cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform-storefront && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/modules/checkout/components/payment-button/index.tsx
git commit -m "feat: add OxxoPaymentButton with confirmOxxoPayment flow"
```

---

### Task 8: End-to-End Verification

This task requires manual setup before testing. No code changes.

- [ ] **Step 1: Set environment variables**

In the backend `.env`, set `STRIPE_API_KEY` to a Stripe test secret key (`sk_test_...`).

In the storefront `.env.local`, set `NEXT_PUBLIC_STRIPE_KEY` to the matching Stripe test publishable key (`pk_test_...`).

- [ ] **Step 2: Start both services**

Terminal 1 (backend):
```bash
cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform
npm run dev
```

Terminal 2 (storefront):
```bash
cd /Users/jonasgraterol/Development/AI-COMMERCE/obs-jeans/obs-jeans-platform-storefront
npm run dev
```

- [ ] **Step 3: Enable Stripe in Mexico region via Medusa Admin**

1. Open http://localhost:9000/app
2. Go to Settings -> Regions
3. Edit the Mexico region
4. Enable "Stripe (STRIPE)" and "OXXO Payments" in payment providers
5. Save

- [ ] **Step 4: Test card payment**

1. Open http://localhost:8000
2. Add a product to cart
3. Go to checkout
4. Fill in address and shipping
5. Select "Credit card" as payment method
6. Enter test card: `4242 4242 4242 4242`, any future expiry, any CVC
7. Place order
8. Expected: Order completes successfully, redirects to confirmation page

- [ ] **Step 5: Test OXXO payment**

1. Open http://localhost:8000
2. Add a product to cart
3. Go to checkout
4. Fill in address and shipping
5. Select "Pago en OXXO" as payment method
6. Verify informational message appears about 3-day payment window
7. Click "Generar voucher OXXO"
8. Expected: Stripe shows OXXO voucher modal with reference number, order is created

- [ ] **Step 6: Test webhook delivery locally (optional)**

Install Stripe CLI and forward webhooks:
```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
stripe listen --forward-to localhost:9000/hooks/payment/stripe-oxxo_stripe
```

Verify events are received when placing test orders.
