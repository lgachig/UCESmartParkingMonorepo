import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { CreateProfilePayload } from '../interfaces/create-profile-payload.interface';

@Injectable()
export class UserClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async createProfile(data: CreateProfilePayload) {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL')!;
    const baseUrl = userServiceUrl.endsWith('/api') ? userServiceUrl : `${userServiceUrl}/api`;
    const internalServiceKey = this.configService.get<string>(
      'INTERNAL_SERVICE_KEY',
    );
    const response = await firstValueFrom(
      this.httpService.post(`${baseUrl}/users`, data, {
        headers: {
          'x-service-key': internalServiceKey,
        },
      }),
    );
    return response.data;
  }
}