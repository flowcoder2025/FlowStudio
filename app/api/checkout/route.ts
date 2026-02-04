/**
 * Polar Checkout API Route
 * Contract: PAYMENT_FUNC_CHECKOUT
 * Evidence: Polar Next.js SDK Documentation
 *
 * This route uses the official Polar Next.js SDK adapter pattern.
 * Query parameters:
 * - productId: Polar product ID (required)
 * - customerId: Optional customer ID
 * - customerEmail: Optional customer email
 * - customerName: Optional customer name
 * - metadata: Optional JSON string of metadata
 */

import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: process.env.POLAR_SUCCESS_URL || "http://localhost:3000/payment/success?checkout_id={CHECKOUT_ID}",
  server: process.env.POLAR_ENVIRONMENT === "production" ? "production" : "sandbox",
});
