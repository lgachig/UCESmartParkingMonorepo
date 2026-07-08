import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { OutboxService } from './outbox.service';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/outbox')
export class OutboxSummaryController {
  constructor(private readonly outboxService: OutboxService) {}

  @ApiOperation({ summary: 'Outbox event counts by status (service key required)' })
  @Get('summary')
  getSummary() {
    return this.outboxService.getSummary();
  }
}
