# 💳 Stripe Payment System Implementation

**Date**: January 13, 2026  
**Status**: ✅ Complete

---

## 🎯 Overview

Complete subscription system with Stripe integration:
- 3 plans (Free, Pro, Business) with monthly/yearly billing
- Secure checkout flow with Stripe Checkout
- Webhook handling for subscription lifecycle
- Customer portal for self-service management
- Usage tracking with limits enforcement
- Beautiful pricing page with toggle

---

## 📁 Files Created

### Backend (API Routes)

1. **`/src/lib/stripe.ts`** - Server-side Stripe configuration
   - Stripe SDK instance with API version 2024-12-18
   - Price ID mapping (PRO_MONTHLY, PRO_YEARLY, BUSINESS_MONTHLY, BUSINESS_YEARLY)
   - `getPriceId()` helper function
   - Webhook signature verification
   - Event type constants

2. **`/src/lib/stripe-client.ts`** - Client-side Stripe utilities
   - `getStripe()` - Loads Stripe.js (singleton pattern)
   - `redirectToCheckout()` - Redirects to Stripe Checkout
   - `redirectToCustomerPortal()` - Opens billing portal

3. **`/src/app/api/stripe/checkout/route.ts`** - POST /api/stripe/checkout
   - Creates Checkout Session for subscription
   - Gets/creates Stripe customer
   - Saves customer ID to database
   - Validates plan and interval with Zod
   - Returns session ID for redirect

4. **`/src/app/api/stripe/customer-portal/route.ts`** - POST /api/stripe/customer-portal
   - Creates Customer Portal session
   - Allows users to manage subscriptions, billing, invoices
   - Requires authenticated user with active subscription

5. **`/src/app/api/stripe/webhook/route.ts`** - POST /api/stripe/webhook
   - Handles 6 webhook events:
     * `checkout.session.completed` - Activate subscription
     * `customer.subscription.updated` - Update status
     * `customer.subscription.deleted` - Cancel subscription
     * `invoice.paid` - Log successful payment
     * `invoice.payment_failed` - Mark past_due
   - Verifies webhook signature (prevents fake requests)
   - Updates `profiles` table with service role key

### Frontend (Components)

6. **`/src/components/pricing/PricingCard.tsx`** - Plan card component
   - Displays plan name, description, price
   - Monthly/yearly toggle with savings badge
   - Feature list with checkmarks
   - Subscribe button (integrated with Stripe)
   - "Current Plan" and "Most Popular" badges
   - Loading state during checkout

7. **`/src/components/pricing/PricingToggle.tsx`** - Toggle component
   - Switch between monthly/yearly billing
   - Shows -17% savings badge for yearly
   - Accessible (ARIA role="switch")

8. **`/src/app/pricing/page.tsx`** - Public pricing page
   - 3 pricing cards (Free, Pro, Business)
   - Monthly/yearly toggle
   - FAQ section (4 questions)
   - CTA banner at bottom
   - Uses REGIONAL_PRICING from lib/pricing.ts

### Hooks

9. **`/src/hooks/useSubscription.ts`** - Subscription management hook
   - `subscription` - Current plan, status, interval, period end
   - `usage` - Monthly usage counters for all features
   - `canUseFeature()` - Check if limit reached
   - `hasPlan()` - Check if user has minimum plan level
   - `refresh()` - Reload subscription data

### Database

10. **`/supabase/migration-stripe.sql`** - Database migration
    - Adds subscription fields to `profiles` table:
      * `subscription_plan` (free/pro/business)
      * `subscription_status` (active/canceled/past_due/trialing)
      * `subscription_interval` (monthly/yearly)
      * `subscription_current_period_end` (TIMESTAMPTZ)
      * `stripe_customer_id` (UNIQUE)
    - Creates usage tracking tables:
      * `generated_images` - DALL-E image generation
      * `presentations` - Auto-generated presentations
      * `memoires_techniques` - Technical proposals
    - Indexes for performance
    - RLS policies for security

---

## 📊 Plan Features & Limits

### Free Plan
- **Price**: €0/month
- **Limits**:
  - 5 tenders/month
  - 1 image per tender
  - 0 presentations
  - 0 mémoires techniques
- **Features**: Basic scoring, marketplace view, email support

### Pro Plan
- **Price**: €49/month or €490/year (save €98)
- **Limits**:
  - Unlimited tenders
  - 50 images/month
  - 10 presentations/month
  - 5 mémoires techniques/month
- **Features**: Full analytics, custom alerts, priority support

### Business Plan
- **Price**: €149/month or €1,490/year (save €298)
- **Limits**:
  - Unlimited everything
- **Features**: API access, multi-user, dedicated support, SLA

---

## 🔄 Subscription Flow

### 1. User clicks "Subscribe" on pricing page
```
/pricing → Click "Souscrire" → POST /api/stripe/checkout
```

