import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AppRedisModule } from '../redis/redis.module';
import { ClientsModule } from '../clients/clients.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [AppRedisModule, ClientsModule, MailModule],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule { }