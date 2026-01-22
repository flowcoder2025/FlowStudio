/**
 * Credit System Unit Tests
 * Contract: TEST_FUNC_CREDITS
 * Evidence: tests/credits/balance.test.ts::describe("CreditBalance")
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';

// Mock the prisma client methods
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    creditTransaction: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Import after mocking
import {
  getCreditBalance,
  hasEnoughCredits,
  getCreditHistory,
} from '@/lib/credits/balance';
import {
  holdCredits,
  getHold,
  isHoldValid,
} from '@/lib/credits/hold';

describe('CreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCreditBalance', () => {
    it('사용자의 크레딧 잔액을 조회해야 한다', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: userId,
        creditBalance: 1000,
      } as never);

      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: -200 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      const result = await getCreditBalance(userId);

      expect(result.balance).toBe(1000);
      expect(result.pendingHolds).toBe(200);
      expect(result.availableBalance).toBe(800);
    });

    it('사용자가 없으면 잔액 0을 반환해야 한다', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: null },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      const result = await getCreditBalance('non-existent-user');

      expect(result.balance).toBe(0);
      expect(result.pendingHolds).toBe(0);
      expect(result.availableBalance).toBe(0);
    });

    it('보류 중인 크레딧이 없으면 전체 잔액을 사용 가능해야 한다', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user',
        creditBalance: 500,
      } as never);

      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: null },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      const result = await getCreditBalance('test-user');

      expect(result.availableBalance).toBe(500);
    });
  });

  describe('hasEnoughCredits', () => {
    it('충분한 크레딧이 있으면 true를 반환해야 한다', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user',
        creditBalance: 1000,
      } as never);

      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: null },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      const result = await hasEnoughCredits('test-user', 500);

      expect(result).toBe(true);
    });

    it('크레딧이 부족하면 false를 반환해야 한다', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user',
        creditBalance: 100,
      } as never);

      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: null },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      const result = await hasEnoughCredits('test-user', 500);

      expect(result).toBe(false);
    });

    it('보류 중인 크레딧을 고려해야 한다', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user',
        creditBalance: 500,
      } as never);

      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: -300 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      // 잔액 500, 보류 300 -> 사용 가능 200
      const result = await hasEnoughCredits('test-user', 250);

      expect(result).toBe(false);
    });
  });

  describe('getCreditHistory', () => {
    it('크레딧 거래 내역을 조회해야 한다', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: 100,
          type: 'purchase',
          description: '크레딧 구매',
          status: 'completed',
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          amount: -50,
          type: 'usage',
          description: '이미지 생성',
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue(mockTransactions as never);
      vi.mocked(prisma.creditTransaction.count).mockResolvedValue(2);

      const result = await getCreditHistory('test-user');

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('페이지네이션 옵션을 지원해야 한다', async () => {
      vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([]);
      vi.mocked(prisma.creditTransaction.count).mockResolvedValue(100);

      await getCreditHistory('test-user', { limit: 10, offset: 20 });

      expect(prisma.creditTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });
});

describe('CreditHold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('holdCredits', () => {
    it('크레딧을 성공적으로 예약해야 한다', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user',
        creditBalance: 1000,
      } as never);

      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: null },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({
        id: 'hold-1',
        userId: 'test-user',
        amount: -100,
        type: 'hold',
        status: 'pending',
      } as never);

      vi.mocked(prisma.creditTransaction.update).mockResolvedValue({
        id: 'hold-1',
      } as never);

      const result = await holdCredits('test-user', 100, '이미지 생성');

      expect(result.success).toBe(true);
      expect(result.holdId).toBe('hold-1');
    });

    it('잔액이 부족하면 실패해야 한다', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'test-user',
        creditBalance: 50,
      } as never);

      vi.mocked(prisma.creditTransaction.aggregate).mockResolvedValue({
        _sum: { amount: null },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      } as never);

      const result = await holdCredits('test-user', 100);

      expect(result.success).toBe(false);
      expect(result.error).toContain('크레딧이 부족합니다');
    });

    it('0 이하의 금액은 실패해야 한다', async () => {
      const result = await holdCredits('test-user', 0);

      expect(result.success).toBe(false);
      expect(result.error).toContain('0보다 커야 합니다');
    });

    it('음수 금액은 실패해야 한다', async () => {
      const result = await holdCredits('test-user', -100);

      expect(result.success).toBe(false);
      expect(result.error).toContain('0보다 커야 합니다');
    });
  });

  describe('getHold', () => {
    it('예약 정보를 조회해야 한다', async () => {
      const mockHold = {
        id: 'hold-1',
        userId: 'test-user',
        amount: -100,
        status: 'pending',
        createdAt: new Date(),
      };

      vi.mocked(prisma.creditTransaction.findFirst).mockResolvedValue(mockHold as never);

      const result = await getHold('hold-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('hold-1');
      expect(result?.status).toBe('pending');
    });

    it('존재하지 않는 예약은 null을 반환해야 한다', async () => {
      vi.mocked(prisma.creditTransaction.findFirst).mockResolvedValue(null);

      const result = await getHold('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('isHoldValid', () => {
    it('pending 상태의 예약은 유효해야 한다', async () => {
      vi.mocked(prisma.creditTransaction.findFirst).mockResolvedValue({
        id: 'hold-1',
        userId: 'test-user',
        amount: -100,
        status: 'pending',
        createdAt: new Date(),
      } as never);

      const result = await isHoldValid('hold-1');

      expect(result).toBe(true);
    });

    it('completed 상태의 예약은 유효하지 않아야 한다', async () => {
      vi.mocked(prisma.creditTransaction.findFirst).mockResolvedValue({
        id: 'hold-1',
        userId: 'test-user',
        amount: -100,
        status: 'completed',
        createdAt: new Date(),
      } as never);

      const result = await isHoldValid('hold-1');

      expect(result).toBe(false);
    });

    it('존재하지 않는 예약은 유효하지 않아야 한다', async () => {
      vi.mocked(prisma.creditTransaction.findFirst).mockResolvedValue(null);

      const result = await isHoldValid('non-existent');

      expect(result).toBe(false);
    });
  });
});