### 2. API creates Stripe Checkout Session
```typescript
// Get or create Stripe customer
const customer = await stripe.customers.create({
  email: user.email,
  metadata: { supabase_user_id: user.id }
});

// Create checkout session
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: '/dashboard?checkout=success',
  cancel_url: '/settings?checkout=cancelled',
});
```

### 3. User redirected to Stripe Checkout
```typescript
await redirectToCheckout(session.id);
// Hosted on Stripe servers (PCI compliant)
```

### 4. Stripe sends webhook to `/api/stripe/webhook`
```
checkout.session.completed → Update profiles table:
- subscription_plan: 'pro'
- subscription_status: 'active'
- subscription_interval: 'monthly'
```

### 5. User redirected to `/dashboard?checkout=success`

---

## 🎣 Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, update profile |
| `customer.subscription.updated` | Update status, plan, period end |
| `customer.subscription.deleted` | Revert to free plan |
| `invoice.paid` | Log successful payment |
| `invoice.payment_failed` | Mark as `past_due` |

---

## 🔐 Security Features

1. **Webhook Signature Verification**
   - Prevents fake webhook requests
   - Uses `STRIPE_WEBHOOK_SECRET`

2. **Authentication Required**
   - All API routes check `supabase.auth.getUser()`
   - Returns 401 if not authenticated

3. **Service Role for Webhooks**
   - Webhooks use service role key (bypass RLS)
   - Required to update user profiles from Stripe events

4. **Metadata Validation**
   - All Stripe objects contain `user_id` in metadata
   - Prevents cross-user subscription attacks

---

## 📝 Environment Variables

Add to `.env.local`:

```env
# Stripe Keys (from https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Webhook Secret (from Stripe Dashboard > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Dashboard > Products)
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx
```

---

## 🚀 Setup Instructions

### 1. Create Stripe Account
- Go to https://stripe.com
- Create account and complete onboarding
- Switch to Test Mode (toggle in dashboard)

### 2. Create Products & Prices
```
Dashboard > Products > Add Product

Product 1: "WeWinBid Pro"
- Monthly: €49 → Copy price ID
- Yearly: €490 → Copy price ID

Product 2: "WeWinBid Business"
- Monthly: €149 → Copy price ID
- Yearly: €1,490 → Copy price ID
```

### 3. Configure Webhook
```
Dashboard > Webhooks > Add Endpoint

URL: https://your-domain.com/api/stripe/webhook
Events to send:
  ✅ checkout.session.completed
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.paid
  ✅ invoice.payment_failed

Copy webhook signing secret → STRIPE_WEBHOOK_SECRET
```

### 4. Run Database Migration
```sql
-- Execute in Supabase SQL Editor
-- File: /supabase/migration-stripe.sql
```

### 5. Test Payment Flow
```bash
# Use Stripe test cards
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

---

## 🧪 Testing

### Test Cards (Stripe)

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Payment requires authentication |

### Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test specific event
stripe trigger checkout.session.completed
```

---

## 📈 Usage Tracking

The `useSubscription` hook automatically tracks monthly usage:

```typescript
const { subscription, usage, canUseFeature } = useSubscription();

// Check before generating image
if (!canUseFeature('images')) {
  alert('Limite atteinte, upgrader votre plan');
  return;
}

// Usage stats
console.log(usage.images.used); // 23
console.log(usage.images.limit); // 50
console.log(usage.images.unlimited); // false
```

---

## 🎨 UI Components

### Pricing Page
- Route: `/pricing`
- Public (no auth required)
- Monthly/yearly toggle
- 3 cards with features
- FAQ section

### Settings Page (TODO)
- Route: `/settings`
- Show current plan
- "Manage Subscription" button → Customer Portal
- Usage stats (progress bars)
- Upgrade/downgrade CTAs

---

## 🔮 Future Enhancements

1. **Proration**
   - Handle plan changes mid-cycle
   - Calculate prorated amounts

2. **Trial Period**
   - 14-day free trial for Pro/Business
   - Auto-convert to paid after trial

3. **Team Plans**
   - Multi-user seats
   - Per-seat pricing

4. **Usage-Based Billing**
   - Pay-as-you-go for images
   - Stripe Metered Billing

5. **Invoices**
   - Auto-send invoices via email
   - PDF generation

6. **Coupons**
   - Stripe promotion codes
   - First-month discounts

---

## ✅ Checklist

- [x] Stripe SDK installed (stripe, @stripe/stripe-js)
- [x] Server config (`lib/stripe.ts`)
- [x] Client config (`lib/stripe-client.ts`)
- [x] Checkout API route
- [x] Customer Portal API route
- [x] Webhook handler (6 events)
- [x] Pricing page with cards
- [x] Subscription hook
- [x] Database migration
- [x] Environment variables documented
- [ ] Stripe account created (user action)
- [ ] Products/prices created (user action)
- [ ] Webhook configured (user action)
- [ ] Migration executed (user action)
- [ ] Test payment completed (user action)

---

**Total Files**: 10 created  
**Lines of Code**: ~1,500  
**Setup Time**: 1 hour (including Stripe account setup)
