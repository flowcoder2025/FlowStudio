/**
 * Pricing Page
 * Contract: PAYMENT_DESIGN_PRICING
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
import {
  CREDIT_PACKAGES,
  SUBSCRIPTION_PLANS,
  getYearlyPlanMonthlyPrice,
} from "@/lib/payment/config";
import type { CreditPackage, SubscriptionPlan } from "@/lib/payment/types";

type Tab = "credits" | "subscription";
type BillingInterval = "month" | "year";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Sparkles className="h-6 w-6" />,
  plus: <Zap className="h-6 w-6" />,
  "plus-yearly": <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  "pro-yearly": <Crown className="h-6 w-6" />,
  business: <Building2 className="h-6 w-6" />,
  "business-yearly": <Building2 className="h-6 w-6" />,
};

// 플랜 ID에서 베이스 ID 추출 (연간 플랜용)
function getBasePlanId(planId: string): string {
  return planId.replace("-yearly", "");
}

export default function PricingPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("pages.pricing");
  const tFeatures = useTranslations("payment.features");
  const tPackages = useTranslations("payment.packages");
  const tPlans = useTranslations("payment.plans");
  const [activeTab, setActiveTab] = useState<Tab>("credits");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [selectedItem, setSelectedItem] = useState<{
    type: "credit_package" | "subscription";
    item: CreditPackage | SubscriptionPlan;
  } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // 선택된 결제 주기에 따라 플랜 필터링
  const filteredPlans = useMemo(() => {
    return SUBSCRIPTION_PLANS.filter(
      (plan) => plan.interval === billingInterval || plan.id === "free"
    );
  }, [billingInterval]);

  // Get price based on locale
  const getPackagePrice = (pkg: CreditPackage) => {
    return locale === "ko" ? pkg.priceFormatted : pkg.priceFormattedUSD;
  };

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) {
      return locale === "ko" ? "무료" : "Free";
    }
    return locale === "ko" ? plan.priceFormatted : plan.priceFormattedUSD;
  };

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
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("subtitle")}
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
            {t("creditPackages")}
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "subscription"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("subscriptionPlans")}
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
                    {t("popular")}
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{tPackages(pkg.id)}</CardTitle>
                <CardDescription>
                  {pkg.credits.toLocaleString()} {t("credits")}
                  {pkg.bonus ? ` ${t("bonus", { bonus: pkg.bonus })}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{getPackagePrice(pkg)}</span>
                </div>
                <Button
                  onClick={() => handleSelectPackage(pkg)}
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                >
                  {t("purchase")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subscription Plans */}
      {activeTab === "subscription" && (
        <>
          {/* 월간/연간 토글 */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border p-1 bg-muted/50">
              <button
                onClick={() => setBillingInterval("month")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("monthly")}
              </button>
              <button
                onClick={() => setBillingInterval("year")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingInterval === "year"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("yearly")}
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  -17%
                </span>
              </button>
            </div>
          </div>

          {/* 연간 결제 혜택 안내 */}
          {billingInterval === "year" && (
            <p className="text-center text-sm text-muted-foreground mb-6">
              {t("yearlyDiscount")}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    {t("recommended")}
                  </span>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {PLAN_ICONS[plan.id]}
                  <CardTitle className="text-xl">{tPlans(getBasePlanId(plan.id))}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="mb-6">
                  {plan.interval === "year" && plan.price > 0 ? (
                    <>
                      {/* 연간 플랜: 월별 환산 가격 표시 */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          {locale === "ko"
                            ? getYearlyPlanMonthlyPrice(plan).monthlyFormatted
                            : getYearlyPlanMonthlyPrice(plan).monthlyFormattedUSD}
                        </span>
                        <span className="text-muted-foreground text-sm">{t("perMonth")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("billedYearly")}: {getPlanPrice(plan)}{t("perYear")}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{getPlanPrice(plan)}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">{t("perMonth")}</span>
                      )}
                    </>
                  )}
                </div>
                <ul className="space-y-3 mb-6 text-sm flex-1">
                  {(plan.featureKeys || []).map((featureKey, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>
                        {featureKey.params
                          ? tFeatures(featureKey.key, featureKey.params)
                          : tFeatures(featureKey.key)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className="w-full mt-auto"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.id === "free" ? t("currentPlan") : t("subscribe")}
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">{t("faq.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">{t("faq.q1")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("faq.a1")}
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">{t("faq.q2")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("faq.a2")}
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">{t("faq.q3")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("faq.a3")}
            </p>
          </div>
          <div className="p-6 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">{t("faq.q4")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("faq.a4")}
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedItem && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          type={selectedItem.type}
          itemId={selectedItem.item.id}
          itemName={
            selectedItem.type === "credit_package"
              ? tPackages(selectedItem.item.id)
              : tPlans(getBasePlanId(selectedItem.item.id))
          }
          price={locale === "ko" ? selectedItem.item.price : selectedItem.item.priceUSD}
          priceFormatted={
            locale === "ko"
              ? selectedItem.item.priceFormatted
              : selectedItem.item.priceFormattedUSD
          }
        />
      )}
    </div>
  );
}
