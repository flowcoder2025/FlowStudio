/**
 * Payment System Unit Tests
 * Contract: TEST_FUNC_PAYMENT
 * Evidence: tests/payment/webhook.test.ts::describe("Webhook")
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

// Mock the prisma client and config
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    webhookEvent: {
      create: vi.fn(),
      update: vi.fn(),
    },
    credit: {
      create: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

vi.mock('@/lib/payment/config', () => ({
  LEMONSQUEEZY_CONFIG: {
    apiKey: 'test-api-key',
    storeId: 'test-store-id',
    webhookSecret: 'test-webhook-secret',
    apiUrl: 'https://api.lemonsqueezy.com/v1',
  },
  CREDIT_PACKAGES: [
    { id: 'starter', name: 'Starter', credits: 100, price: 9900, variantId: 'var-100' },
    { id: 'pro', name: 'Pro', credits: 500, price: 39900, variantId: 'var-500' },
  ],
  SUBSCRIPTION_PLANS: [
    { id: 'free', name: 'Free', monthlyCredits: 10, price: 0, variantId: null },
    { id: 'basic', name: 'Basic', monthlyCredits: 100, price: 9900, variantId: 'sub-basic' },
  ],
  getCreditsForPackage: vi.fn((variantId: string) => {
    const packages: Record<string, number> = { 'var-100': 100, 'var-500': 500 };
    return packages[variantId] || 0;
  }),
  getPlanByVariantId: vi.fn((variantId: string) => {
    if (variantId === 'sub-basic') {
      return { id: 'basic', name: 'Basic', monthlyCredits: 100, price: 9900 };
    }
    return null;
  }),
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
import { LEMONSQUEEZY_CONFIG } from '@/lib/payment/config';

describe('Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyWebhookSignature', () => {
    it('유효한 서명을 검증해야 한다', () => {
      const rawBody = JSON.stringify({ test: 'data' });
      const hmac = crypto.createHmac('sha256', LEMONSQUEEZY_CONFIG.webhookSecret!);
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
      const hmac = crypto.createHmac('sha256', LEMONSQUEEZY_CONFIG.webhookSecret!);
      return hmac.update(body).digest('hex');
    };

    it('order_created 이벤트를 처리해야 한다', async () => {
      const payload = {
        meta: {
          event_name: 'order_created',
          custom_data: { user_id: 'test-user-id' },
        },
        data: {
          id: 'order-123',
          attributes: {
            status: 'paid',
            total: 9900,
            currency: 'KRW',
            customer_id: 'customer-123',
            first_order_item: {
              product_id: 'product-123',
              variant_id: 'var-100',
              product_name: 'Starter Pack',
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      vi.mocked(prisma.webhookEvent.create).mockResolvedValue({
        id: 'event-1',
        eventName: 'order_created',
        payload,
        processed: false,
      } as never);

      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({
        id: 'event-1',
        processed: true,
      } as never);

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: 'payment-1',
      } as never);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-1');
      expect(prisma.payment.create).toHaveBeenCalled();
    });

    it('잘못된 서명으로 실패해야 한다', async () => {
      const payload = {
        meta: { event_name: 'order_created' },
        data: { id: 'order-123', attributes: {} },
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

    it('이벤트 이름이 없으면 실패해야 한다', async () => {
      const payload = {
        meta: {},
        data: { id: 'order-123', attributes: {} },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Missing event name');
    });

    it('subscription_created 이벤트를 처리해야 한다', async () => {
      const payload = {
        meta: {
          event_name: 'subscription_created',
          custom_data: { user_id: 'test-user-id' },
        },
        data: {
          id: 'sub-123',
          attributes: {
            status: 'active',
            customer_id: 'customer-123',
            order_id: 'order-123',
            product_id: 'product-123',
            variant_id: 'sub-basic',
            variant_name: 'Basic Plan',
            renews_at: '2024-02-01T00:00:00Z',
            ends_at: null,
            trial_ends_at: null,
            pause: null,
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      vi.mocked(prisma.webhookEvent.create).mockResolvedValue({
        id: 'event-2',
        eventName: 'subscription_created',
        payload,
        processed: false,
      } as never);

      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({
        id: 'event-2',
        processed: true,
      } as never);

      vi.mocked(prisma.subscription.create).mockResolvedValue({
        id: 'subscription-1',
      } as never);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(true);
      expect(prisma.subscription.create).toHaveBeenCalled();
    });

    it('order_refunded 이벤트를 처리해야 한다', async () => {
      const payload = {
        meta: {
          event_name: 'order_refunded',
        },
        data: {
          id: 'order-123',
          attributes: {
            status: 'refunded',
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = createValidSignature(rawBody);

      vi.mocked(prisma.webhookEvent.create).mockResolvedValue({
        id: 'event-3',
        eventName: 'order_refunded',
        payload,
        processed: false,
      } as never);

      vi.mocked(prisma.webhookEvent.update).mockResolvedValue({
        id: 'event-3',
        processed: true,
      } as never);

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: 'payment-1',
        userId: 'test-user-id',
        creditsGranted: 100,
      } as never);

      vi.mocked(prisma.payment.update).mockResolvedValue({
        id: 'payment-1',
      } as never);

      const result = await handleWebhook(rawBody, signature);

      expect(result.success).toBe(true);
      expect(prisma.payment.findUnique).toHaveBeenCalled();
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
            data: {
              id: 'checkout-123',
              attributes: {
                url: 'https://checkout.lemonsqueezy.com/checkout/123',
                expires_at: '2024-01-01T00:00:00Z',
              },
            },
          }),
      } as Response);

      const result = await createCheckout({
        variantId: 'var-100',
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      expect(result.checkoutUrl).toContain('lemonsqueezy.com');
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
          variantId: 'var-100',
          userId: 'test-user-id',
        })
      ).rejects.toThrow('LemonSqueezy API error');
    });
  });

  describe('createCreditPackageCheckout', () => {
    it('크레딧 패키지 체크아웃을 생성해야 한다', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: 'checkout-123',
              attributes: {
                url: 'https://checkout.lemonsqueezy.com/checkout/123',
                expires_at: null,
              },
            },
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
            data: {
              id: 'checkout-123',
              attributes: {
                url: 'https://checkout.lemonsqueezy.com/checkout/123',
                expires_at: null,
              },
            },
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
