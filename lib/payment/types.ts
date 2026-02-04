/**
 * Payment Types
 * Contract: PAYMENT_FUNC_WEBHOOK, PAYMENT_FUNC_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * Payment Provider: Polar (https://polar.sh)
 */

// =====================================================
// Polar Webhook Event Types
// =====================================================

export type WebhookEventName =
  | "order.created"
  | "order.refunded"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.active"
  | "subscription.canceled"
  | "subscription.revoked"
  | "checkout.created"
  | "checkout.updated";

export interface WebhookMeta {
  event: WebhookEventName;
  webhook_id: string;
  delivery_id: string;
}

export interface WebhookPayload {
  type: WebhookEventName;
  data: PolarWebhookData;
}

export interface PolarWebhookData {
  id: string;
  created_at: string;
  modified_at?: string;
  metadata?: {
    user_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// =====================================================
// Order Types
// =====================================================

export interface PolarOrder {
  id: string;
  created_at: string;
  modified_at?: string;
  amount: number;
  tax_amount: number;
  currency: string;
  user_id?: string;
  product_id: string;
  product_price_id: string;
  subscription_id?: string;
  checkout_id: string;
  metadata?: {
    user_id?: string;
    package_id?: string;
    credits?: number;
    type?: string;
    [key: string]: unknown;
  };
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  product?: {
    id: string;
    name: string;
    description?: string;
  };
}

// =====================================================
// Subscription Types
// =====================================================

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export interface PolarSubscription {
  id: string;
  created_at: string;
  modified_at?: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  ended_at?: string;
  user_id?: string;
  product_id: string;
  product_price_id: string;
  checkout_id?: string;
  metadata?: {
    user_id?: string;
    plan_id?: string;
    [key: string]: unknown;
  };
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  product?: {
    id: string;
    name: string;
    description?: string;
  };
}

// =====================================================
// Credit Package Types
// =====================================================

export interface CreditPackage {
  id: string;
  productId: string;
  name: string;
  credits: number;
  price: number; // in KRW
  priceUSD: number; // in cents (USD)
  priceFormatted: string; // KRW formatted
  priceFormattedUSD: string; // USD formatted
  popular?: boolean;
  bonus?: number; // bonus percentage
  // Legacy compatibility
  variantId?: string;
}

// Feature key for i18n dynamic translation
export type FeatureKeyItem =
  | { key: string; params?: Record<string, number | string> };

export interface SubscriptionPlan {
  id: string;
  productId: string;
  name: string;
  price: number; // in KRW
  priceUSD: number; // in cents (USD)
  priceFormatted: string; // KRW formatted
  priceFormattedUSD: string; // USD formatted
  interval: "month" | "year";
  features: string[]; // Legacy: hardcoded text (kept for backward compatibility)
  featureKeys?: FeatureKeyItem[]; // i18n: translation keys with optional params
  popular?: boolean;
  monthlyCredits?: number; // Optional: for subscription-based credit grants
  // Plan-specific features
  storage?: string; // e.g., "1GB", "100GB"
  concurrentGenerations?: number;
  watermarkRemoved?: boolean;
  priority?: "standard" | "priority" | "highest";
  historyDays?: number | "unlimited";
  apiAccess?: boolean;
  teamMembers?: number;
  // Legacy compatibility
  variantId?: string;
}

// =====================================================
// Checkout Types
// =====================================================

export interface CheckoutOptions {
  productId: string;
  userId: string;
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
  successUrl?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  checkoutId?: string;
  expiresAt?: string;
}

// =====================================================
// Payment History Types
// =====================================================

export interface PaymentHistoryItem {
  id: string;
  orderId: string;
  productName: string | null;
  amount: number;
  currency: string;
  status: string;
  creditsGranted: number;
  createdAt: Date;
}

export interface SubscriptionInfo {
  id: string;
  planName: string | null;
  status: string;
  renewsAt: Date | null;
  endsAt: Date | null;
  isPaused: boolean;
}
