import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MetricsService } from '../metrics/metrics.service';

export interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        private readonly configService: ConfigService,
        private readonly metrics: MetricsService,
    ) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async send(options: SendMailOptions): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_FROM'),
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            this.metrics.emailsSentTotal.inc({ type: options.subject });
        } catch (err: any) {
            this.metrics.emailsFailedTotal.inc({ type: options.subject });
            this.logger.error(
                `Fallo enviando email a ${options.to} (subject: "${options.subject}"): ${err.message}`,
            );
            throw err;
        }
    }
}