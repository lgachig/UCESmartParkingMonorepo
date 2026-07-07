import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ParkingClientService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async isSlotAvailable(slotId: string): Promise<boolean> {
        const baseUrl = this.configService.get<string>('PARKING_SERVICE_URL');
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${baseUrl}/api/slots/${slotId}/status`),
            );
            return response.data?.status === 'AVAILABLE';
        } catch {
            return true;
        }
    }
}