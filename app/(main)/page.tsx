/**
 * Home Page - Industry Selection with Recommendations
 * Contract: INTEGRATION_DESIGN_WORKFLOW_HOME
 * Evidence: Phase 10 Page Integration
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, ArrowRight, Sparkles, TrendingUp, Clock } from "lucide-react";
import { getAllIndustries, IndustryInfo, Industry } from "@/lib/workflow/industries";
import { analyzeIntent } from "@/lib/workflow/intentAnalyzer";
import { useWorkflowStore } from "@/lib/workflow/store";
import { matchIntent } from "@/lib/workflow/intents";
import {
  generateRecommendations,
  quickRecommend,
  WorkflowRecommendation,
} from "@/lib/workflow/recommend";
import { RecommendCard, RecommendList } from "@/components/workflow/RecommendCard";
import { ImmersiveInputForm } from "@/components/workflow/ImmersiveInputForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpressionIntent } from "@/lib/workflow/intents";

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    industry: IndustryInfo | null;
    message: string;
  } | null>(null);
  const [searchRecommendations, setSearchRecommendations] = useState<WorkflowRecommendation[]>([]);
  const [popularRecommendations, setPopularRecommendations] = useState<WorkflowRecommendation[]>([]);

  // 통합 몰입형 상태 (AI 추천 + 입력 폼)
  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);
  const [immersiveRecommendations, setImmersiveRecommendations] = useState<WorkflowRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<WorkflowRecommendation | null>(null);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);

  // Zustand store
  const selectIndustry = useWorkflowStore((state) => state.selectIndustry);
  const selectIntent = useWorkflowStore((state) => state.selectIntent);
  const recentWorkflows = useWorkflowStore((state) => state.recentWorkflows);
  const setCurrentStep = useWorkflowStore((state) => state.setCurrentStep);

  const industries = useMemo(() => getAllIndustries(), []);

  // Load popular recommendations on mount (1회만 실행)
  useEffect(() => {
    // Get popular recommendations (mix from different industries)
    const industryList = getAllIndustries();
    const allRecommendations: WorkflowRecommendation[] = [];
    industryList.slice(0, 4).forEach((industry) => {
      const recs = quickRecommend(industry.id as Industry);
      allRecommendations.push(...recs.slice(0, 2));
    });
    setPopularRecommendations(allRecommendations.slice(0, 6));
  }, []);

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchRecommendations([]);
      setSuggestions(null);
      return;
    }

    const result = analyzeIntent(searchQuery);

    // Generate recommendations using matchIntent
    const intentResult = matchIntent(searchQuery);
    const recommendationResult = generateRecommendations(intentResult);

    // Collect all recommendations
    const allRecs = [
      ...(recommendationResult.primary ? [recommendationResult.primary] : []),
      ...recommendationResult.alternatives,
      ...recommendationResult.crossIndustry,
    ].filter(Boolean);

    if (result.suggestedIndustry) {
      const industryInfo = industries.find((i) => i.id === result.suggestedIndustry);
      setSuggestions({
        industry: industryInfo || null,
        message: `"${result.extractedKeywords.join(", ")}" 키워드를 찾았습니다`,
      });
    } else {
      setSuggestions({
        industry: null,
        message: "관련 업종을 찾지 못했습니다. 아래에서 직접 선택해주세요.",
      });
    }

    // Open immersive overlay if recommendations exist
    if (allRecs.length > 0) {
      setImmersiveRecommendations(allRecs);
      setSelectedRecommendation(allRecs[0]);
      setCurrentRecommendationIndex(0);
      selectIndustry(allRecs[0].industry);
      selectIntent(allRecs[0].intent);
      setIsImmersiveOpen(true);
    }

    // Also update the card list for fallback display
    setSearchRecommendations(allRecs.slice(0, 4));
  }, [searchQuery, industries, selectIndustry, selectIntent]);

  // Handle industry click
  const handleIndustryClick = useCallback(
    (industryId: string) => {
      if (status !== "authenticated") {
        router.push("/login?callbackUrl=/");
        return;
      }
      selectIndustry(industryId as Industry);
      setCurrentStep("action-select");
      router.push(`/workflow/${industryId}`);
    },
    [status, router, selectIndustry, setCurrentStep]
  );

  // Handle recommendation selection - 추천 변경 시 상태 업데이트
  const handleRecommendationSelect = useCallback(
    (recommendation: WorkflowRecommendation) => {
      if (status !== "authenticated") {
        router.push("/login?callbackUrl=/");
        return;
      }

      // 선택된 추천 업데이트 (모달은 닫지 않음 - 스와이프로 입력 폼으로 이동)
      selectIndustry(recommendation.industry);
      selectIntent(recommendation.intent);
      setSelectedRecommendation(recommendation);

      // 인덱스도 업데이트
      const newIndex = immersiveRecommendations.findIndex(
        (r) => r.industry === recommendation.industry && r.intent === recommendation.intent
      );
      if (newIndex >= 0) {
        setCurrentRecommendationIndex(newIndex);
      }
    },
    [status, router, selectIndustry, selectIntent, immersiveRecommendations]
  );

  // 입력 폼에서 생성 완료 시
  const handleInputFormGenerate = useCallback(
    (sessionId: string) => {
      setIsImmersiveOpen(false);
      setSelectedRecommendation(null);
      setImmersiveRecommendations([]);
      router.push(`/result?sessionId=${sessionId}`);
    },
    [router]
  );

  // 통합 모달 닫기
  const handleImmersiveClose = useCallback(() => {
    setIsImmersiveOpen(false);
    setSelectedRecommendation(null);
    setImmersiveRecommendations([]);
  }, []);

  // Handle recent workflow click
  const handleRecentClick = useCallback(
    (workflow: { industry: Industry; action: string }) => {
      if (status !== "authenticated") {
        router.push("/login?callbackUrl=/");
        return;
      }
      selectIndustry(workflow.industry);
      router.push(`/workflow/${workflow.industry}/${workflow.action}`);
    },
    [status, router, selectIndustry]
  );

  return (
    <>
      {/* 통합 몰입형 모달 - AI 추천 + 입력 폼 (스와이프로 이동 가능) */}
      {selectedRecommendation && (
        <ImmersiveInputForm
          isOpen={isImmersiveOpen}
          onClose={handleImmersiveClose}
          industry={selectedRecommendation.industry}
          intent={selectedRecommendation.intent as ExpressionIntent}
          onGenerate={handleInputFormGenerate}
          recommendations={immersiveRecommendations}
          onRecommendationSelect={handleRecommendationSelect}
          currentRecommendationIndex={currentRecommendationIndex}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            AI로 상품 이미지를 생성하세요
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            업종에 맞는 전문적인 상품 이미지를 AI가 만들어드립니다.
            원하는 업종을 선택하고 간단한 정보만 입력하면 완성!
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="어떤 이미지를 만들고 싶으신가요? (예: 티셔츠 모델 착용샷)"
              className="w-full px-5 py-4 pr-12 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Search Suggestions */}
          {suggestions && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{suggestions.message}</p>
              {suggestions.industry && (
                <button
                  onClick={() => handleIndustryClick(suggestions.industry!.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <span>{suggestions.industry.icon}</span>
                  <span>{suggestions.industry.nameKo}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Recommendations */}
        {searchRecommendations.length > 0 && (
          <div className="mb-12">
            <RecommendList
              recommendations={searchRecommendations}
              title="검색 결과 추천"
              onSelect={handleRecommendationSelect}
            />
          </div>
        )}

        {/* Recent Workflows (if user has history) */}
        {recentWorkflows.length > 0 && (
          <Card className="mb-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">최근 작업</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentWorkflows.slice(0, 5).map((workflow, index) => {
                  const industryInfo = industries.find((i) => i.id === workflow.industry);
                  return (
                    <button
                      key={index}
                      onClick={() => handleRecentClick(workflow)}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <span>{industryInfo?.icon}</span>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {industryInfo?.nameKo} - {workflow.action}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Popular Recommendations */}
        {popularRecommendations.length > 0 && !searchRecommendations.length && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">인기 워크플로우</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularRecommendations.map((rec, index) => (
                <RecommendCard
                  key={`${rec.industry}-${rec.intent}-${index}`}
                  recommendation={rec}
                  variant={index === 0 ? "featured" : "default"}
                  showScore={false}
                  onSelect={handleRecommendationSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Industry Grid */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">업종별 시작하기</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => handleIndustryClick(industry.id)}
                className="group p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg dark:hover:shadow-zinc-900/50 transition-all text-left"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: `${industry.color}20` }}
                >
                  {industry.icon}
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {industry.nameKo}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{industry.description}</p>
                <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm">시작하기</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center">
          <div className="inline-flex items-center gap-8 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span>이미지 1장당 5크레딧</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>4K 고화질 지원</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>상업적 사용 가능</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
