import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class N8nNotifierService {
    private readonly logger = new Logger(N8nNotifierService.name);
    private readonly webhookUrl?: string;

    constructor(private readonly configService: ConfigService) {
        this.webhookUrl = this.configService.get<string>('N8N_WEBHOOK_URL');
    }

    async notify(eventType: string, aggregateId: string, payload: Record<string, unknown>): Promise<void> {
        if (!this.webhookUrl) return;

        try {
            await axios.post(
                this.webhookUrl,
                { eventType, aggregateId, payload, source: 'reservation-service' },
                { timeout: 5000 },
            );
        } catch (err: any) {
            this.logger.warn(`No se pudo notificar a n8n (${eventType}/${aggregateId}): ${err?.message}`);
        }
    }
}