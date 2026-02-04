/**
 * Storage Quota Management
 * Contract: Phase 18a - Storage Quota
 *
 * 플랜별 저장공간 한도:
 * - Free: 1GB
 * - Plus: 100GB
 * - Pro: 500GB
 * - Business: 1TB
 */

import { prisma } from '@/lib/db';
import { SUBSCRIPTION_PLANS } from '@/lib/payment/config';

// =====================================================
// Types
// =====================================================

export interface StorageUsage {
  totalBytes: bigint;
  imageCount: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  usage: bigint;
  limit: bigint;
  remaining: bigint;
  usagePercent: number;
  errorMessage?: string;
  errorCode?: 'STORAGE_QUOTA_EXCEEDED';
}

// =====================================================
// Storage Limit Constants (in bytes)
// =====================================================

const GB = BigInt(1024 * 1024 * 1024);
const TB = BigInt(1024) * GB;

export const STORAGE_LIMITS: Record<string, bigint> = {
  free: GB,           // 1GB
  plus: BigInt(100) * GB,       // 100GB
  'plus-yearly': BigInt(100) * GB,
  pro: BigInt(500) * GB,        // 500GB
  'pro-yearly': BigInt(500) * GB,
  business: TB,       // 1TB
  'business-yearly': TB,
};

// =====================================================
// Parse Storage String to Bytes
// =====================================================

/**
 * 문자열 저장공간 표기를 바이트로 변환
 * @example parseStorageString("1GB") -> 1073741824n
 * @example parseStorageString("100GB") -> 107374182400n
 * @example parseStorageString("1TB") -> 1099511627776n
 */
export function parseStorageString(storage: string): bigint {
  const match = storage.match(/^(\d+(?:\.\d+)?)\s*(GB|TB|MB|KB|B)?$/i);
  if (!match) {
    return GB; // Default to 1GB if parsing fails
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  const multipliers: Record<string, bigint> = {
    B: BigInt(1),
    KB: BigInt(1024),
    MB: BigInt(1024 * 1024),
    GB: GB,
    TB: TB,
  };

  return BigInt(Math.floor(value)) * (multipliers[unit] || BigInt(1));
}

// =====================================================
// Get Storage Limit for User
// =====================================================

/**
 * 사용자의 구독 플랜에 따른 저장공간 한도 조회
 */
export async function getStorageLimitForUser(userId: string): Promise<bigint> {
  // 1. 구독 정보 조회
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { tier: true, status: true },
  });

  // 2. 활성 구독이 없으면 Free 플랜
  if (!subscription || subscription.status !== 'ACTIVE') {
    return STORAGE_LIMITS.free;
  }

  // 3. 플랜 ID로 저장공간 한도 조회
  const tier = subscription.tier.toLowerCase();

  // SUBSCRIPTION_PLANS에서 storage 필드 조회
  const plan = SUBSCRIPTION_PLANS.find(
    (p) => p.id === tier || p.id === `${tier}-yearly`
  );

  if (plan?.storage) {
    return parseStorageString(plan.storage);
  }

  // 4. 기본값 반환
  return STORAGE_LIMITS[tier] || STORAGE_LIMITS.free;
}

// =====================================================
// Get Storage Usage
// =====================================================

/**
 * 사용자의 현재 저장공간 사용량 조회
 */
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const stats = await prisma.userStorageStats.findUnique({
    where: { userId },
    select: { totalBytes: true, imageCount: true },
  });

  return {
    totalBytes: stats?.totalBytes ?? BigInt(0),
    imageCount: stats?.imageCount ?? 0,
  };
}

// =====================================================
// Check Storage Quota
// =====================================================

/**
 * 업로드 전 저장공간 quota 체크
 * @param userId 사용자 ID
 * @param additionalBytes 추가할 바이트 수
 * @returns QuotaCheckResult
 */
