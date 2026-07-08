import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { KafkaModule } from '../kafka/kafka.module';
import { OutboxService } from './outbox.service';
import { OutboxProcessorService } from './outbox-processor.service';

@Module({
  imports: [PrismaModule, KafkaModule],
  providers: [OutboxService, OutboxProcessorService],
  exports: [OutboxService],
})
export class OutboxModule {}
