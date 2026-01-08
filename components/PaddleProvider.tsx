'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: 'sandbox' | 'production') => void;
      };
      Initialize: (config: {
        token: string;
        eventCallback?: (event: PaddleEvent) => void;
      }) => void;
      Checkout: {
        open: (config: PaddleCheckoutConfig) => void;
      };
    };
  }
}

interface PaddleEvent {
  name: string;
  data?: Record<string, unknown>;
}

interface PaddleCheckoutConfig {
  items: Array<{
    priceId: string;
    quantity: number;
  }>;
  customer?: {
    email?: string;
  };
  customData?: Record<string, unknown>;
  settings?: {
    displayMode?: 'overlay' | 'inline';
    theme?: 'light' | 'dark';
    locale?: string;
    successUrl?: string;
  };
}

interface PaddleProviderProps {
  onCheckoutComplete?: () => void;
}

export function PaddleProvider({ onCheckoutComplete }: PaddleProviderProps) {
  const loadedRef = useRef(false);
  const router = useRouter();

  const handleEvent = useCallback((event: PaddleEvent) => {
    if (event.name === 'checkout.completed') {
      onCheckoutComplete?.();
      router.refresh();
    }
  }, [onCheckoutComplete, router]);

  useEffect(() => {
    if (loadedRef.current) return;

    const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV as 'sandbox' | 'production' || 'sandbox';
    const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    if (!paddleToken) {
      console.warn('Paddle client token not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;

    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Environment.set(paddleEnv);
        window.Paddle.Initialize({
          token: paddleToken,
          eventCallback: handleEvent,
        });
      }
    };

    document.body.appendChild(script);
    loadedRef.current = true;

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [handleEvent]);

  return null;
}

export function openPaddleCheckout(config: {
  priceId: string;
  email?: string;
  userId?: string;
  locale?: string;
  successUrl?: string;
}) {
  if (!window.Paddle) {
    console.error('Paddle not initialized');
    return;
  }

  window.Paddle.Checkout.open({
    items: [{ priceId: config.priceId, quantity: 1 }],
    customer: config.email ? { email: config.email } : undefined,
    customData: config.userId ? { userId: config.userId } : undefined,
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      locale: config.locale || 'en',
      successUrl: config.successUrl,
    },
  });
}
