import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { OutboxService } from './outbox.service';
import { OutboxProcessorService } from './outbox-processor.service';

@Module({
  imports: [PrismaModule],
  providers: [OutboxService, OutboxProcessorService],
  exports: [OutboxService],
})
export class OutboxModule {}
