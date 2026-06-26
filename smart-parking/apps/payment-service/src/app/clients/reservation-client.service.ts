import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ReservationInfo {
  id: string;
  userId: string;
  vehicleId: string;
  slotId: string;
  status: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  durationMinutes: number | null;
}

@Injectable()
export class ReservationClientService {
  private readonly logger = new Logger(ReservationClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl(): string {
    const url = this.configService.get<string>('RESERVATION_SERVICE_URL')!;
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  private get serviceKey(): string {
    return this.configService.get<string>('INTERNAL_SERVICE_KEY')!;
  }

  private unwrap<T>(payload: unknown): T {
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      (payload as { data: unknown }).data !== undefined
    ) {
      return (payload as { data: T }).data;
    }
    return payload as T;
  }

  async getReservationById(reservationId: string): Promise<ReservationInfo> {
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/internal/reservations/${reservationId}`,
        { headers: { 'x-service-key': this.serviceKey } },
      ),
    );
    return this.unwrap<ReservationInfo>(response.data);
  }
}
