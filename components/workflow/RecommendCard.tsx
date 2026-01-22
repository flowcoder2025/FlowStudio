/**
 * Recommend Card Component - 추천 카드 UI
 * Contract: Phase 8 UI Components
 * Evidence: HANDOFF_2026-01-21_P7.md
 */

"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Star, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WorkflowRecommendation } from "@/lib/workflow/recommend";
import { INDUSTRY_INFO } from "@/lib/workflow/industries";
import { EXPRESSION_INTENT_INFO } from "@/lib/workflow/intents";

// ============================================================
// 타입 정의
// ============================================================

export interface RecommendCardProps {
  recommendation: WorkflowRecommendation;
  variant?: "default" | "compact" | "featured";
  showScore?: boolean;
  showTags?: boolean;
  onSelect?: (recommendation: WorkflowRecommendation) => void;
  className?: string;
}

// ============================================================
// 스코어 배지 컴포넌트
// ============================================================

function ScoreBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const colorClass =
    percentage >= 80
      ? "bg-green-100 text-green-700"
      : percentage >= 60
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-700";

  return (
    <div className={cn("px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      {percentage}% 매칭
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function RecommendCard({
  recommendation,
  variant = "default",
  showScore = true,
  showTags = true,
  onSelect,
  className,
}: RecommendCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const industryInfo = INDUSTRY_INFO[recommendation.industry];
  const intentInfo = EXPRESSION_INTENT_INFO[recommendation.intent];

  // Featured 스타일
  if (variant === "featured") {
    return (
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white",
          isHovered && "shadow-lg border-primary-400 scale-[1.02]",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect?.(recommendation)}
      >
        {/* 추천 배지 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary-500 text-white px-2 py-1 rounded-full text-xs">
          <Sparkles className="w-3 h-3" />
          추천
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>{industryInfo?.icon}</span>
            <span>{industryInfo?.nameKo || recommendation.industry}</span>
          </div>
          <CardTitle className="text-lg">
            {intentInfo?.nameKo || recommendation.intent}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{recommendation.reason}</p>

          {showTags && recommendation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recommendation.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            {showScore && <ScoreBadge score={recommendation.score} />}
            <Button
              size="sm"
              className={cn(
                "transition-all",
                isHovered && "bg-primary-600"
              )}
            >
              시작하기
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact 스타일
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
          "hover:bg-gray-50 hover:border-gray-300",
          className
        )}
        onClick={() => onSelect?.(recommendation)}
      >
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-lg shrink-0">
          {industryInfo?.icon || "📦"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {intentInfo?.nameKo || recommendation.intent}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {industryInfo?.nameKo || recommendation.industry}
          </div>
        </div>

        {showScore && (
          <div className="shrink-0">
            <ScoreBadge score={recommendation.score} />
          </div>
        )}

        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
    );
  }

  // Default 스타일
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-gray-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(recommendation)}
    >
      {/* 썸네일 영역 */}
      {recommendation.exampleImageUrl && (
        <div className="relative h-32 bg-gray-100 rounded-t-xl overflow-hidden">
          <img
            src={recommendation.exampleImageUrl}
            alt={intentInfo?.nameKo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="text-white text-lg">{industryInfo?.icon}</span>
            <span className="text-white text-sm font-medium">
              {industryInfo?.nameKo}
            </span>
          </div>
        </div>
      )}

      <CardContent className={cn("p-4", !recommendation.exampleImageUrl && "pt-4")}>
        {/* 업종 (썸네일 없을 때) */}
        {!recommendation.exampleImageUrl && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>{industryInfo?.icon}</span>
            <span>{industryInfo?.nameKo || recommendation.industry}</span>
          </div>
        )}

        {/* 제목 */}
        <h3 className="font-semibold mb-2">
          {intentInfo?.nameKo || recommendation.intent}
        </h3>

        {/* 설명 */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {recommendation.reason}
        </p>

        {/* 태그 */}
        {showTags && recommendation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {recommendation.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 하단 */}
        <div className="flex items-center justify-between">
          {showScore && <ScoreBadge score={recommendation.score} />}

          <Button
            size="sm"
            variant={isHovered ? "default" : "ghost"}
            className="transition-all"
          >
            선택
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 추천 리스트 컴포넌트
// ============================================================

export interface RecommendListProps {
  recommendations: WorkflowRecommendation[];
  title?: string;
  emptyMessage?: string;
  variant?: "default" | "compact";
  showScore?: boolean;
  onSelect?: (recommendation: WorkflowRecommendation) => void;
  className?: string;
}

export function RecommendList({
  recommendations,
  title,
  emptyMessage = "추천 워크플로우가 없습니다",
  variant = "default",
  showScore = true,
  onSelect,
  className,
}: RecommendListProps) {
  if (recommendations.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <h3 className="font-medium">{title}</h3>
        </div>
      )}

      {variant === "compact" ? (
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <RecommendCard
              key={`${rec.industry}-${rec.intent}`}
              recommendation={rec}
              variant="compact"
              showScore={showScore}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <RecommendCard
              key={`${rec.industry}-${rec.intent}`}
              recommendation={rec}
              variant={index === 0 ? "featured" : "default"}
              showScore={showScore}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
