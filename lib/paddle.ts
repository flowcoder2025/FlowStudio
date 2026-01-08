import { Environment, LogLevel, Paddle, type PaddleOptions } from '@paddle/paddle-node-sdk';

let paddleInstance: Paddle | null = null;

export function getPaddleInstance(): Paddle {
  if (paddleInstance) {
    return paddleInstance;
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY environment variable is not set');
  }

  const environment = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' 
    ? Environment.production 
    : Environment.sandbox;

  const options: PaddleOptions = {
    environment,
    logLevel: process.env.NODE_ENV === 'production' ? LogLevel.error : LogLevel.verbose,
  };

  paddleInstance = new Paddle(apiKey, options);
  return paddleInstance;
}

export function getPaddleEnvironment(): 'sandbox' | 'production' {
  return process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox';
}

export function getPaddleClientToken(): string {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    throw new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN environment variable is not set');
  }
  return token;
}
