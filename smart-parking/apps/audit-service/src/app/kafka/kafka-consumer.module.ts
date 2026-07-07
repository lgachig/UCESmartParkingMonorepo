import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AuditKafkaConsumerService } from './kafka-consumer.service';

@Module({
    imports: [PrismaModule, MetricsModule],
    providers: [AuditKafkaConsumerService],
})
export class KafkaConsumerModule { }