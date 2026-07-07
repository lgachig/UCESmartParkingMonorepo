import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface UserEmailInfo {
    id: string;
    email: string;
}

@Injectable()
export class AuthClientService {
    private readonly logger = new Logger(AuthClientService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    private get baseUrl(): string {
        const url = this.configService.get<string>('AUTH_SERVICE_URL')!;
        return url.endsWith('/api') ? url : `${url}/api`;
    }

    private get serviceKey(): string {
        return this.configService.get<string>('INTERNAL_SERVICE_KEY')!;
    }

    async getEmailByUserId(userId: string): Promise<UserEmailInfo> {
        const response = await firstValueFrom(
            this.httpService.get(
                `${this.baseUrl}/internal/auth/users/${userId}`,
                { headers: { 'x-service-key': this.serviceKey } },
            ),
        );
        return response.data.data;
    }
}