import { Module } from '@nestjs/common';
import { N8nNotifierService } from './n8n-notifier.service';

@Module({
    providers: [N8nNotifierService],
    exports: [N8nNotifierService],
})
export class N8nModule { }