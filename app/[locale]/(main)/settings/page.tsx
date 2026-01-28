/**
 * Settings Page
 * Contract: USER_DESIGN_SETTINGS
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, CreditCard, Loader2, Check } from "lucide-react";
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

export default function SettingsPage() {
  const t = useTranslations("settings");
  useSession(); // Ensure authentication context
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "credits">("profile");

  // Profile form state
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name || "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
  ];

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
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">{t("credits.balance")}</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {formatNumber(profile?.creditBalance ?? 0)}
                </p>
              </div>

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("credits.description")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
