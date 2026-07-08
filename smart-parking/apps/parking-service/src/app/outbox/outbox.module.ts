import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OutboxService } from './outbox.service';
import { OutboxProcessorService } from './outbox-processor.service';
import { OutboxSummaryController } from './outbox-summary.controller';
import { N8nModule } from '../n8n/n8n.module';

@Module({
  imports: [PrismaModule, AuthModule, N8nModule],
  controllers: [OutboxSummaryController],
  providers: [OutboxService, OutboxProcessorService],
  exports: [OutboxService],
})
export class OutboxModule { }
