/**
 * StorageUsageBar 컴포넌트
 *
 * 저장 공간 사용량을 프로그레스 바로 표시
 * 사용률에 따라 색상 변경 (초록 → 노랑 → 빨강)
 */

'use client'

import { HardDrive, AlertTriangle } from 'lucide-react'

interface StorageUsageBarProps {
  usedMB: number
  usedGB: number
  quotaGB: number
  usagePercent: number
  fileCount?: number
  variant?: 'default' | 'compact'
  showWarning?: boolean
  className?: string
}

export function StorageUsageBar({
  usedMB,
  usedGB,
  quotaGB,
  usagePercent,
  fileCount,
  variant = 'default',
  showWarning = true,
  className = '',
}: StorageUsageBarProps) {
  // 색상 결정 (사용률 기준)
  const getBarColor = () => {
    if (usagePercent >= 90) return 'bg-red-500'
    if (usagePercent >= 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getTextColor = () => {
    if (usagePercent >= 90) return 'text-red-600 dark:text-red-400'
    if (usagePercent >= 70) return 'text-amber-600 dark:text-amber-400'
    return 'text-emerald-600 dark:text-emerald-400'
  }

  // 용량 표시 형식 (MB 또는 GB)
  const formatUsed = () => {
    if (usedGB >= 1) {
      return `${usedGB.toFixed(2)} GB`
    }
    return `${usedMB.toFixed(1)} MB`
  }

  // Compact 버전 (갤러리 헤더 등)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor()} transition-all duration-300`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <span className={`text-[10px] font-medium ${getTextColor()}`}>
            {formatUsed()} / {quotaGB}GB
          </span>
          {showWarning && usagePercent >= 90 && (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          )}
        </div>
      </div>
    )
  }

  // Default 버전 (프로필 페이지 등)
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            저장 공간
          </span>
        </div>
        <div className="flex items-center gap-2">
          {fileCount !== undefined && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {fileCount.toLocaleString()}개 파일
            </span>
          )}
          <span className={`text-sm font-bold ${getTextColor()}`}>
            {usagePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500`}
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatUsed()} 사용 중
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {quotaGB} GB 중
        </span>
      </div>

      {showWarning && usagePercent >= 90 && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-red-800 dark:text-red-200">
              저장 공간이 거의 가득 찼습니다
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              플랜을 업그레이드하거나 불필요한 이미지를 삭제해주세요.
            </p>
          </div>
        </div>
      )}

      {showWarning && usagePercent >= 70 && usagePercent < 90 && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            저장 공간의 70%를 사용 중입니다. 여유 공간을 확보하세요.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * 스켈레톤 컴포넌트 (로딩 상태)
 */
export function StorageUsageBarSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    )
  }

  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
      <div className="flex items-center justify-between mt-2">
        <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  )
}
