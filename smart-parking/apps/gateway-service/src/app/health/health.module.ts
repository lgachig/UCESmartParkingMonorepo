import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SystemStatusController } from './system-status.controller';
import { UpstreamHealthService } from './upstream-health.service';

@Module({
  controllers: [HealthController, SystemStatusController],
  providers: [UpstreamHealthService],
})
export class HealthModule { }