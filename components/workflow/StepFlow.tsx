/**
 * Step Flow Component - 유연한 단계 표시
 * Contract: Phase 8 UI Components
 * Evidence: HANDOFF_2026-01-21_P7.md
 */

"use client";

import { useState, useMemo } from "react";
import {
  Check,
  Circle,
  ChevronDown,
  ChevronRight,
  SkipForward,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DynamicGuide, GuideStep, StepType } from "@/lib/workflow/guide";
import { SkipBehavior } from "@/lib/workflow/guide";

// ============================================================
// 타입 정의
// ============================================================

export type StepStatus = "completed" | "current" | "upcoming" | "skipped" | "locked";

export interface StepFlowProps {
  guide: DynamicGuide;
  onStepClick?: (stepId: StepType) => void;
  onSkipStep?: (stepId: StepType) => void;
  showProgress?: boolean;
  collapsible?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

interface StepItemProps {
  step: GuideStep;
  index: number;
  status: StepStatus;
  isLast: boolean;
  isCollapsed?: boolean;
  skipBehavior?: SkipBehavior;
  onClick?: () => void;
  onSkip?: () => void;
  orientation: "vertical" | "horizontal";
}

// ============================================================
// 헬퍼 함수
// ============================================================

function getStepStatus(
  stepId: StepType,
  currentStep: number,
  completedSteps: StepType[],
  steps: GuideStep[],
  stepIndex: number
): StepStatus {
  if (completedSteps.includes(stepId)) {
    return "completed";
  }
  if (stepIndex === currentStep) {
    return "current";
  }
  if (stepIndex < currentStep) {
    return "skipped";
  }
  // 이전 필수 단계가 완료되지 않으면 잠금
  const previousRequired = steps.slice(0, stepIndex).filter((s) => s.required);
  const allPreviousCompleted = previousRequired.every((s) =>
    completedSteps.includes(s.id)
  );
  if (!allPreviousCompleted && stepIndex > currentStep) {
    return "locked";
  }
  return "upcoming";
}

// ============================================================
// 단계 아이템 컴포넌트
// ============================================================

function StepItem({
  step,
  index,
  status,
  isLast,
  isCollapsed = false,
  skipBehavior,
  onClick,
  onSkip,
  orientation,
}: StepItemProps) {
  const [expanded, setExpanded] = useState(!isCollapsed);

  const canSkip = !step.required && status === "current" && onSkip;

  // 아이콘
  const Icon = useMemo(() => {
    switch (status) {
      case "completed":
        return Check;
      case "current":
        return Circle;
      case "skipped":
        return SkipForward;
      case "locked":
        return Lock;
      default:
        return Circle;
    }
  }, [status]);

  // 색상
  const statusColors = {
    completed: "bg-green-500 text-white border-green-500",
    current: "bg-primary-500 text-white border-primary-500 ring-4 ring-primary-100",
    skipped: "bg-gray-300 text-white border-gray-300",
    locked: "bg-gray-100 text-gray-400 border-gray-200",
    upcoming: "bg-white text-gray-400 border-gray-300",
  };

  const textColors = {
    completed: "text-gray-700",
    current: "text-gray-900 font-medium",
    skipped: "text-gray-400 line-through",
    locked: "text-gray-400",
    upcoming: "text-gray-500",
  };

  // Horizontal layout
  if (orientation === "horizontal") {
    return (
      <div className="flex items-center">
        {/* 원형 아이콘 */}
        <button
          onClick={() => status !== "locked" && onClick?.()}
          disabled={status === "locked"}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
            statusColors[status],
            status !== "locked" && "cursor-pointer hover:scale-110"
          )}
          title={step.titleKo}
        >
          <Icon className="w-4 h-4" />
        </button>

        {/* 연결선 */}
        {!isLast && (
          <div
            className={cn(
              "w-12 h-0.5 mx-1",
              status === "completed" ? "bg-green-500" : "bg-gray-200"
            )}
          />
        )}
      </div>
    );
  }

  // Vertical layout
  return (
    <div className="flex gap-4">
      {/* 좌측: 아이콘 + 연결선 */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => status !== "locked" && onClick?.()}
          disabled={status === "locked"}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
            statusColors[status],
            status !== "locked" && "cursor-pointer hover:scale-110"
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 my-2 min-h-[24px]",
              status === "completed" ? "bg-green-500" : "bg-gray-200"
            )}
          />
        )}
      </div>

      {/* 우측: 내용 */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center gap-2 text-left",
              textColors[status]
            )}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm">{step.titleKo}</span>
            {!step.required && (
              <span className="text-xs text-gray-400">(선택)</span>
            )}
          </button>

          {canSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-gray-500 h-7"
            >
              <SkipForward className="w-3 h-3 mr-1" />
              건너뛰기
            </Button>
          )}
        </div>

        {expanded && (
          <div className="mt-2 ml-6">
            <p className="text-xs text-gray-500">{step.description}</p>
            {step.helperText && (
              <p className="text-xs text-primary-600 mt-1">
                💡 {step.helperText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function StepFlow({
  guide,
  onStepClick,
  onSkipStep,
  showProgress = true,
  collapsible = false,
  orientation = "vertical",
  className,
}: StepFlowProps) {
  const progress = useMemo(() => {
    const completed = guide.completedSteps.length;
    const total = guide.steps.filter((s) => s.required).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [guide.completedSteps, guide.steps]);

  return (
    <div className={cn("", className)}>
      {/* 진행률 헤더 */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">진행 상황</span>
            <span className="text-sm text-gray-500">
              {guide.completedSteps.length} / {guide.steps.filter((s) => s.required).length} 완료
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* 단계 목록 */}
      {orientation === "horizontal" ? (
        <div className="flex items-center justify-center overflow-x-auto py-4">
          {guide.steps.map((step, index) => {
            const status = getStepStatus(
              step.id,
              guide.currentStep,
              guide.completedSteps,
              guide.steps,
              index
            );
            return (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                status={status}
                isLast={index === guide.steps.length - 1}
                onClick={() => onStepClick?.(step.id)}
                onSkip={() => onSkipStep?.(step.id)}
                orientation="horizontal"
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-0">
          {guide.steps.map((step, index) => {
            const status = getStepStatus(
              step.id,
              guide.currentStep,
              guide.completedSteps,
              guide.steps,
              index
            );
            return (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                status={status}
                isLast={index === guide.steps.length - 1}
                isCollapsed={collapsible && status !== "current"}
                onClick={() => onStepClick?.(step.id)}
                onSkip={() => onSkipStep?.(step.id)}
                orientation="vertical"
              />
            );
          })}
        </div>
      )}

      {/* 완료 상태 */}
      {progress === 100 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-800">모든 단계 완료!</p>
            <p className="text-sm text-green-600">
              이제 이미지를 생성할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 미니 진행 표시 컴포넌트
// ============================================================

export interface MiniStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function MiniStepIndicator({
  currentStep,
  totalSteps,
  className,
}: MiniStepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all",
            index < currentStep
              ? "w-3 bg-green-500"
              : index === currentStep
              ? "w-6 bg-primary-500"
              : "w-3 bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}
