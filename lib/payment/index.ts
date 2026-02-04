/**
 * Payment Service Exports
 * Contract: PAYMENT_FUNC_WEBHOOK, PAYMENT_FUNC_CHECKOUT, PAYMENT_FUNC_SUBSCRIPTION, PAYMENT_FUNC_HISTORY
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 *
 * Payment Provider: Polar (https://polar.sh)
 */

// Types
export * from "./types";

// Configuration
export {
  POLAR_CONFIG,
  CREDIT_PACKAGES,
  SUBSCRIPTION_PLANS,
  CREDIT_COSTS,
  CREDIT_VALIDITY,
  getPackageByProductId,
  getPlanByProductId,
  getCreditsForPackage,
  // Legacy compatibility
  getPackageByVariantId,
  getPlanByVariantId,
} from "./config";

// Webhook
export {
  handleWebhook,
  verifyWebhookSignature,
} from "./webhook";

// Checkout
export {
  createCheckout,
  createCreditPackageCheckout,
  createSubscriptionCheckout,
  getCreditPackages,
  getSubscriptionPlans,
  getCreditPackageById,
  getSubscriptionPlanById,
} from "./checkout";

// Subscription
export {
  getUserSubscription,
  getUserPlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  changeSubscriptionPlan,
  getCustomerPortalUrl,
  getUpdatePaymentMethodUrl,
  hasActiveSubscription,
  getSubscriptionHistory,
} from "./subscription";

// History
export {
  getPaymentHistory,
  getPaymentById,
  getPaymentByOrderId,
  getBillingSummary,
  getInvoiceData,
  getPaymentStats,
} from "./history";
