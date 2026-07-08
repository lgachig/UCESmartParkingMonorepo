import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { KafkaModule } from '../kafka/kafka.module';
import { OutboxService } from './outbox.service';
import { OutboxProcessorService } from './outbox-processor.service';
import { OutboxSummaryController } from './outbox-summary.controller';

@Module({
  imports: [PrismaModule, AuthModule, KafkaModule],
  controllers: [OutboxSummaryController],
  providers: [OutboxService, OutboxProcessorService],
  exports: [OutboxService],
})
export class OutboxModule {}
