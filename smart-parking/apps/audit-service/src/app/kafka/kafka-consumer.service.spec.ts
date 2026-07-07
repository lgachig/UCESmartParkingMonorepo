import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuditKafkaConsumerService } from './kafka-consumer.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

jest.mock('kafkajs', () => {
    const mockConsumer = {
        connect: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockResolvedValue(undefined),
        run: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
    };
    return {
        Kafka: jest.fn().mockImplementation(() => ({
            consumer: jest.fn().mockReturnValue(mockConsumer),
        })),
    };
});

describe('AuditKafkaConsumerService', () => {
    let service: AuditKafkaConsumerService;

    const prismaMock = {
        auditRecord: {
            create: jest.fn(),
        },
    };

    const configMock = {
        get: jest.fn().mockReturnValue('kafka:29092'),
    };

    const metricsMock = {
        eventsAuditedTotal: { inc: jest.fn() },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditKafkaConsumerService,
                { provide: ConfigService, useValue: configMock },
                { provide: PrismaService, useValue: prismaMock },
                { provide: MetricsService, useValue: metricsMock },
            ],
        }).compile();

        service = module.get(AuditKafkaConsumerService);
        jest.clearAllMocks();
    });

    it('subscribes with a regex matching all business topics on init', async () => {
        await service.onModuleInit();

        expect((service as any).consumer.subscribe).toHaveBeenCalledWith(
            expect.objectContaining({ topic: expect.any(RegExp), fromBeginning: true }),
        );

        const { topic } = (service as any).consumer.subscribe.mock.calls[0][0];
        expect(topic.test('reservation.cancelled')).toBe(true);
        expect(topic.test('slot.created')).toBe(true);
        expect(topic.test('any.future.topic.no.code.change.needed')).toBe(true);
        expect(topic.test('__consumer_offsets')).toBe(false);
    });

    it('inserts a new record for a parseable event and never calls update/delete', async () => {
        prismaMock.auditRecord.create.mockResolvedValue({});

        await (service as any).persistEvent('reservation.cancelled', 0, {
            value: Buffer.from(JSON.stringify({ id: 'r1', userId: 'u1', slotId: 's1' })),
            offset: '10',
        });

        expect(prismaMock.auditRecord.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    sourceService: 'reservation',
                    action: 'reservation.cancelled',
                    userId: 'u1',
                    newValue: { id: 'r1', userId: 'u1', slotId: 's1' },
                }),
            }),
        );
        expect((service as any).update).toBeUndefined();
        expect((service as any).delete).toBeUndefined();
        expect(metricsMock.eventsAuditedTotal.inc).toHaveBeenCalledWith({
            topic: 'reservation.cancelled',
            status: 'recorded',
        });
    });

    it('records unparseable messages with their raw content instead of discarding them', async () => {
        prismaMock.auditRecord.create.mockResolvedValue({});

        await (service as any).persistEvent('slot.updated', 0, {
            value: Buffer.from('{not valid json'),
            offset: '11',
        });

        expect(prismaMock.auditRecord.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    sourceService: 'slot',
                    action: 'slot.updated',
                    rawPayload: expect.objectContaining({
                        raw: '{not valid json',
                        parseError: expect.any(String),
                    }),
                }),
            }),
        );
        expect(metricsMock.eventsAuditedTotal.inc).toHaveBeenCalledWith({
            topic: 'slot.updated',
            status: 'raw',
        });
    });

    it('rethrows on DB failure so kafkajs does not commit the offset (no silent event loss)', async () => {
        prismaMock.auditRecord.create.mockRejectedValue(new Error('DB down'));

        await expect(
            (service as any).persistEvent('payment.completed', 0, {
                value: Buffer.from(JSON.stringify({ id: 'p1' })),
                offset: '12',
            }),
        ).rejects.toThrow('DB down');

        expect(metricsMock.eventsAuditedTotal.inc).toHaveBeenCalledWith({
            topic: 'payment.completed',
            status: 'failed',
        });
    });
});