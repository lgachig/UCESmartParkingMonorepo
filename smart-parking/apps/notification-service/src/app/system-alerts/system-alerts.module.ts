import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { SystemAlertsController } from './system-alerts.controller';

@Module({
    imports: [NotificationModule],
    controllers: [SystemAlertsController],
})
export class SystemAlertsModule { }