export async function checkStorageQuota(
  userId: string,
  additionalBytes: number
): Promise<QuotaCheckResult> {
  // 1. 현재 사용량 조회
  const usage = await getStorageUsage(userId);

  // 2. 한도 조회
  const limit = await getStorageLimitForUser(userId);

  // 3. 새 사용량 계산
  const newUsage = usage.totalBytes + BigInt(additionalBytes);
  const remaining = limit - usage.totalBytes;
  const usagePercent = Number((usage.totalBytes * BigInt(100)) / limit);

  // 4. 한도 초과 체크
  if (newUsage > limit) {
    const usedGB = Number(usage.totalBytes) / (1024 * 1024 * 1024);
    const limitGB = Number(limit) / (1024 * 1024 * 1024);
    const additionalMB = additionalBytes / (1024 * 1024);

    return {
      allowed: false,
      usage: usage.totalBytes,
      limit,
      remaining: remaining > BigInt(0) ? remaining : BigInt(0),
      usagePercent,
      errorMessage: `Storage quota exceeded. Current: ${usedGB.toFixed(2)}GB / ${limitGB.toFixed(2)}GB. Upload size: ${additionalMB.toFixed(2)}MB. Please upgrade your plan or delete some files.`,
      errorCode: 'STORAGE_QUOTA_EXCEEDED',
    };
  }

  return {
    allowed: true,
    usage: usage.totalBytes,
    limit,
    remaining: remaining - BigInt(additionalBytes),
    usagePercent,
  };
}

// =====================================================
// Update Storage Usage
// =====================================================

/**
 * 사용량 업데이트 (증가/감소)
 * @param userId 사용자 ID
 * @param bytesChange 바이트 변화량 (양수: 증가, 음수: 감소)
 * @param countChange 이미지 개수 변화량 (양수: 증가, 음수: 감소)
 */
export async function updateStorageUsage(
  userId: string,
  bytesChange: bigint,
  countChange: number
): Promise<void> {
  await prisma.userStorageStats.upsert({
    where: { userId },
    create: {
      userId,
      totalBytes: bytesChange > BigInt(0) ? bytesChange : BigInt(0),
      imageCount: countChange > 0 ? countChange : 0,
    },
    update: {
      totalBytes: {
        increment: bytesChange,
      },
      imageCount: {
        increment: countChange,
      },
    },
  });

  // 음수가 되지 않도록 보정
  const stats = await prisma.userStorageStats.findUnique({
    where: { userId },
    select: { totalBytes: true, imageCount: true },
  });

  if (stats) {
    const updates: { totalBytes?: bigint; imageCount?: number } = {};

    if (stats.totalBytes < BigInt(0)) {
      updates.totalBytes = BigInt(0);
    }
    if (stats.imageCount < 0) {
      updates.imageCount = 0;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.userStorageStats.update({
        where: { userId },
        data: updates,
      });
    }
  }
}

// =====================================================
// Format Storage Size
// =====================================================

/**
 * 바이트를 사람이 읽기 쉬운 형태로 변환
 */
export function formatStorageSize(bytes: bigint): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Number(bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

// =====================================================
// Get Storage Stats Summary
// =====================================================

/**
 * 사용자의 저장공간 요약 정보 조회
 */
export async function getStorageStatsSummary(userId: string): Promise<{
  usage: StorageUsage;
  limit: bigint;
  usageFormatted: string;
  limitFormatted: string;
  usagePercent: number;
  remaining: bigint;
  remainingFormatted: string;
}> {
  const [usage, limit] = await Promise.all([
    getStorageUsage(userId),
    getStorageLimitForUser(userId),
  ]);

  const remaining = limit - usage.totalBytes;
  const usagePercent = Number((usage.totalBytes * BigInt(100)) / limit);

  return {
    usage,
    limit,
    usageFormatted: formatStorageSize(usage.totalBytes),
    limitFormatted: formatStorageSize(limit),
    usagePercent,
    remaining: remaining > BigInt(0) ? remaining : BigInt(0),
    remainingFormatted: formatStorageSize(remaining > BigInt(0) ? remaining : BigInt(0)),
  };
}
