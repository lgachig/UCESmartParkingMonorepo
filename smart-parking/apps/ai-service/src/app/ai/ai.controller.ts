import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @ApiOperation({ summary: 'AI service health check' })
    @Get('health')
    healthCheck() {
        return this.aiService.healthCheck();
    }
}