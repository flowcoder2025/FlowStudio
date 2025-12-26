/**
 * Credit Manager Unit Tests
 *
 * Tests for the credit management system
 */

import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getCreditBalance,
  getCreditBalanceDetail,
  hasEnoughCredits,
  addCredits,
  deductCredits,
  deductCreditsWithType,
  deductCreditsAtomic,
  deductForGeneration,
  deductForUpscale,
  grantSignupBonus,
  grantReferralReward,
  getCreditTransactions,
  getCreditStats,
  initializeCredit,
  grantAdminBonus,
  getPurchasedCreditsRemaining,
  hasPurchasedCredits,
  getExpiringCredits,
  CREDIT_PRICES,
} from '@/lib/utils/creditManager'
import { ValidationError, InsufficientCreditsError } from '@/lib/errors'

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  credit: {
    findUnique: Mocked<typeof prisma.credit.findUnique>
    upsert: Mocked<typeof prisma.credit.upsert>
    update: Mocked<typeof prisma.credit.update>
  }
  creditTransaction: {
    findMany: Mocked<typeof prisma.creditTransaction.findMany>
    create: Mocked<typeof prisma.creditTransaction.create>
    update: Mocked<typeof prisma.creditTransaction.update>
    updateMany: Mocked<typeof prisma.creditTransaction.updateMany>
    count: Mocked<typeof prisma.creditTransaction.count>
    aggregate: Mocked<typeof prisma.creditTransaction.aggregate>
  }
  $transaction: Mocked<typeof prisma.$transaction>
}

