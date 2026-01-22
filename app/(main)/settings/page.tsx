/**
 * Settings Page
 * Contract: USER_DESIGN_SETTINGS
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, CreditCard, Building2, Users, Loader2, Check } from "lucide-react";
import { formatNumber } from "@/lib/utils";

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
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "credits" | "business" | "referral">("profile");

  // Profile form state
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Business verification state
  const [businessNumber, setBusinessNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Referral state
  const [referralInput, setReferralInput] = useState("");
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

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

  const handleVerifyBusiness = async () => {
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const response = await fetch("/api/user/business/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setProfile((prev) => prev ? { ...prev, businessVerified: true } : null);
        setBusinessNumber("");
      } else {
        setVerifyError(data.error || "인증에 실패했습니다");
      }
    } catch (error) {
      setVerifyError("인증 중 오류가 발생했습니다");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApplyReferral = async () => {
    setIsApplyingReferral(true);
    setReferralError(null);

    try {
      const response = await fetch("/api/user/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralInput }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReferralInput("");
        fetchProfile(); // Refresh to get updated credits
      } else {
        setReferralError(data.error || "추천 코드 적용에 실패했습니다");
      }
    } catch (error) {
      setReferralError("추천 코드 적용 중 오류가 발생했습니다");
    } finally {
      setIsApplyingReferral(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
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
    { id: "profile" as const, label: "프로필", icon: User },
    { id: "credits" as const, label: "크레딧", icon: CreditCard },
    { id: "business" as const, label: "사업자 인증", icon: Building2 },
    { id: "referral" as const, label: "추천인", icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">설정</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs */}
        <nav className="md:w-48 flex md:flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">프로필 정보</h2>

              <div className="flex items-center gap-4">
                {profile?.image ? (
                  <img
                    src={profile.image}
                    alt="프로필"
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{profile?.name || "이름 없음"}</p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                {saveSuccess ? "저장됨" : "저장"}
              </button>
            </div>
          )}

          {/* Credits Tab */}
          {activeTab === "credits" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">크레딧</h2>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <p className="text-sm text-amber-600 mb-1">보유 크레딧</p>
                <p className="text-3xl font-bold text-amber-700">
                  {formatNumber(profile?.creditBalance ?? 0)}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                크레딧은 이미지 생성에 사용됩니다. 1장당 5 크레딧이 필요합니다.
              </p>
            </div>
          )}

          {/* Business Tab */}
          {activeTab === "business" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">사업자 인증</h2>

              {profile?.businessVerified ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">인증 완료</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    사업자 인증이 완료되었습니다.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    사업자 인증을 완료하면 추가 혜택을 받을 수 있습니다.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업자등록번호
                    </label>
                    <input
                      type="text"
                      value={businessNumber}
                      onChange={(e) => setBusinessNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="숫자 10자리"
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {verifyError && (
                      <p className="text-sm text-red-600 mt-1">{verifyError}</p>
                    )}
                  </div>

                  <button
                    onClick={handleVerifyBusiness}
                    disabled={isVerifying || businessNumber.length !== 10}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                    인증하기
                  </button>
                </>
              )}
            </div>
          )}

          {/* Referral Tab */}
          {activeTab === "referral" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">추천인 시스템</h2>

              {/* My Referral Code */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">내 추천 코드</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded font-mono text-sm">
                    {profile?.referralCode}
                  </code>
                  <button
                    onClick={copyReferralCode}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
                  >
                    복사
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  친구에게 추천 코드를 공유하면 양쪽 모두 5 크레딧을 받습니다.
                </p>
              </div>

              {/* Apply Referral Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추천 코드 입력
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    placeholder="추천 코드를 입력하세요"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={handleApplyReferral}
                    disabled={isApplyingReferral || !referralInput}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isApplyingReferral ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "적용"
                    )}
                  </button>
                </div>
                {referralError && (
                  <p className="text-sm text-red-600 mt-1">{referralError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
