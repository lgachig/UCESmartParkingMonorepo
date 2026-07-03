import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [RealtimeModule],
    providers: [KafkaConsumerService],
})
export class KafkaModule { }