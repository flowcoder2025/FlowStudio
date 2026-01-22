/**
 * Business Verification Service
 * Contract: USER_FUNC_BUSINESS_VERIFY
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

import { prisma } from "@/lib/db";
import { z } from "zod";

export const businessVerifySchema = z.object({
  businessNumber: z.string().regex(/^\d{10}$/, "사업자번호는 10자리 숫자여야 합니다"),
});

export type BusinessVerifyInput = z.infer<typeof businessVerifySchema>;

export interface BusinessVerifyResult {
  success: boolean;
  verified: boolean;
  error?: string;
}

/**
 * Verify business registration number
 * In production, this would call an external API (e.g., 국세청 API)
 */
export async function verifyBusinessNumber(
  userId: string,
  input: BusinessVerifyInput
): Promise<BusinessVerifyResult> {
  try {
    const { businessNumber } = businessVerifySchema.parse(input);

    // TODO: Integrate with actual business verification API
    // For now, we just validate the format and store the number

    // Simple validation: check if it's a valid format
    // Real implementation would call 국세청 사업자등록정보 조회 API
    const isValid = validateBusinessNumberChecksum(businessNumber);

    if (!isValid) {
      return {
        success: false,
        verified: false,
        error: "유효하지 않은 사업자번호입니다",
      };
    }

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        businessNumber,
        businessVerified: true,
      },
    });

    return {
      success: true,
      verified: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        verified: false,
        error: error.errors[0]?.message || "유효성 검사 실패",
      };
    }
    return {
      success: false,
      verified: false,
      error: "사업자 인증 중 오류가 발생했습니다",
    };
  }
}

/**
 * Validate Korean business number checksum
 * Algorithm: https://www.irs.go.kr/
 */
function validateBusinessNumberChecksum(businessNumber: string): boolean {
  if (!/^\d{10}$/.test(businessNumber)) return false;

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  const digits = businessNumber.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }

  // Add special calculation for 9th digit
  sum += Math.floor((digits[8] * 5) / 10);

  const checksum = (10 - (sum % 10)) % 10;

  return checksum === digits[9];
}

/**
 * Get business verification status
 */
export async function getBusinessStatus(
  userId: string
): Promise<{ verified: boolean; businessNumber: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessVerified: true,
      businessNumber: true,
    },
  });

  return {
    verified: user?.businessVerified ?? false,
    businessNumber: user?.businessNumber ?? null,
  };
}
