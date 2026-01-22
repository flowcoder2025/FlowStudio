/**
 * Similar Workflows Component - 크로스 인더스트리 추천 UI
 * Contract: Phase 8 UI Components
 * Evidence: HANDOFF_2026-01-21_P7.md
 */

"use client";

import { useState, useMemo } from "react";
import {
  Shuffle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WorkflowRecommendation } from "@/lib/workflow/recommend";
import { Industry, INDUSTRY_INFO } from "@/lib/workflow/industries";
import { EXPRESSION_INTENT_INFO, ExpressionIntent } from "@/lib/workflow/intents";

// ============================================================
// 타입 정의
// ============================================================

export interface SimilarWorkflowsProps {
  currentIndustry: Industry;
  currentIntent: ExpressionIntent;
  recommendations: WorkflowRecommendation[];
  onSelect?: (recommendation: WorkflowRecommendation) => void;
  title?: string;
  showReason?: boolean;
  maxItems?: number;
  className?: string;
}

interface WorkflowCardProps {
  recommendation: WorkflowRecommendation;
  isCurrentIndustry: boolean;
  showReason: boolean;
  onSelect?: () => void;
}

// ============================================================
// 워크플로우 카드 컴포넌트
// ============================================================

function WorkflowCard({
  recommendation,
  isCurrentIndustry,
  showReason,
  onSelect,
}: WorkflowCardProps) {
  const industryInfo = INDUSTRY_INFO[recommendation.industry];
  const intentInfo = EXPRESSION_INTENT_INFO[recommendation.intent];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex-shrink-0 w-64 p-4 rounded-xl border cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary-300",
        isCurrentIndustry
          ? "bg-gray-50 border-gray-200"
          : "bg-gradient-to-br from-primary-50 to-white border-primary-100"
      )}
    >
      {/* 업종 배지 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{industryInfo?.icon}</span>
          <span className="text-sm text-gray-600">
            {industryInfo?.nameKo || recommendation.industry}
          </span>
        </div>
        {!isCurrentIndustry && (
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
            다른 업종
          </span>
        )}
      </div>

      {/* 의도 */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">
        {intentInfo?.nameKo || recommendation.intent}
      </h4>

      {/* 추천 이유 */}
      {showReason && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {recommendation.reason}
        </p>
      )}

      {/* 태그 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {recommendation.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* 매칭 스코어 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <TrendingUp className="w-3 h-3" />
          <span>{Math.round(recommendation.score * 100)}% 유사</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function SimilarWorkflows({
  currentIndustry,
  currentIntent,
  recommendations,
  onSelect,
  title = "비슷한 워크플로우",
  showReason = true,
  maxItems = 10,
  className,
}: SimilarWorkflowsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  // 현재 업종과 다른 업종 분리
  const { sameIndustry, crossIndustry } = useMemo(() => {
    const filtered = recommendations.slice(0, maxItems);
    return {
      sameIndustry: filtered.filter((r) => r.industry === currentIndustry),
      crossIndustry: filtered.filter((r) => r.industry !== currentIndustry),
    };
  }, [recommendations, currentIndustry, maxItems]);

  // 스크롤 핸들러
  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("similar-workflows-container");
    if (!container) return;

    const scrollAmount = 280; // 카드 너비 + 간격
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: "smooth" });
    setScrollPosition(newPosition);
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-primary-500" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>

          {/* 스크롤 버튼 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleScroll("left")}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleScroll("right")}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 크로스 인더스트리 힌트 */}
        {crossIndustry.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
            <Lightbulb className="w-4 h-4" />
            <span>
              다른 업종에서 영감을 얻어보세요! {crossIndustry.length}개의 유사한
              워크플로우가 있습니다.
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        {/* 가로 스크롤 컨테이너 */}
        <div
          id="similar-workflows-container"
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* 크로스 인더스트리 먼저 */}
          {crossIndustry.map((rec) => (
            <WorkflowCard
              key={`${rec.industry}-${rec.intent}`}
              recommendation={rec}
              isCurrentIndustry={false}
              showReason={showReason}
              onSelect={() => onSelect?.(rec)}
            />
          ))}

          {/* 같은 업종 */}
          {sameIndustry.map((rec) => (
            <WorkflowCard
              key={`${rec.industry}-${rec.intent}`}
              recommendation={rec}
              isCurrentIndustry={true}
              showReason={showReason}
              onSelect={() => onSelect?.(rec)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 컴팩트 크로스 인더스트리 리스트
// ============================================================

export interface CrossIndustryListProps {
  recommendations: WorkflowRecommendation[];
  currentIndustry: Industry;
  onSelect?: (recommendation: WorkflowRecommendation) => void;
  className?: string;
}

export function CrossIndustryList({
  recommendations,
  currentIndustry,
  onSelect,
  className,
}: CrossIndustryListProps) {
  const crossIndustry = useMemo(
    () => recommendations.filter((r) => r.industry !== currentIndustry).slice(0, 5),
    [recommendations, currentIndustry]
  );

  if (crossIndustry.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Shuffle className="w-4 h-4 text-primary-500" />
        <span>다른 업종에서 영감 얻기</span>
      </div>

      <div className="space-y-1.5">
        {crossIndustry.map((rec) => {
          const industryInfo = INDUSTRY_INFO[rec.industry];
          const intentInfo = EXPRESSION_INTENT_INFO[rec.intent];

          return (
            <button
              key={`${rec.industry}-${rec.intent}`}
              onClick={() => onSelect?.(rec)}
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-lg text-left",
                "border border-transparent hover:border-primary-200 hover:bg-primary-50",
                "transition-all"
              )}
            >
              <span className="text-lg">{industryInfo?.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {intentInfo?.nameKo || rec.intent}
                </p>
                <p className="text-xs text-gray-500">
                  {industryInfo?.nameKo} • {Math.round(rec.score * 100)}% 유사
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 인더스트리 네비게이션
// ============================================================

export interface IndustryNavigationProps {
  currentIndustry: Industry;
  industries: Industry[];
  onSelect: (industry: Industry) => void;
  className?: string;
}

export function IndustryNavigation({
  currentIndustry,
  industries,
  onSelect,
  className,
}: IndustryNavigationProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {industries.map((industry) => {
        const info = INDUSTRY_INFO[industry];
        const isActive = industry === currentIndustry;

        return (
          <button
            key={industry}
            onClick={() => onSelect(industry)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
              "border text-sm",
              isActive
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50"
            )}
          >
            <span>{info?.icon}</span>
            <span>{info?.nameKo || industry}</span>
          </button>
        );
      })}
    </div>
  );
}
