import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface UserProfileInfo {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable()
export class UserClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl(): string {
    const url = this.configService.get<string>('USER_SERVICE_URL')!;
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

  async getProfileByAuthUserId(authUserId: string): Promise<UserProfileInfo> {
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/internal/users/profile/${authUserId}`,
        { headers: { 'x-service-key': this.serviceKey } },
      ),
    );
    return this.unwrap<UserProfileInfo>(response.data);
  }
}
