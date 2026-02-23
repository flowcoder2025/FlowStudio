/**
 * Settings Page
 * Contract: USER_DESIGN_SETTINGS
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { User, CreditCard, Receipt, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  creditBalance: number;
  businessVerified: boolean;
  referralCode: string;
}

interface CreditBalance {
  balance: number;
  pendingHolds: number;
  availableBalance: number;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface PaymentRecord {
  id: string;
  orderId: string;
  productName: string;
  amount: number;
  currency: string;
  status: string;
  creditsGranted: number;
  createdAt: string;
}

interface SubscriptionInfo {
  subscription: {
    id: string;
    tier: string;
    status: string;
    startDate: string;
    endDate: string | null;
    cancelledAt: string | null;
    paymentProvider: string | null;
    externalId: string | null;
  } | null;
  plan: {
    tier: string;
    storageQuotaGB: number;
    concurrentLimit: number;
    watermarkFree: boolean;
    priorityQueue: boolean;
  };
}

type TabId = "profile" | "credits" | "billing";

const CREDIT_TYPE_COLORS: Record<string, string> = {
  PURCHASE: "text-green-600 dark:text-green-400",
  BONUS: "text-blue-600 dark:text-blue-400",
  USAGE: "text-red-600 dark:text-red-400",
  REFUND: "text-amber-600 dark:text-amber-400",
  REFERRAL: "text-purple-600 dark:text-purple-400",
  EXPIRY: "text-zinc-500 dark:text-zinc-400",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  REFUNDED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile form state
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Credit history state
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [creditHistoryTotal, setCreditHistoryTotal] = useState(0);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);
  const [showAllCredits, setShowAllCredits] = useState(false);

  // Billing state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [profileRes, creditRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/credits/balance"),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setName(data.name || "");
      }
      if (creditRes.ok) {
        const data = await creditRes.json();
        setCreditBalance(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreditHistory = useCallback(async () => {
    if (creditHistory.length > 0) return;
    setCreditHistoryLoading(true);
    try {
      const res = await fetch("/api/credits/history?limit=50");
      if (res.ok) {
        const data = await res.json();
        setCreditHistory(data.transactions);
        setCreditHistoryTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch credit history:", error);
    } finally {
      setCreditHistoryLoading(false);
    }
  }, [creditHistory.length]);

  const fetchBillingData = useCallback(async () => {
    if (payments.length > 0) return;
    setPaymentsLoading(true);
    try {
      const [paymentRes, subRes] = await Promise.all([
        fetch("/api/payment/history?limit=50"),
        fetch("/api/payment/subscription"),
      ]);
      if (paymentRes.ok) {
        const data = await paymentRes.json();
        setPayments(data.payments || []);
        setPaymentsTotal(data.total || 0);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setPaymentsLoading(false);
    }
  }, [payments.length]);

  useEffect(() => {
    if (activeTab === "credits") fetchCreditHistory();
    if (activeTab === "billing") fetchBillingData();
  }, [activeTab, fetchCreditHistory, fetchBillingData]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as const, labelKey: "profile" as const, icon: User },
    { id: "credits" as const, labelKey: "credits" as const, icon: CreditCard },
    { id: "billing" as const, labelKey: "billing" as const, icon: Receipt },
  ];

  const INITIAL_DISPLAY_COUNT = 5;
  const visibleCredits = showAllCredits ? creditHistory : creditHistory.slice(0, INITIAL_DISPLAY_COUNT);
  const visiblePayments = showAllPayments ? payments : payments.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">{t("title")}</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs */}
        <nav className="md:w-48 flex md:flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden md:inline">{t(`tabs.${tab.labelKey}`)}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("profile.title")}</h2>

              <div className="flex items-center gap-4">
                {profile?.image ? (
                  <img
                    src={profile.image}
                    alt={t("profile.profileImage")}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <User className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{profile?.name || t("profile.noName")}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t("profile.name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : null}
                {saveSuccess ? t("profile.saved") : t("profile.save")}
              </button>
            </div>
          )}

          {/* Credits Tab */}
          {activeTab === "credits" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("credits.title")}</h2>

              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">{t("credits.availableBalance")}</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {formatNumber(creditBalance?.availableBalance ?? 0)}
                </p>
                {(creditBalance?.pendingHolds ?? 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700 flex justify-between text-sm">
                    <span className="text-amber-600 dark:text-amber-400">{t("credits.totalBalance")}</span>
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      {formatNumber(creditBalance?.balance ?? 0)}
                    </span>
                  </div>
                )}
                {(creditBalance?.pendingHolds ?? 0) > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-amber-600 dark:text-amber-400">{t("credits.pendingHolds")}</span>
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      -{formatNumber(creditBalance?.pendingHolds ?? 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Credit History */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  {t("credits.history")}
                </h3>
                {creditHistoryLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  </div>
                ) : creditHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
                    {t("credits.noHistory")}
                  </p>
                ) : (
                  <>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {visibleCredits.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {tx.description || tx.type}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                          <span className={`text-sm font-semibold tabular-nums ml-4 ${
                            CREDIT_TYPE_COLORS[tx.type] || "text-zinc-900 dark:text-zinc-100"
                          }`}>
                            {tx.amount > 0 ? "+" : ""}{formatNumber(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {creditHistory.length > INITIAL_DISPLAY_COUNT && (
                      <button
                        onClick={() => setShowAllCredits(!showAllCredits)}
                        className="flex items-center gap-1 mx-auto mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {showAllCredits ? (
                          <>
                            {t("credits.showLess")}
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            {t("credits.showAll", { count: creditHistoryTotal })}
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("credits.description")}
              </p>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t("billing.title")}</h2>

              {/* Subscription Info */}
              {subscription && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                    {t("billing.currentPlan")}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {subscription.plan.tier}
                      </p>
                      {subscription.subscription && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {t("billing.since", { date: formatDate(subscription.subscription.startDate) })}
                          {subscription.subscription.status !== "ACTIVE" && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                              {subscription.subscription.status}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                      <p>{t("billing.storage")}: {subscription.plan.storageQuotaGB} GB</p>
                      <p>{t("billing.concurrent")}: {subscription.plan.concurrentLimit}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  {t("billing.paymentHistory")}
                </h3>
                {paymentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
                    {t("billing.noPayments")}
                  </p>
                ) : (
                  <>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {visiblePayments.map((p) => {
                        const isRefund = p.status === "refunded";
                        return (
                          <div key={p.id} className="flex items-center justify-between py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {p.productName}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {formatDate(p.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              {isRefund && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                  {t("billing.refunded")}
                                </span>
                              )}
                              <span className={`text-sm font-semibold tabular-nums ${
                                isRefund
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}>
                                {isRefund ? "" : "+"}{formatNumber(p.creditsGranted)} credits
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {payments.length > INITIAL_DISPLAY_COUNT && (
                      <button
                        onClick={() => setShowAllPayments(!showAllPayments)}
                        className="flex items-center gap-1 mx-auto mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {showAllPayments ? (
                          <>
                            {t("billing.showLess")}
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            {t("billing.showAll", { count: paymentsTotal })}
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
