import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';
import { MetricsService } from '../metrics/metrics.service';

jest.mock('nodemailer');

describe('MailService', () => {
    const validEnv: Record<string, string | number> = {
        SMTP_HOST: 'sandbox.smtp.mailtrap.io',
        SMTP_PORT: 2525,
        SMTP_USER: '49b879b93d7866',
        SMTP_PASS: 'fake-pass-fea7',
        SMTP_FROM: 'Private Person <from@example.com>',
    };

    let sendMailMock: jest.Mock;
    let createTransportMock: jest.Mock;

    const buildModule = async (env: Record<string, string | number | undefined>) => {
        sendMailMock = jest.fn().mockResolvedValue({ messageId: '<fake-id@mailtrap>' });
        createTransportMock = (nodemailer.createTransport as jest.Mock).mockReturnValue({
            sendMail: sendMailMock,
        });

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

    describe('configuración del transporter (createTransport)', () => {
        it('debe crear el transporter con host/port/user/pass tomados del ConfigService', async () => {
            await buildModule(validEnv);

            expect(createTransportMock).toHaveBeenCalledTimes(1);
            expect(createTransportMock).toHaveBeenCalledWith({
                host: validEnv.SMTP_HOST,
                port: validEnv.SMTP_PORT,
                secure: false,
                auth: {
                    user: validEnv.SMTP_USER,
                    pass: validEnv.SMTP_PASS,
                },
            });
        });

        it('detecta el bug típico: variables SMTP_* undefined si el CI/CD no las inyectó', async () => {
            const emptyEnv = {
                SMTP_HOST: undefined,
                SMTP_PORT: undefined,
                SMTP_USER: undefined,
                SMTP_PASS: undefined,
                SMTP_FROM: undefined,
            };

            await buildModule(emptyEnv);

            const callArgs = createTransportMock.mock.calls[0][0];
            // Si esto falla mostrando "undefined", es la prueba de que Nest arma el
            // transporter con credenciales vacías -> Mailtrap responderá
            // "Missing credentials for PLAIN/LOGIN" o timeout de conexión.
            expect(callArgs.host).toBeUndefined();
            expect(callArgs.auth.user).toBeUndefined();
            expect(callArgs.auth.pass).toBeUndefined();
        });
    });

    describe('send()', () => {
        it('envía el correo con from/to/subject/html correctos y registra la métrica de éxito', async () => {
            const { mailService, metrics } = await buildModule(validEnv);

            await mailService.send({
                to: 'destinatario@example.com',
                subject: 'Reserva confirmada',
                html: '<p>Tu reserva fue confirmada</p>',
            });

            expect(sendMailMock).toHaveBeenCalledTimes(1);
            expect(sendMailMock).toHaveBeenCalledWith({
                from: validEnv.SMTP_FROM,
                to: 'destinatario@example.com',
                subject: 'Reserva confirmada',
                html: '<p>Tu reserva fue confirmada</p>',
            });
            expect(metrics.emailsSentTotal.inc).toHaveBeenCalledWith({
                type: 'Reserva confirmada',
            });
            expect(metrics.emailsFailedTotal.inc).not.toHaveBeenCalled();
        });

        it('si Mailtrap/SMTP rechaza el envío, propaga el error y registra la métrica de fallo', async () => {
            const { mailService, metrics } = await buildModule(validEnv);

            const smtpError = new Error('Invalid login: 535 5.7.8 Authentication credentials invalid');
            sendMailMock.mockRejectedValueOnce(smtpError);

            await expect(
                mailService.send({
                    to: 'destinatario@example.com',
                    subject: 'Pago no procesado',
                    html: '<p>Fallo</p>',
                }),
            ).rejects.toThrow('Authentication credentials invalid');

            expect(metrics.emailsFailedTotal.inc).toHaveBeenCalledWith({
                type: 'Pago no procesado',
            });
            expect(metrics.emailsSentTotal.inc).not.toHaveBeenCalled();
        });

        it('si SMTP_FROM no está seteado, el correo sale con from=undefined (síntoma de variables faltantes)', async () => {
            const { mailService } = await buildModule({ ...validEnv, SMTP_FROM: undefined });

            await mailService.send({
                to: 'destinatario@example.com',
                subject: 'Reserva confirmada',
                html: '<p>ok</p>',
            });

            expect(sendMailMock).toHaveBeenCalledWith(
                expect.objectContaining({ from: undefined }),
            );
        });
    });
});