/**
 * Checkout Modal Component
 * Contract: PAYMENT_DESIGN_CHECKOUT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        throw new Error(data.error || "결제 세션 생성에 실패했습니다");
      }

      const { checkoutUrl } = await response.json();

      // Redirect to LemonSqueezy checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            결제 확인
          </DialogTitle>
          <DialogDescription>
            {type === "subscription" ? "구독을 시작합니다" : "크레딧을 구매합니다"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-medium mb-2">주문 내역</h3>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{itemName}</span>
              <span className="font-semibold">{priceFormatted}</span>
            </div>
            {type === "subscription" && (
              <p className="text-xs text-muted-foreground mt-2">
                매월 자동 결제됩니다. 언제든지 취소할 수 있습니다.
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 shrink-0 text-green-500" />
            <p>
              결제는 LemonSqueezy를 통해 안전하게 처리됩니다.
              카드 정보는 당사 서버에 저장되지 않습니다.
            </p>
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
              취소
            </Button>
            <Button
              onClick={handleCheckout}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>결제하기</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
