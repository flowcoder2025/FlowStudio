/**
 * Pricing Page
 * Contract: PAYMENT_DESIGN_PRICING
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Zap, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckoutModal } from "@/components/payment/CheckoutModal";
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from "@/lib/payment/config";
import type { CreditPackage, SubscriptionPlan } from "@/lib/payment/types";

type Tab = "credits" | "subscription";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Sparkles className="h-6 w-6" />,
  starter: <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  business: <Building2 className="h-6 w-6" />,
};

export default function PricingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("credits");
  const [selectedItem, setSelectedItem] = useState<{
    type: "credit_package" | "subscription";
    item: CreditPackage | SubscriptionPlan;
  } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedItem({ type: "credit_package", item: pkg });
    setIsCheckoutOpen(true);
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.id === "free") {
      // Free plan doesn't need checkout
      router.push("/settings");
      return;
    }
    setSelectedItem({ type: "subscription", item: plan });
    setIsCheckoutOpen(true);
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">가격 정책</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          필요에 맞는 플랜을 선택하세요. 크레딧 패키지로 필요한 만큼만 구매하거나,
          구독으로 매월 정기적인 크레딧을 받으세요.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border p-1 bg-muted/50">
          <button
            onClick={() => setActiveTab("credits")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "credits"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            크레딧 패키지
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "subscription"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            구독 플랜
          </button>
        </div>
      </div>

      {/* Credit Packages */}
      {activeTab === "credits" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.popular ? "border-primary shadow-lg" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    인기
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>
                  {pkg.credits.toLocaleString()} 크레딧
                  {pkg.bonus ? ` (+${pkg.bonus}% 보너스)` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{pkg.priceFormatted}</span>
                </div>
                <Button
                  onClick={() => handleSelectPackage(pkg)}
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                >
                  구매하기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subscription Plans */}
      {activeTab === "subscription" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    추천
                  </span>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {PLAN_ICONS[plan.id]}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>
                  월 {plan.monthlyCredits.toLocaleString()} 크레딧
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.priceFormatted}</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.id === "free" ? "현재 플랜" : "구독하기"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">크레딧은 어떻게 사용되나요?</h3>
            <p className="text-sm text-muted-foreground">
              이미지 생성 시 품질에 따라 1~5 크레딧이 차감됩니다.
              업스케일, 배경 제거 등 추가 기능에도 크레딧이 사용됩니다.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">미사용 크레딧은 이월되나요?</h3>
            <p className="text-sm text-muted-foreground">
              구독 플랜의 경우 미사용 크레딧은 다음 달로 이월됩니다.
              크레딧 패키지로 구매한 크레딧은 1년간 유효합니다.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">구독을 취소하면 어떻게 되나요?</h3>
            <p className="text-sm text-muted-foreground">
              구독 취소 시 남은 결제 기간까지 서비스를 이용할 수 있으며,
              남은 크레딧은 유효 기간 내에 사용 가능합니다.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">환불 정책은 어떻게 되나요?</h3>
            <p className="text-sm text-muted-foreground">
              구매 후 7일 이내, 크레딧을 사용하지 않은 경우 전액 환불이 가능합니다.
              자세한 내용은 환불 정책을 확인해 주세요.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        type={selectedItem?.type || "credit_package"}
        itemId={selectedItem?.item.id || ""}
        itemName={selectedItem?.item.name || ""}
        price={selectedItem?.item.price || 0}
        priceFormatted={selectedItem?.item.priceFormatted || ""}
      />
    </div>
  );
}
