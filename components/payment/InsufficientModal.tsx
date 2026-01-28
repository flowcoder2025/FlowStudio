/**
 * Insufficient Credits Modal Component
 * Contract: PAYMENT_DESIGN_INSUFFICIENT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CreditCard, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InsufficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  requiredCredits: number;
  action?: string; // e.g., "image generation", "upscale"
}

export function InsufficientModal({
  isOpen,
  onClose,
  currentBalance,
  requiredCredits,
  action,
}: InsufficientModalProps) {
  const t = useTranslations("payment.insufficient");
  const router = useRouter();
  const shortage = requiredCredits - currentBalance;
  const actionText = action || t("defaultAction");

  const handlePurchase = () => {
    onClose();
    router.push("/pricing");
  };

  const getRecommendedPackage = () => {
    if (shortage <= 100) return t("starterRecommend");
    if (shortage <= 300) return t("basicRecommend");
    return t("proRecommend");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", { action: actionText })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Credit Status */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">{t("currentBalance")}</span>
              <span className="font-medium flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                {currentBalance.toLocaleString()} {t("credits")}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">{t("requiredCredits")}</span>
              <span className="font-medium">
                {requiredCredits.toLocaleString()} {t("credits")}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                {t("shortage")}
              </span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {shortage.toLocaleString()} {t("credits")}
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("recommendedPackage")}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {getRecommendedPackage()} {t("rechargeMessage")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t("later")}
            </Button>
            <Button
              onClick={handlePurchase}
              className="flex-1"
            >
              {t("purchaseCredits")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for insufficient credits check
 */
export function useInsufficientCredits() {
  const checkCredits = async (
    requiredCredits: number
  ): Promise<{ sufficient: boolean; balance: number }> => {
    try {
      const response = await fetch("/api/credits/balance");
      if (!response.ok) {
        throw new Error("Failed to check balance");
      }
      const data = await response.json();
      return {
        sufficient: data.availableBalance >= requiredCredits,
        balance: data.availableBalance,
      };
    } catch {
      return { sufficient: false, balance: 0 };
    }
  };

  return { checkCredits };
}
