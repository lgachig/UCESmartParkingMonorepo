import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface SlotInfo {
    id: string;
    number: string;
    zone?: { name: string };
}

@Injectable()
export class ParkingClientService {
    private readonly logger = new Logger(ParkingClientService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    private get baseUrl(): string {
        const url = this.configService.get<string>('PARKING_SERVICE_URL')!;
        return url.endsWith('/api') ? url : `${url}/api`;
    }

    private get serviceKey(): string {
        return this.configService.get<string>('INTERNAL_SERVICE_KEY')!;
    }

    async getSlotById(slotId: string): Promise<SlotInfo> {
        const response = await firstValueFrom(
            this.httpService.get(
                `${this.baseUrl}/parking/slots/${slotId}`,
                { headers: { 'x-service-key': this.serviceKey } },
            ),
        );
        return response.data;
    }
}