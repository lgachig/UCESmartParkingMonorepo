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
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, ClientsModule, StripeModule],
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
    KafkaConsumerService,
  ],
  exports: [PaymentsService, ParkingFeeCalculatorService, RabbitmqConsumerService, ReceiptService],
})
export class PaymentModule {}