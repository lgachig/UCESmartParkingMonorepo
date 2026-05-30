import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async createProfile(data: {
    authUserId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: string;
  }) {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL');
    const internalServiceKey = this.configService.get<string>(
      'INTERNAL_SERVICE_KEY',
    );
    const response = await firstValueFrom(
      this.httpService.post(`${userServiceUrl}/api/users`, data, {
        headers: {
          'x-service-key': internalServiceKey,
        },
      }),
    );
    return response.data;
  }
}