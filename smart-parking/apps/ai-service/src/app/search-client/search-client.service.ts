import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import CircuitBreaker = require('opossum');
import { MetricsService } from '../metrics/metrics.service';

export interface NearestSlotResult {
    slotId: string;
    distanceMeters: number;
}

@Injectable()
export class SearchClientService {
    private readonly logger = new Logger(SearchClientService.name);
    private readonly breaker: CircuitBreaker;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly metricsService: MetricsService,
    ) {
        this.breaker = new CircuitBreaker(
            (lat: number, lng: number) => this.callSearchService(lat, lng),
            {
                timeout: 2000,
                errorThresholdPercentage: 50,
                resetTimeout: 15000,
                rollingCountTimeout: 10000,
            },
        );

        this.breaker.on('open', () => {
            this.metricsService.circuitBreakerTrips.inc({ target: 'search-service' });
            this.logger.warn('Circuit breaker OPEN for search-service');
        });

        this.breaker.on('halfOpen', () => {
            this.logger.log('Circuit breaker HALF-OPEN for search-service, retrying');
        });

        this.breaker.on('close', () => {
            this.logger.log('Circuit breaker CLOSED for search-service');
        });

        this.breaker.fallback(() => null);
    }

    private async callSearchService(
        lat: number,
        lng: number,
    ): Promise<NearestSlotResult> {
        const baseUrl = this.configService.get<string>('SEARCH_SERVICE_URL');
        const response = await firstValueFrom(
            this.httpService.get(`${baseUrl}/api/nearest-slot`, {
                params: { lat, lng },
            }),
        );
        return response.data;
    }

    async findNearestSlot(
        lat: number,
        lng: number,
    ): Promise<NearestSlotResult | null> {
        try {
            return await this.breaker.fire(lat, lng);
        } catch {
            return null;
        }
    }
}