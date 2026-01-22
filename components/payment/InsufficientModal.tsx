/**
 * Insufficient Credits Modal Component
 * Contract: PAYMENT_DESIGN_INSUFFICIENT
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { useRouter } from "next/navigation";
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
  action?: string; // e.g., "이미지 생성", "업스케일"
}

export function InsufficientModal({
  isOpen,
  onClose,
  currentBalance,
  requiredCredits,
  action = "이 작업",
}: InsufficientModalProps) {
  const router = useRouter();
  const shortage = requiredCredits - currentBalance;

  const handlePurchase = () => {
    onClose();
    router.push("/pricing");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            크레딧이 부족합니다
          </DialogTitle>
          <DialogDescription>
            {action}을 진행하려면 추가 크레딧이 필요합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Credit Status */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">현재 잔액</span>
              <span className="font-medium flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                {currentBalance.toLocaleString()} 크레딧
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">필요 크레딧</span>
              <span className="font-medium">
                {requiredCredits.toLocaleString()} 크레딧
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                부족한 크레딧
              </span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {shortage.toLocaleString()} 크레딧
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              추천 패키지
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {shortage <= 100
                ? "스타터 패키지 (100 크레딧)"
                : shortage <= 300
                ? "베이직 패키지 (300 크레딧 + 10% 보너스)"
                : "프로 패키지 (700 크레딧 + 17% 보너스)"}
              로 충전하시면 여유있게 사용하실 수 있습니다.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              나중에
            </Button>
            <Button
              onClick={handlePurchase}
              className="flex-1"
            >
              크레딧 구매하기
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
