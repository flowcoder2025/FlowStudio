/**
 * Pricing Page
 * Contract: PAYMENT_DESIGN_PRICING
 * Evidence: IMPLEMENTATION_PLAN.md Phase 9
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("pages.pricing");
  const tFeatures = useTranslations("payment.features");
  const tPackages = useTranslations("payment.packages");
  const tPlans = useTranslations("payment.plans");
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
                  <span className="text-4xl font-bold">{pkg.priceFormatted}</span>
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
                    {t("recommended")}
                  </span>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {PLAN_ICONS[plan.id]}
                  <CardTitle className="text-xl">{tPlans(plan.id)}</CardTitle>
                </div>
                <CardDescription>
                  {t("perMonth")} {plan.monthlyCredits.toLocaleString()} {t("credits")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.priceFormatted}</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm">
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
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.id === "free" ? t("currentPlan") : t("subscribe")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
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
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        type={selectedItem?.type || "credit_package"}
        itemId={selectedItem?.item.id || ""}
        itemName={
          selectedItem?.type === "credit_package"
            ? tPackages(selectedItem?.item.id || "")
            : tPlans(selectedItem?.item.id || "")
        }
        price={selectedItem?.item.price || 0}
        priceFormatted={selectedItem?.item.priceFormatted || ""}
      />
    </div>
  );
}
