import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { KafkaModule } from '../kafka/kafka.module';
import { OutboxService } from './outbox.service';
import { OutboxProcessorService } from './outbox-processor.service';
import { N8nModule } from '../n8n/n8n.module';

@Module({
    imports: [PrismaModule, KafkaModule, N8nModule],
    providers: [OutboxService, OutboxProcessorService],
    exports: [OutboxService],
})
export class OutboxModule { }