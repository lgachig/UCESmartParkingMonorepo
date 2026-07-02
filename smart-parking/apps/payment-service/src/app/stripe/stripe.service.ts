import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CreateCheckoutSessionParams {
  paymentId: string;
  reservationId: string;
  amount: number;
  currency: string;
  userId: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    const corsOrigins =
      this.configService.get<string>('CORS_ORIGINS') || 'http://localhost:3002';
    const baseUrl = corsOrigins.split(',')[0].trim();

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: Math.round(params.amount * 100),
            product_data: {
              name: 'Smart Parking Fee',
              description: `Reservation ${params.reservationId}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: params.paymentId,
        reservationId: params.reservationId,
        userId: params.userId,
      },
      success_url: `${baseUrl}/payment/success?payment_id=${params.paymentId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel?payment_id=${params.paymentId}&session_id={CHECKOUT_SESSION_ID}`,
    });

    this.logger.log(
      `Stripe Checkout Session created: ${session.id} for payment ${params.paymentId}`,
    );

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
  }
}