/**
 * Payment Types
 * Contract: PAYMENT_FUNC_WEBHOOK, PAYMENT_FUNC_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

// =====================================================
// LemonSqueezy Webhook Event Types
// =====================================================

export type WebhookEventName =
  | "order_created"
  | "order_refunded"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_recovered";

export interface WebhookMeta {
  event_name: WebhookEventName;
  custom_data?: {
    user_id?: string;
    [key: string]: unknown;
  };
  test_mode: boolean;
}

export interface WebhookPayload {
  meta: WebhookMeta;
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
    relationships?: Record<string, unknown>;
  };
}

// =====================================================
// Order Types
// =====================================================

export interface OrderAttributes {
  store_id: number;
  customer_id: number;
  identifier: string;
  order_number: number;
  user_name: string;
  user_email: string;
  currency: string;
  currency_rate: string;
  subtotal: number;
  discount_total: number;
  tax: number;
  total: number;
  subtotal_usd: number;
  discount_total_usd: number;
  tax_usd: number;
  total_usd: number;
  tax_name: string | null;
  tax_rate: string | null;
  status: "pending" | "paid" | "refunded" | "failed";
  status_formatted: string;
  refunded: boolean;
  refunded_at: string | null;
  first_order_item: {
    id: number;
    order_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    price: number;
    quantity: number;
    created_at: string;
    updated_at: string;
    test_mode: boolean;
  };
  created_at: string;
  updated_at: string;
}

// =====================================================
// Subscription Types
// =====================================================

export type SubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export interface SubscriptionAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status: SubscriptionStatus;
  status_formatted: string;
  card_brand: string | null;
  card_last_four: string | null;
  pause: {
    mode: "void" | "free" | null;
    resumes_at: string | null;
  } | null;
  cancelled: boolean;
  trial_ends_at: string | null;
  billing_anchor: number;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

// =====================================================
// Credit Package Types
// =====================================================

export interface CreditPackage {
  id: string;
  variantId: string;
  name: string;
  credits: number;
  price: number; // in cents
  priceFormatted: string;
  popular?: boolean;
  bonus?: number; // bonus percentage
}

// Feature key for i18n dynamic translation
export type FeatureKeyItem =
  | { key: string; params?: Record<string, number | string> };

export interface SubscriptionPlan {
  id: string;
  variantId: string;
  name: string;
  monthlyCredits: number;
  price: number; // in cents
  priceFormatted: string;
  interval: "month" | "year";
  features: string[]; // Legacy: hardcoded text (kept for backward compatibility)
  featureKeys?: FeatureKeyItem[]; // i18n: translation keys with optional params
  popular?: boolean;
}

// =====================================================
// Checkout Types
// =====================================================

export interface CheckoutOptions {
  variantId: string;
  userId: string;
  email?: string;
  name?: string;
  customData?: Record<string, unknown>;
  redirectUrl?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
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
