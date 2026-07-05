import { Module } from '@nestjs/common';
import { RabbitmqConsumerService } from './rabbitmq-consumer.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [NotificationModule],
    providers: [RabbitmqConsumerService],
    exports: [RabbitmqConsumerService],
})
export class RabbitmqModule { }