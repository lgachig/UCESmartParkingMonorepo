import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuditKafkaConsumerService } from './kafka-consumer.service';

@Module({
    imports: [PrismaModule],
    providers: [AuditKafkaConsumerService],
})
export class KafkaConsumerModule { }