describe('creditManager.ts', () => {
  const testUserId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()

    // Default $transaction mock that executes callback
    mockPrisma.$transaction.mockImplementation(async (callback: unknown) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma)
      }
      return callback
    })
  })

  describe('getCreditBalance()', () => {
    it('should return balance when credit record exists', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const balance = await getCreditBalance(testUserId)

      expect(balance).toBe(100)
      expect(mockPrisma.credit.findUnique).toHaveBeenCalledWith({
        where: { userId: testUserId },
        select: { balance: true }
      })
    })

    it('should return 0 when credit record does not exist', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue(null)

      const balance = await getCreditBalance(testUserId)

      expect(balance).toBe(0)
    })
  })

  describe('getCreditBalanceDetail()', () => {
    it('should return detailed balance breakdown', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 50 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      })

      const detail = await getCreditBalanceDetail(testUserId)

      expect(detail.total).toBe(150)
      expect(detail.free).toBe(50)
      expect(detail.purchased).toBe(100)
    })

    it('should cap free credits at total balance', async () => {
      // Edge case: remainingAmount sum exceeds total (data inconsistency)
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 100 }, // More than total balance
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      })

      const detail = await getCreditBalanceDetail(testUserId)

      expect(detail.total).toBe(30)
      expect(detail.free).toBe(30) // Capped at total
      expect(detail.purchased).toBe(0)
    })
  })

  describe('hasEnoughCredits()', () => {
    it('should return true when balance is sufficient', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await hasEnoughCredits(testUserId, 50)

      expect(result).toBe(true)
    })

    it('should return false when balance is insufficient', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await hasEnoughCredits(testUserId, 50)

      expect(result).toBe(false)
    })

    it('should return true when balance equals required amount', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await hasEnoughCredits(testUserId, 50)

      expect(result).toBe(true)
    })
  })

  describe('addCredits()', () => {
    it('should add credits and create transaction record', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 50,
        type: 'PURCHASE',
        description: 'Test purchase',
        metadata: {},
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      const result = await addCredits(
        testUserId,
        50,
        'PURCHASE',
        'Test purchase'
      )

      expect(result.balance).toBe(150)
      expect(mockPrisma.credit.upsert).toHaveBeenCalled()
      expect(mockPrisma.creditTransaction.create).toHaveBeenCalled()
    })

    it('should track remainingAmount for BONUS credits', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 30,
        type: 'BONUS',
        description: 'Signup bonus',
        metadata: {},
        remainingAmount: 30,
        expiresAt: null,
        createdAt: new Date(),
      })

      await addCredits(
        testUserId,
        30,
        'BONUS',
        'Signup bonus'
      )

      const createCall = mockPrisma.creditTransaction.create.mock.calls[0][0]
      expect(createCall.data.remainingAmount).toBe(30)
    })

    it('should throw ValidationError for non-positive amount', async () => {
      await expect(
        addCredits(testUserId, 0, 'PURCHASE', 'Invalid')
      ).rejects.toThrow(ValidationError)

      await expect(
        addCredits(testUserId, -10, 'PURCHASE', 'Invalid')
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('deductCredits()', () => {
    it('should deduct credits when balance is sufficient', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.credit.update.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: -20,
        type: 'GENERATION',
        description: 'Image generation',
        metadata: {},
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      const result = await deductCredits(
        testUserId,
        20,
        'GENERATION',
        'Image generation'
      )

      expect(result.balance).toBe(80)
    })

    it('should throw InsufficientCreditsError when balance is insufficient', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(
        deductCredits(testUserId, 20, 'GENERATION', 'Image generation')
      ).rejects.toThrow(InsufficientCreditsError)
    })

    it('should throw ValidationError for non-positive amount', async () => {
      await expect(
        deductCredits(testUserId, 0, 'GENERATION', 'Invalid')
      ).rejects.toThrow(ValidationError)
    })

    it('should record negative amount in transaction', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.credit.update.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: -20,
        type: 'GENERATION',
        description: 'Test',
        metadata: {},
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      await deductCredits(testUserId, 20, 'GENERATION', 'Test')

      const createCall = mockPrisma.creditTransaction.create.mock.calls[0][0]
      expect(createCall.data.amount).toBe(-20)
    })
  })

  describe('deductCreditsWithType()', () => {
    beforeEach(() => {
      // Setup common mocks for balance detail
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 30 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      })
    })

    it('should apply watermark when using free credits', async () => {
      mockPrisma.credit.update.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          userId: testUserId,
          amount: 30,
          remainingAmount: 30,
          type: 'BONUS',
          description: 'Bonus',
          metadata: {},
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      mockPrisma.creditTransaction.update.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 30,
        remainingAmount: 10,
        type: 'BONUS',
        description: 'Bonus',
        metadata: {},
        expiresAt: null,
        createdAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-2',
        userId: testUserId,
        amount: -20,
        type: 'GENERATION',
        description: 'Test',
        metadata: {},
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      const result = await deductCreditsWithType(
        testUserId,
        20,
        'GENERATION',
        'Test',
        'free'
      )

      expect(result.usedCreditType).toBe('free')
      expect(result.applyWatermark).toBe(true)
    })

    it('should not apply watermark when using purchased credits', async () => {
      mockPrisma.credit.update.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-2',
        userId: testUserId,
        amount: -20,
        type: 'GENERATION',
        description: 'Test',
        metadata: {},
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      const result = await deductCreditsWithType(
        testUserId,
        20,
        'GENERATION',
        'Test',
        'purchased'
      )

      expect(result.usedCreditType).toBe('purchased')
      expect(result.applyWatermark).toBe(false)
    })

    it('should throw when free credits are requested but insufficient', async () => {
      // Only 30 free credits available, requesting 50
      await expect(
        deductCreditsWithType(
          testUserId,
          50,
          'GENERATION',
          'Test',
          'free'
        )
      ).rejects.toThrow(InsufficientCreditsError)
    })

    it('should throw ValidationError for non-positive amount', async () => {
      await expect(
        deductCreditsWithType(testUserId, 0, 'GENERATION', 'Invalid')
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('deductCreditsAtomic()', () => {
    it('should return success when balance is sufficient', async () => {
      mockPrisma.credit.update.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: -20,
        type: 'GENERATION',
        description: 'Test',
        metadata: {},
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      const result = await deductCreditsAtomic(
        testUserId,
        20,
        'GENERATION',
        'Test'
      )

      expect(result.success).toBe(true)
      expect(result.balance).toBe(80)
    })

    it('should return failure when balance is insufficient (P2025)', async () => {
      const prismaError = new Error('Record not found') as Error & { code: string }
      prismaError.code = 'P2025'

      mockPrisma.$transaction.mockRejectedValueOnce(prismaError)
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await deductCreditsAtomic(
        testUserId,
        20,
        'GENERATION',
        'Test'
      )

      expect(result.success).toBe(false)
      expect(result.balance).toBe(10)
      expect(result.error).toContain('크레딧이 부족합니다')
    })

    it('should throw ValidationError for non-positive amount', async () => {
      await expect(
        deductCreditsAtomic(testUserId, 0, 'GENERATION', 'Invalid')
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('deductForGeneration()', () => {
    it('should deduct GENERATION_4 credits', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.credit.update.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: -CREDIT_PRICES.GENERATION_4,
        type: 'GENERATION',
        description: '이미지 생성 (4장)',
        metadata: { projectId: 'proj-1', imageCount: 4, resolution: '2K' },
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      await deductForGeneration(testUserId, 'proj-1')

      const createCall = mockPrisma.creditTransaction.create.mock.calls[0][0]
      expect(createCall.data.amount).toBe(-CREDIT_PRICES.GENERATION_4)
      expect(createCall.data.metadata.imageCount).toBe(4)
    })
  })

  describe('deductForUpscale()', () => {
    it('should deduct UPSCALE_4K credits', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.credit.update.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: -CREDIT_PRICES.UPSCALE_4K,
        type: 'UPSCALE',
        description: '4K 업스케일링 (1장)',
        metadata: { projectId: 'proj-1', imageCount: 1, resolution: '4K' },
        remainingAmount: null,
        expiresAt: null,
        createdAt: new Date(),
      })

      await deductForUpscale(testUserId, 'proj-1')

      const createCall = mockPrisma.creditTransaction.create.mock.calls[0][0]
      expect(createCall.data.amount).toBe(-CREDIT_PRICES.UPSCALE_4K)
      expect(createCall.data.type).toBe('UPSCALE')
    })
  })

  describe('grantSignupBonus()', () => {
    it('should grant 30 credits for general signup', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 30,
        type: 'BONUS',
        description: '일반 회원 가입 보너스 (30 크레딧)',
        metadata: { signupType: 'general' },
        remainingAmount: 30,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      const result = await grantSignupBonus(testUserId, 'general')

      expect(result.balance).toBe(30)
      const upsertCall = mockPrisma.credit.upsert.mock.calls[0][0]
      expect(upsertCall.update.balance.increment).toBe(30)
    })

    it('should grant 100 credits for business signup', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 100,
        type: 'BONUS',
        description: '사업자 회원 가입 보너스 (100 크레딧)',
        metadata: { signupType: 'business' },
        remainingAmount: 100,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      const result = await grantSignupBonus(testUserId, 'business')

      expect(result.balance).toBe(100)
      const upsertCall = mockPrisma.credit.upsert.mock.calls[0][0]
      expect(upsertCall.update.balance.increment).toBe(100)
    })

    it('should set expiration date', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 30,
        type: 'BONUS',
        description: 'Bonus',
        metadata: {},
        remainingAmount: 30,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      await grantSignupBonus(testUserId, 'general')

      const createCall = mockPrisma.creditTransaction.create.mock.calls[0][0]
      expect(createCall.data.expiresAt).toBeDefined()
      expect(createCall.data.expiresAt).not.toBeNull()
    })
  })

  describe('grantReferralReward()', () => {
    it('should grant 40 credits to both referrer and referee', async () => {
      const referrerId = 'referrer-123'
      const refereeId = 'referee-456'

      mockPrisma.credit.upsert
        .mockResolvedValueOnce({
          id: '1',
          userId: referrerId,
          balance: 40,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: '2',
          userId: refereeId,
          balance: 40,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: referrerId,
        amount: 40,
        type: 'REFERRAL',
        description: 'Referral',
        metadata: {},
        remainingAmount: 40,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      const result = await grantReferralReward(referrerId, refereeId)

      expect(result.referrerBalance).toBe(40)
      expect(result.refereeBalance).toBe(40)
    })
  })

  describe('getCreditTransactions()', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          userId: testUserId,
          amount: 50,
          type: 'PURCHASE',
          description: 'Purchase',
          metadata: {},
          remainingAmount: null,
          expiresAt: null,
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          userId: testUserId,
          amount: -20,
          type: 'GENERATION',
          description: 'Generation',
          metadata: {},
          remainingAmount: null,
          expiresAt: null,
          createdAt: new Date(),
        },
      ]
      mockPrisma.creditTransaction.findMany.mockResolvedValue(mockTransactions)
      mockPrisma.creditTransaction.count.mockResolvedValue(2)

      const result = await getCreditTransactions(testUserId, { limit: 10, offset: 0 })

      expect(result.transactions).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(false)
    })

    it('should filter by type when specified', async () => {
      mockPrisma.creditTransaction.findMany.mockResolvedValue([])
      mockPrisma.creditTransaction.count.mockResolvedValue(0)

      await getCreditTransactions(testUserId, { type: 'PURCHASE' })

      const findManyCall = mockPrisma.creditTransaction.findMany.mock.calls[0][0]
      expect(findManyCall.where.type).toBe('PURCHASE')
    })

    it('should indicate hasMore when more transactions exist', async () => {
      mockPrisma.creditTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          userId: testUserId,
          amount: 50,
          type: 'PURCHASE',
          description: 'Purchase',
          metadata: {},
          remainingAmount: null,
          expiresAt: null,
          createdAt: new Date(),
        },
      ])
      mockPrisma.creditTransaction.count.mockResolvedValue(10)

      const result = await getCreditTransactions(testUserId, { limit: 1, offset: 0 })

      expect(result.hasMore).toBe(true)
    })
  })

  describe('getCreditStats()', () => {
    it('should calculate credit statistics', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.findMany.mockResolvedValue([
        { amount: 100, type: 'PURCHASE' },
        { amount: 30, type: 'BONUS' },
        { amount: 40, type: 'REFERRAL' },
        { amount: -50, type: 'GENERATION' },
        { amount: -40, type: 'UPSCALE' },
      ])

      const stats = await getCreditStats(testUserId)

      expect(stats.balance).toBe(80)
      expect(stats.totalAdded).toBe(170)
      expect(stats.totalUsed).toBe(90)
      expect(stats.totalPurchased).toBe(100)
      expect(stats.totalBonus).toBe(30)
      expect(stats.totalReferral).toBe(40)
      expect(stats.totalGeneration).toBe(50)
      expect(stats.totalUpscale).toBe(40)
    })
  })

  describe('initializeCredit()', () => {
    it('should create credit record with 0 balance', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await initializeCredit(testUserId)

      expect(mockPrisma.credit.upsert).toHaveBeenCalledWith({
        where: { userId: testUserId },
        create: { userId: testUserId, balance: 0 },
        update: {}
      })
    })
  })

  describe('grantAdminBonus()', () => {
    const adminId = 'admin-123'

    it('should grant bonus credits with expiration', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 50,
        type: 'BONUS',
        description: 'Admin bonus',
        metadata: { type: 'admin_bonus', adminId },
        remainingAmount: 50,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      const result = await grantAdminBonus(
        adminId,
        testUserId,
        50,
        'Admin bonus',
        30
      )

      expect(result.newBalance).toBe(50)
      expect(result.transaction.amount).toBe(50)
    })

    it('should allow indefinite bonus (no expiration)', async () => {
      mockPrisma.credit.upsert.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.create.mockResolvedValue({
        id: 'tx-1',
        userId: testUserId,
        amount: 50,
        type: 'BONUS',
        description: 'Indefinite bonus',
        metadata: {},
        remainingAmount: 50,
        expiresAt: null,
        createdAt: new Date(),
      })

      await grantAdminBonus(
        adminId,
        testUserId,
        50,
        'Indefinite bonus',
        null // No expiration
      )

      const createCall = mockPrisma.creditTransaction.create.mock.calls[0][0]
      expect(createCall.data.expiresAt).toBeNull()
    })

    it('should throw ValidationError for non-positive amount', async () => {
      await expect(
        grantAdminBonus(adminId, testUserId, 0, 'Invalid')
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('getPurchasedCreditsRemaining()', () => {
    it('should calculate purchased credits correctly', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 50 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      })

      const purchased = await getPurchasedCreditsRemaining(testUserId)

      expect(purchased).toBe(100) // 150 total - 50 free = 100 purchased
    })

    it('should return 0 when all credits are free', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 50 }, // More free than total (edge case)
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      })

      const purchased = await getPurchasedCreditsRemaining(testUserId)

      expect(purchased).toBe(0)
    })
  })

  describe('hasPurchasedCredits()', () => {
    it('should return true when user has purchased credits', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 30 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      })

      const result = await hasPurchasedCredits(testUserId)

      expect(result).toBe(true)
    })

    it('should return false when user has only free credits', async () => {
      mockPrisma.credit.findUnique.mockResolvedValue({
        id: '1',
        userId: testUserId,
        balance: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { remainingAmount: 30 },
        _count: {},
        _avg: {},
        _min: {},
        _max: {},
      })

      const result = await hasPurchasedCredits(testUserId)

      expect(result).toBe(false)
    })
  })

  describe('getExpiringCredits()', () => {
    it('should return expiring credits within timeframes', async () => {
      const now = new Date()
      const in5Days = new Date()
      in5Days.setDate(in5Days.getDate() + 5)
      const in15Days = new Date()
      in15Days.setDate(in15Days.getDate() + 15)

      mockPrisma.creditTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          amount: 30,
          remainingAmount: 20,
          expiresAt: in5Days,
          type: 'BONUS',
        },
        {
          id: 'tx-2',
          amount: 40,
          remainingAmount: 40,
          expiresAt: in15Days,
          type: 'REFERRAL',
        },
      ])

      const result = await getExpiringCredits(testUserId)

      expect(result.expiringWithin7Days).toBe(20)
      expect(result.expiringWithin30Days).toBe(60)
      expect(result.transactions).toHaveLength(2)
    })

    it('should return zeros when no expiring credits', async () => {
      mockPrisma.creditTransaction.findMany.mockResolvedValue([])

      const result = await getExpiringCredits(testUserId)

      expect(result.expiringWithin7Days).toBe(0)
      expect(result.expiringWithin30Days).toBe(0)
      expect(result.transactions).toHaveLength(0)
    })
  })

  describe('CREDIT_PRICES constants', () => {
    it('should have correct pricing values', () => {
      expect(CREDIT_PRICES.GENERATION_4).toBe(20)
      expect(CREDIT_PRICES.GENERATION_2).toBe(10)
      expect(CREDIT_PRICES.UPSCALE_4K).toBe(10)
    })
  })
})
