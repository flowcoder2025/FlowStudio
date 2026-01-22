import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Prisma Client
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    image: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    creditTransaction: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workflowSession: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    permission: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      creditTransaction: {
        create: vi.fn(),
      },
    })),
  },
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: { id: 'test-user-id', email: 'test@example.com' } })),
}));

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.LEMONSQUEEZY_API_KEY = 'test-api-key';
process.env.LEMONSQUEEZY_STORE_ID = 'test-store-id';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'test-webhook-secret';
