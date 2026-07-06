import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [NotificationModule],
    providers: [KafkaConsumerService],
    exports: [KafkaConsumerService],
})
export class KafkaModule { }