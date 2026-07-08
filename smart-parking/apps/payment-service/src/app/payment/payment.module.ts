import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';
import { ParkingFeeCalculatorService } from './parking-fee-calculator.service';
import { PaymentsService } from './payments.service';
import {
  InternalPaymentsController,
  PaymentsController,
  StripeWebhookController,
} from './payments.controller';
import { StripeModule } from '../stripe/stripe.module';
import { RabbitmqConsumerService } from '../rabbitmq/rabbitmq-consumer.service';
import { ReceiptService } from './receipt.service';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, ClientsModule, StripeModule, OutboxModule],
  controllers: [
    InternalPaymentsController,
    PaymentsController,
    StripeWebhookController,
  ],
  providers: [
    ParkingFeeCalculatorService,
    PaymentsService,
    RabbitmqConsumerService,
    ReceiptService,
  ],
  exports: [PaymentsService, ParkingFeeCalculatorService, RabbitmqConsumerService, ReceiptService],
})
export class PaymentModule {}