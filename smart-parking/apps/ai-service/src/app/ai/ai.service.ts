import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
    healthCheck() {
        return { status: 'ok', service: 'ai-service' };
    }
}