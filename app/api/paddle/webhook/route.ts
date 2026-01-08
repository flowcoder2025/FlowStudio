import { NextRequest, NextResponse } from 'next/server';
import { getPaddleInstance } from '@/lib/paddle';
import { prisma } from '@/lib/prisma';
import {
  EventEntity,
  EventName,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionCanceledEvent,
  TransactionCompletedEvent,
} from '@paddle/paddle-node-sdk';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('paddle-signature') || '';
  const rawBody = await request.text();
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || '';

  if (!signature || !rawBody) {
    return NextResponse.json({ error: 'Missing signature or body' }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const paddle = getPaddleInstance();
    const eventData = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);

    if (!eventData) {
      return NextResponse.json({ error: 'Failed to parse webhook' }, { status: 400 });
    }

    await processEvent(eventData);

    return NextResponse.json({ 
      success: true, 
      eventType: eventData.eventType,
    });
  } catch (error) {
    console.error('Paddle webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processEvent(event: EventEntity) {
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event as SubscriptionCreatedEvent);
      break;

    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event as SubscriptionUpdatedEvent);
      break;

    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event as SubscriptionCanceledEvent);
      break;

    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event as TransactionCompletedEvent);
      break;

    default:
      console.log(`Unhandled Paddle event: ${event.eventType}`);
  }
}

async function handleSubscriptionCreated(event: SubscriptionCreatedEvent) {
  const { id: subscriptionId, customerId, status, items, customData } = event.data;
  const userId = (customData as { userId?: string })?.userId;

  if (!userId) {
    console.error('No userId in subscription customData');
    return;
  }

  const priceId = items[0]?.price?.id;
  const tier = mapPriceIdToTier(priceId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      paddleCustomerId: customerId,
      paddleSubscriptionId: subscriptionId,
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionStartDate: new Date(),
    },
  });

  console.log(`Subscription created for user ${userId}: ${tier}`);
}

async function handleSubscriptionUpdated(event: SubscriptionUpdatedEvent) {
  const { id: subscriptionId, status, items, scheduledChange } = event.data;

  const user = await prisma.user.findFirst({
    where: { paddleSubscriptionId: subscriptionId },
  });

  if (!user) {
    console.error(`No user found for subscription ${subscriptionId}`);
    return;
  }

  const priceId = items[0]?.price?.id;
  const tier = mapPriceIdToTier(priceId);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionEndDate: scheduledChange?.effectiveAt 
        ? new Date(scheduledChange.effectiveAt) 
        : null,
    },
  });

  console.log(`Subscription updated for user ${user.id}: ${tier}, status: ${status}`);
}

async function handleSubscriptionCanceled(event: SubscriptionCanceledEvent) {
  const { id: subscriptionId, status } = event.data;

  const user = await prisma.user.findFirst({
    where: { paddleSubscriptionId: subscriptionId },
  });

  if (!user) {
    console.error(`No user found for subscription ${subscriptionId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: status,
      subscriptionTier: 'FREE',
    },
  });

  console.log(`Subscription canceled for user ${user.id}`);
}

async function handleTransactionCompleted(event: TransactionCompletedEvent) {
  const { id: transactionId, customerId, items, customData } = event.data;
  const userId = (customData as { userId?: string })?.userId;

  if (!userId) {
    console.error('No userId in transaction customData');
    return;
  }

  const priceId = items[0]?.price?.id;
  const credits = mapPriceIdToCredits(priceId);

  if (credits > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: credits,
          type: 'PURCHASE',
          description: `Paddle purchase (${transactionId})`,
          paymentProvider: 'PADDLE',
          paymentId: transactionId,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          paddleCustomerId: customerId,
          creditBalance: { increment: credits },
        },
      });
    });

    console.log(`Credits added for user ${userId}: ${credits}`);
  }
}

function mapPriceIdToTier(priceId: string | undefined): string {
  const priceMapping: Record<string, string> = {
    [process.env.PADDLE_PRICE_PLUS_MONTHLY || '']: 'PLUS',
    [process.env.PADDLE_PRICE_PLUS_YEARLY || '']: 'PLUS',
    [process.env.PADDLE_PRICE_PRO_MONTHLY || '']: 'PRO',
    [process.env.PADDLE_PRICE_PRO_YEARLY || '']: 'PRO',
    [process.env.PADDLE_PRICE_BUSINESS_MONTHLY || '']: 'BUSINESS',
    [process.env.PADDLE_PRICE_BUSINESS_YEARLY || '']: 'BUSINESS',
  };

  return priceMapping[priceId || ''] || 'FREE';
}

function mapPriceIdToCredits(priceId: string | undefined): number {
  const creditMapping: Record<string, number> = {
    [process.env.PADDLE_PRICE_CREDITS_STARTER || '']: 100,
    [process.env.PADDLE_PRICE_CREDITS_BASIC || '']: 300,
    [process.env.PADDLE_PRICE_CREDITS_PRO || '']: 1000,
    [process.env.PADDLE_PRICE_CREDITS_BUSINESS || '']: 3000,
  };

  return creditMapping[priceId || ''] || 0;
}
