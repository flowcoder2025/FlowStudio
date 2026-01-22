/**
 * RecommendHero Component - 대형 추천 카드 컴포넌트
 * Contract: Immersive Recommendation UX
 * Evidence: 검색 추천 몰입형 UX 개선 계획
 */

"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkflowRecommendation } from "@/lib/workflow/recommend";
import { INDUSTRY_INFO } from "@/lib/workflow/industries";
import { EXPRESSION_INTENT_INFO } from "@/lib/workflow/intents";

// ============================================================
// 타입 정의
// ============================================================

export interface RecommendHeroProps {
  recommendation: WorkflowRecommendation;
  onAccept: () => void;
  onReject: () => void;
  currentIndex: number;
  total: number;
  className?: string;
}

// ============================================================
// 프로그레스 바 컴포넌트
// ============================================================

function MatchProgressBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const colorClass =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 60
      ? "bg-yellow-500"
      : "bg-gray-400";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-500">매칭률</span>
        <span className="text-sm font-semibold text-gray-700">{percentage}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ============================================================
// 도트 인디케이터 컴포넌트
// ============================================================

function DotIndicator({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;

  // 최대 7개까지만 표시
  const maxDots = 7;
  const showDots = Math.min(total, maxDots);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: showDots }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-200",
            index === current % showDots
              ? "bg-primary-600 scale-125"
              : "bg-gray-300"
          )}
        />
      ))}
      {total > maxDots && (
        <span className="text-xs text-gray-400 ml-1">+{total - maxDots}</span>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function RecommendHero({
  recommendation,
  onAccept,
  onReject,
  currentIndex,
  total,
  className,
}: RecommendHeroProps) {
  const industryInfo = INDUSTRY_INFO[recommendation.industry];
  const intentInfo = EXPRESSION_INTENT_INFO[recommendation.intent];

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full max-w-lg mx-auto",
        "bg-white rounded-2xl shadow-2xl overflow-hidden",
        className
      )}
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-primary-600">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI 추천</span>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} / {total}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
        {/* 업종 아이콘 & 라벨 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-4xl md:text-5xl mb-4"
          style={{ backgroundColor: `${industryInfo?.color || "#6366f1"}20` }}
        >
          {industryInfo?.icon || "📦"}
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-gray-500 mb-2"
        >
          {industryInfo?.nameKo || recommendation.industry}
        </motion.div>

        {/* 제목 */}
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
        >
          {intentInfo?.nameKo || recommendation.intent}
        </motion.h2>

        {/* 설명 */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-gray-600 mb-6 max-w-sm leading-relaxed"
        >
          {intentInfo?.description || recommendation.reason}
        </motion.p>

        {/* 태그 */}
        {recommendation.tags.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {recommendation.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </motion.div>
        )}

        {/* 매칭률 프로그레스 바 */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="w-full max-w-xs"
        >
          <MatchProgressBar score={recommendation.score} />
        </motion.div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="p-5 md:p-6 bg-gray-50 space-y-3">
        <Button
          onClick={onAccept}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          이 워크플로우로 시작하기
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {total > 1 && (
          <Button
            onClick={onReject}
            variant="ghost"
            className="w-full h-10 text-gray-600 hover:text-gray-900"
          >
            다른 추천 보기
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        {/* 도트 인디케이터 */}
        <div className="pt-2">
          <DotIndicator current={currentIndex} total={total} />
        </div>

        {/* 모바일 힌트 */}
        {total > 1 && (
          <p className="text-xs text-gray-400 text-center mt-2 md:hidden">
            ← 스와이프로 넘기기 →
          </p>
        )}
      </div>
    </div>
  );
}

export default RecommendHero;
