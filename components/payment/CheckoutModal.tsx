/**
 * Checkout Modal Component
 * Contract: PAYMENT_DESIGN_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CreditCard, Shield, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "credit_package" | "subscription";
  itemId: string;
  itemName: string;
  price: number;
  priceFormatted: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  type,
  itemId,
  itemName,
  priceFormatted,
}: CheckoutModalProps) {
  const t = useTranslations("payment.checkout");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, itemId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("error"));
      }

      const { checkoutUrl } = await response.json();

      // Redirect to LemonSqueezy checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {type === "subscription" ? t("subscription") : t("creditPurchase")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-medium mb-2">{t("orderSummary")}</h3>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{itemName}</span>
              <span className="font-semibold">{priceFormatted}</span>
            </div>
            {type === "subscription" && (
              <p className="text-xs text-muted-foreground mt-2">
                {t("monthlyAutoPayment")}
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 shrink-0 text-green-500" />
            <p>{t("securityNotice")}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCheckout}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                <>{t("pay")}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
