/**
 * Payment Success Page
 * Contract: PAYMENT_DESIGN_SUCCESS
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);

  useEffect(() => {
    // Verify payment status (optional: could poll for webhook completion)
    const verifyPayment = async () => {
      // Small delay to allow webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        // Get current balance to show updated credits
        const response = await fetch("/api/credits/balance");
        if (response.ok) {
          const data = await response.json();
          // We can't know exact credits added without order ID,
          // but we can show the current balance
          setCreditsAdded(data.balance);
        }
      } catch {
        // Ignore errors - just show success
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="container max-w-lg mx-auto py-16 px-4">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">결제가 완료되었습니다!</CardTitle>
          <CardDescription>
            구매해 주셔서 감사합니다. 크레딧이 계정에 추가되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isVerifying ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>결제 확인 중...</span>
            </div>
          ) : (
            creditsAdded !== null && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>현재 잔액: </span>
                  <span className="font-bold text-primary">
                    {creditsAdded.toLocaleString()} 크레딧
                  </span>
                </div>
              </div>
            )
          )}

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                이미지 생성하기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/settings">
                설정으로 이동
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            결제 영수증은 등록된 이메일로 전송됩니다.
            문의사항이 있으시면 고객센터로 연락해 주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentSuccessLoading() {
  return (
    <div className="container max-w-lg mx-auto py-16 px-4">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">로딩 중...</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
