import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MailService } from './mail.service';
import { MetricsService } from '../metrics/metrics.service';

jest.mock('axios');

describe('MailService', () => {
    const validEnv: Record<string, string> = {
        EMAILJS_SERVICE_ID: 'service_abc123',
        EMAILJS_TEMPLATE_ID: 'template_abc123',
        EMAILJS_PUBLIC_KEY: 'public_key_abc123',
        EMAILJS_PRIVATE_KEY: 'private_key_abc123',
    };

    let axiosPostMock: jest.Mock;

    const buildModule = async (env: Record<string, string | undefined>) => {
        axiosPostMock = (axios.post as jest.Mock).mockResolvedValue({ data: 'OK' });

        const moduleRef = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => env[key]),
                    },
                },
                {
                    provide: MetricsService,
                    useValue: {
                        emailsSentTotal: { inc: jest.fn() },
                        emailsFailedTotal: { inc: jest.fn() },
                    },
                },
            ],
        }).compile();

        return {
            mailService: moduleRef.get<MailService>(MailService),
            metrics: moduleRef.get<MetricsService>(MetricsService),
        };
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('send()', () => {
        it('envía el correo con service_id/template_id/keys correctos y registra la métrica de éxito', async () => {
            const { mailService, metrics } = await buildModule(validEnv);

            await mailService.send({
                to: 'destinatario@example.com',
                subject: 'Reserva confirmada',
                html: '<p>Tu reserva fue confirmada</p>',
            });

            expect(axiosPostMock).toHaveBeenCalledTimes(1);
            expect(axiosPostMock).toHaveBeenCalledWith(
                'https://api.emailjs.com/api/v1.0/email/send',
                expect.objectContaining({
                    service_id: validEnv.EMAILJS_SERVICE_ID,
                    template_id: validEnv.EMAILJS_TEMPLATE_ID,
                    user_id: validEnv.EMAILJS_PUBLIC_KEY,
                    accessToken: validEnv.EMAILJS_PRIVATE_KEY,
                    template_params: expect.objectContaining({
                        to_email: 'destinatario@example.com',
                        subject: 'Reserva confirmada',
                        html_content: '<p>Tu reserva fue confirmada</p>',
                    }),
                }),
            );
            expect(metrics.emailsSentTotal.inc).toHaveBeenCalledWith({
                type: 'Reserva confirmada',
            });
            expect(metrics.emailsFailedTotal.inc).not.toHaveBeenCalled();
        });

        it('detecta el bug típico: variables EMAILJS_* undefined si el CI/CD no las inyectó', async () => {
            const emptyEnv = {
                EMAILJS_SERVICE_ID: undefined,
                EMAILJS_TEMPLATE_ID: undefined,
                EMAILJS_PUBLIC_KEY: undefined,
                EMAILJS_PRIVATE_KEY: undefined,
            };

            const { mailService } = await buildModule(emptyEnv);

            await mailService.send({
                to: 'destinatario@example.com',
                subject: 'Reserva confirmada',
                html: '<p>ok</p>',
            });

            const callArgs = axiosPostMock.mock.calls[0][1];
            expect(callArgs.service_id).toBeUndefined();
            expect(callArgs.user_id).toBeUndefined();
            expect(callArgs.accessToken).toBeUndefined();
        });

        it('si EmailJS rechaza el envío, propaga el error y registra la métrica de fallo', async () => {
            const { mailService, metrics } = await buildModule(validEnv);

            const apiError = new Error('Request failed with status code 401');
            axiosPostMock.mockRejectedValueOnce(apiError);

            await expect(
                mailService.send({
                    to: 'destinatario@example.com',
                    subject: 'Pago no procesado',
                    html: '<p>Fallo</p>',
                }),
            ).rejects.toThrow('Request failed with status code 401');

            expect(metrics.emailsFailedTotal.inc).toHaveBeenCalledWith({
                type: 'Pago no procesado',
            });
            expect(metrics.emailsSentTotal.inc).not.toHaveBeenCalled();
        });
    });
});