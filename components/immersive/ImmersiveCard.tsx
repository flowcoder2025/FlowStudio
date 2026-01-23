/**
 * ImmersiveCard Component - 재사용 가능한 대형 카드
 * 몰입형 UI에서 사용되는 기본 카드 컴포넌트
 */

"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

export interface ImmersiveCardProps {
  /** 카드 아이콘 (이모지 또는 컴포넌트) */
  icon?: ReactNode;
  /** 아이콘 배경색 */
  iconBgColor?: string;
  /** 헤더 라벨 (예: "AI 추천") */
  headerLabel?: string;
  /** 헤더 아이콘 */
  headerIcon?: ReactNode;
  /** 상단 우측 텍스트 (예: "1 / 5") */
  headerRight?: string;
  /** 서브타이틀 (작은 텍스트) */
  subtitle?: string;
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 태그 목록 */
  tags?: string[];
  /** 최대 태그 수 */
  maxTags?: number;
  /** 프로그레스 표시 */
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  /** 주요 액션 버튼 */
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    disabled?: boolean;
  };
  /** 보조 액션 버튼 */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  /** 추가 푸터 콘텐츠 */
  footer?: ReactNode;
  /** 카드 본문 추가 콘텐츠 */
  children?: ReactNode;
  /** 추가 className */
  className?: string;
  /** 카드 크기 */
  size?: "sm" | "md" | "lg";
}

// ============================================================
// Sub Components
// ============================================================

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

function ProgressBar({ value, max, label = "진행률" }: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  const colorClass =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 60
      ? "bg-yellow-500"
      : "bg-zinc-400 dark:bg-zinc-500";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{percentage}%</span>
      </div>
      <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
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
// Constants
// ============================================================

const sizeConfig = {
  sm: {
    card: "max-w-sm",
    height: "h-auto min-h-[400px]",
    icon: "w-16 h-16 text-3xl",
    title: "text-xl",
    padding: "p-4",
  },
  md: {
    card: "max-w-md",
    height: "h-auto min-h-[500px]",
    icon: "w-20 h-20 text-4xl",
    title: "text-2xl",
    padding: "p-5 md:p-6",
  },
  lg: {
    card: "max-w-lg",
    height: "h-[600px] md:h-[650px]",
    icon: "w-20 h-20 md:w-24 md:h-24 text-4xl md:text-5xl",
    title: "text-2xl md:text-3xl",
    padding: "p-5 md:p-6",
  },
};

// ============================================================
// Main Component
// ============================================================

export function ImmersiveCard({
  icon,
  iconBgColor = "#6366f120",
  headerLabel,
  headerIcon = <Sparkles className="w-4 h-4" />,
  headerRight,
  subtitle,
  title,
  description,
  tags,
  maxTags = 4,
  progress,
  primaryAction,
  secondaryAction,
  footer,
  children,
  className,
  size = "lg",
}: ImmersiveCardProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col w-full mx-auto",
        "bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl dark:shadow-zinc-900/50 overflow-hidden border border-zinc-200 dark:border-zinc-800",
        config.card,
        config.height,
        className
      )}
    >
      {/* 상단 헤더 */}
      {(headerLabel || headerRight) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          {headerLabel && (
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
              {headerIcon}
              <span className="text-sm font-medium">{headerLabel}</span>
            </div>
          )}
          {headerRight && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{headerRight}</div>
          )}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div
        className={cn(
          "flex-1 flex flex-col items-center justify-center text-center",
          config.padding
        )}
      >
        {/* 아이콘 */}
        {icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "rounded-2xl flex items-center justify-center mb-4",
              config.icon
            )}
            style={{ backgroundColor: iconBgColor }}
          >
            {icon}
          </motion.div>
        )}

        {/* 서브타이틀 */}
        {subtitle && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm text-zinc-500 dark:text-zinc-400 mb-2"
          >
            {subtitle}
          </motion.div>
        )}

        {/* 제목 */}
        <motion.h2
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={cn("font-bold text-zinc-900 dark:text-zinc-100 mb-3", config.title)}
        >
          {title}
        </motion.h2>

        {/* 설명 */}
        {description && (
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-sm leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {/* 태그 */}
        {tags && tags.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {tags.slice(0, maxTags).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
            {tags.length > maxTags && (
              <span className="px-3 py-1 text-zinc-400 dark:text-zinc-500 text-sm">
                +{tags.length - maxTags}
              </span>
            )}
          </motion.div>
        )}

        {/* 프로그레스 바 */}
        {progress && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="w-full max-w-xs"
          >
            <ProgressBar
              value={progress.current}
              max={progress.total}
              label={progress.label}
            />
          </motion.div>
        )}

        {/* 추가 콘텐츠 */}
        {children}
      </div>

      {/* 하단 버튼 영역 */}
      {(primaryAction || secondaryAction || footer) && (
        <div className="p-5 md:p-6 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {primaryAction.label}
              {primaryAction.icon || <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              className="w-full h-10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {secondaryAction.label}
              {secondaryAction.icon || <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          )}

          {footer}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Compact Card (작은 버전)
// ============================================================

export interface CompactCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export function CompactCard({
  icon,
  title,
  description,
  onClick,
  className,
}: CompactCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 w-full",
        "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800",
        "hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md dark:hover:shadow-zinc-900/50",
        "transition-all text-left active:scale-[0.98]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{title}</h3>
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{description}</p>
        )}
      </div>
      {onClick && <ArrowRight className="w-5 h-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />}
    </button>
  );
}

export default ImmersiveCard;
