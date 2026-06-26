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
} from './payments.controller';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, ClientsModule],
  controllers: [InternalPaymentsController, PaymentsController],
  providers: [ParkingFeeCalculatorService, PaymentsService],
  exports: [PaymentsService, ParkingFeeCalculatorService],
})
export class PaymentModule {}
