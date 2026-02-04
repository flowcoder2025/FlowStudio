/**
 * Payment System Unit Tests
 * Contract: TEST_FUNC_PAYMENT
 * Evidence: tests/payment/webhook.test.ts::describe("Webhook")
 *
 * Payment Provider: Polar (https://polar.sh)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

// Mock the prisma client and config
// DB Schema Notes:
// - No Payment model - using CreditTransaction for payment tracking
// - No WebhookEvent model - processing directly
// - Credit has balance only (no amount/source)
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    credit: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

vi.mock('@/lib/payment/config', () => ({
  POLAR_CONFIG: {
    accessToken: 'test-access-token',
    successUrl: 'http://localhost:3000/payment/success',
    webhookSecret: 'test-webhook-secret',
    environment: 'sandbox',
  },
  CREDIT_PACKAGES: [
    { id: 'starter', name: 'Starter', credits: 100, price: 9900, productId: 'prod-100' },
    { id: 'pro', name: 'Pro', credits: 500, price: 39900, productId: 'prod-500' },
  ],
  SUBSCRIPTION_PLANS: [
    { id: 'free', name: 'Free', monthlyCredits: 10, price: 0, productId: '' },
    { id: 'basic', name: 'Basic', monthlyCredits: 100, price: 9900, productId: 'prod-basic' },
  ],
  getCreditsForPackage: vi.fn((productId: string) => {
    const packages: Record<string, number> = { 'prod-100': 100, 'prod-500': 500 };
    return packages[productId] || 0;
  }),
  getPlanByProductId: vi.fn((productId: string) => {
    if (productId === 'prod-basic') {
      return { id: 'basic', name: 'Basic', monthlyCredits: 100, price: 9900 };
    }
    return null;
  }),
  getPackageByProductId: vi.fn((productId: string) => {
    if (productId === 'prod-100') {
      return { id: 'starter', name: 'Starter', credits: 100, price: 9900, productId: 'prod-100' };
    }
    if (productId === 'prod-500') {
      return { id: 'pro', name: 'Pro', credits: 500, price: 39900, productId: 'prod-500' };
    }
    return null;
  }),
  // Legacy support
  getPlanByVariantId: vi.fn(),
  getPackageByVariantId: vi.fn(),
}));

// Import after mocking
import { verifyWebhookSignature, handleWebhook } from '@/lib/payment/webhook';
import {
  createCheckout,
  createCreditPackageCheckout,
  createSubscriptionCheckout,
  getCreditPackages,
  getSubscriptionPlans,
  getCreditPackageById,
  getSubscriptionPlanById,
} from '@/lib/payment/checkout';
import { prisma } from '@/lib/db';
import { POLAR_CONFIG } from '@/lib/payment/config';

describe('Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyWebhookSignature', () => {
    it('유효한 서명을 검증해야 한다', () => {
      const rawBody = JSON.stringify({ test: 'data' });
      const hmac = crypto.createHmac('sha256', POLAR_CONFIG.webhookSecret!);
      const signature = hmac.update(rawBody).digest('hex');

      const result = verifyWebhookSignature(rawBody, signature);

      expect(result).toBe(true);
    });

    it('잘못된 서명을 거부해야 한다', () => {
      const rawBody = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid-signature-12345';

      const result = verifyWebhookSignature(rawBody, invalidSignature);

      expect(result).toBe(false);
    });

    it('null 서명을 거부해야 한다', () => {
      const rawBody = JSON.stringify({ test: 'data' });

      const result = verifyWebhookSignature(rawBody, null);

      expect(result).toBe(false);
    });

    it('빈 서명을 거부해야 한다', () => {
      const rawBody = JSON.stringify({ test: 'data' });

      const result = verifyWebhookSignature(rawBody, '');

      expect(result).toBe(false);
    });
  });

  describe('handleWebhook', () => {
    const createValidSignature = (body: string) => {
      const hmac = crypto.createHmac('sha256', POLAR_CONFIG.webhookSecret!);
      return hmac.update(body).digest('hex');
    };

    it('order.created 이벤트를 처리해야 한다', async () => {
      const payload = {
        type: 'order.created',
        data: {
          id: 'order-123',
          metadata: { user_id: 'test-user-id' },
          product_id: 'prod-100',
          amount: 9900,
          currency: 'USD',
          user: {
            id: 'polar-user-123',
            email: 'test@example.com',
          },
          product: {
            id: 'prod-100',
            name: 'Starter Pack',
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      // DB Schema: No webhookEvent or payment models
      // Using creditTransaction instead
      vi.mocked(prisma.creditTransaction.create).mockResolvedValue({
        id: 'tx-1',
      } as never);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(true);
      expect(prisma.creditTransaction.create).toHaveBeenCalled();
    });

    it('잘못된 서명으로 실패해야 한다', async () => {
      const payload = {
        type: 'order.created',
        data: { id: 'order-123' },
      };

      const rawBody = JSON.stringify(payload);

      const result = await handleWebhook(rawBody, 'invalid-signature');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('잘못된 JSON으로 실패해야 한다', async () => {
      const invalidBody = 'not valid json';
      const signature = createValidSignature(invalidBody);

      const result = await handleWebhook(invalidBody, signature);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid JSON payload');
    });

    it('이벤트 타입이 없으면 실패해야 한다', async () => {
      const payload = {
        data: { id: 'order-123' },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Missing event type');
    });

    it('subscription.created 이벤트를 처리해야 한다', async () => {
      const payload = {
        type: 'subscription.created',
        data: {
          id: 'sub-123',
          metadata: { user_id: 'test-user-id' },
          status: 'active',
          product_id: 'prod-basic',
          current_period_start: '2024-01-01T00:00:00Z',
          current_period_end: '2024-02-01T00:00:00Z',
          user: {
            id: 'polar-user-123',
            email: 'test@example.com',
          },
          product: {
            id: 'prod-basic',
            name: 'Basic Plan',
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      // DB Schema: No webhookEvent model
      vi.mocked(prisma.subscription.create).mockResolvedValue({
        id: 'subscription-1',
      } as never);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(true);
      expect(prisma.subscription.create).toHaveBeenCalled();
    });

    it('order.refunded 이벤트를 처리해야 한다', async () => {
      const payload = {
        type: 'order.refunded',
        data: {
          id: 'order-123',
          metadata: {},
          product_id: 'prod-100',
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      // DB Schema: No payment model, using creditTransaction.findFirst
      vi.mocked(prisma.creditTransaction.findFirst).mockResolvedValue({
        id: 'tx-1',
        userId: 'test-user-id',
        amount: 100,
      } as never);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(true);
      expect(prisma.creditTransaction.findFirst).toHaveBeenCalled();
    });
  });
});

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('createCheckout', () => {
    it('체크아웃 URL을 생성해야 한다', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'checkout-123',
            url: 'https://checkout.polar.sh/checkout/123',
            status: 'open',
            expires_at: '2024-01-01T00:00:00Z',
          }),
      } as Response);

      const result = await createCheckout({
        productId: 'prod-100',
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      expect(result.checkoutUrl).toContain('polar.sh');
      expect(result.expiresAt).toBeDefined();
    });

    it('API 에러 시 예외를 발생시켜야 한다', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      } as Response);

      await expect(
        createCheckout({
          productId: 'prod-100',
          userId: 'test-user-id',
        })
      ).rejects.toThrow('Polar API error');
    });
  });

  describe('createCreditPackageCheckout', () => {
    it('크레딧 패키지 체크아웃을 생성해야 한다', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'checkout-123',
            url: 'https://checkout.polar.sh/checkout/123',
            status: 'open',
            expires_at: null,
          }),
      } as Response);

      const result = await createCreditPackageCheckout(
        'starter',
        'test-user-id',
        'test@example.com'
      );

      expect(result.checkoutUrl).toBeDefined();
    });

    it('존재하지 않는 패키지는 에러를 발생시켜야 한다', async () => {
      await expect(
        createCreditPackageCheckout('non-existent', 'test-user-id')
      ).rejects.toThrow('Credit package not found');
    });
  });

  describe('createSubscriptionCheckout', () => {
    it('구독 체크아웃을 생성해야 한다', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'checkout-123',
            url: 'https://checkout.polar.sh/checkout/123',
            status: 'open',
            expires_at: null,
          }),
      } as Response);

      const result = await createSubscriptionCheckout(
        'basic',
        'test-user-id',
        'test@example.com'
      );

      expect(result.checkoutUrl).toBeDefined();
    });

    it('무료 플랜은 에러를 발생시켜야 한다', async () => {
      await expect(
        createSubscriptionCheckout('free', 'test-user-id')
      ).rejects.toThrow('Free plan does not require checkout');
    });

    it('존재하지 않는 플랜은 에러를 발생시켜야 한다', async () => {
      await expect(
        createSubscriptionCheckout('non-existent', 'test-user-id')
      ).rejects.toThrow('Subscription plan not found');
    });
  });

  describe('getCreditPackages', () => {
    it('크레딧 패키지 목록을 반환해야 한다', () => {
      const packages = getCreditPackages();

      expect(packages).toBeInstanceOf(Array);
      expect(packages.length).toBeGreaterThan(0);
    });
  });

  describe('getSubscriptionPlans', () => {
    it('구독 플랜 목록을 반환해야 한다', () => {
      const plans = getSubscriptionPlans();

      expect(plans).toBeInstanceOf(Array);
      expect(plans.length).toBeGreaterThan(0);
    });
  });

  describe('getCreditPackageById', () => {
    it('ID로 크레딧 패키지를 조회해야 한다', () => {
      const pkg = getCreditPackageById('starter');

      expect(pkg).toBeDefined();
      expect(pkg?.id).toBe('starter');
    });

    it('존재하지 않는 ID는 undefined를 반환해야 한다', () => {
      const pkg = getCreditPackageById('non-existent');

      expect(pkg).toBeUndefined();
    });
  });

  describe('getSubscriptionPlanById', () => {
    it('ID로 구독 플랜을 조회해야 한다', () => {
      const plan = getSubscriptionPlanById('basic');

      expect(plan).toBeDefined();
      expect(plan?.id).toBe('basic');
    });

    it('존재하지 않는 ID는 undefined를 반환해야 한다', () => {
      const plan = getSubscriptionPlanById('non-existent');

      expect(plan).toBeUndefined();
    });
  });
});
