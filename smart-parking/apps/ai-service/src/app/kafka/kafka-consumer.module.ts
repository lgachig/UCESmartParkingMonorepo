import { Module } from '@nestjs/common';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AiKafkaConsumerService } from './kafka-consumer.service';

@Module({
    imports: [RecommendationsModule, MetricsModule],
    providers: [AiKafkaConsumerService],
})
export class KafkaConsumerModule { }