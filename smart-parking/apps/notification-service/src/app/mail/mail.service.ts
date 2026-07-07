import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MetricsService } from '../metrics/metrics.service';

export interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

    constructor(
        private readonly configService: ConfigService,
        private readonly metrics: MetricsService,
    ) { }

    async send(options: SendMailOptions): Promise<void> {
        try {
            await axios.post(this.EMAILJS_API_URL, {
                service_id: this.configService.get<string>('EMAILJS_SERVICE_ID'),
                template_id: this.configService.get<string>('EMAILJS_TEMPLATE_ID'),
                user_id: this.configService.get<string>('EMAILJS_PUBLIC_KEY'),
                accessToken: this.configService.get<string>('EMAILJS_PRIVATE_KEY'),
                template_params: {
                    to_email: options.to,
                    subject: options.subject,
                    html_content: options.html,
                    from_email: this.configService.get<string>('EMAILJS_FROM_EMAIL'),
                },
            });
            this.metrics.emailsSentTotal.inc({ type: options.subject });
        } catch (err: any) {
            this.metrics.emailsFailedTotal.inc({ type: options.subject });
            this.logger.error(
                `Fallo enviando email a ${options.to} (subject: "${options.subject}"): ${err.response?.data ?? err.message}`,
            );
            throw err;
        }
    }
}