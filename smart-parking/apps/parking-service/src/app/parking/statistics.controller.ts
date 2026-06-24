import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly slotsService: SlotsService) {}

  @ApiOperation({ summary: 'Get global system statistics' })
  @ApiResponse({ status: 200, description: 'Occupancy statistics summary' })
  @Get()
  getGlobalStats() {
    return this.slotsService.getGlobalStats();
  }

  @ApiOperation({ summary: 'Get statistics grouped by faculty' })
  @ApiResponse({ status: 200, description: 'Occupancy stats by faculty' })
  @Get('faculties')
  getFacultyStats() {
    return this.slotsService.getFacultyStats();
  }

  @ApiOperation({ summary: 'Get statistics grouped by zone' })
  @ApiResponse({ status: 200, description: 'Occupancy stats by zone' })
  @Get('zones')
  getZoneStats() {
    return this.slotsService.getZoneStats();
  }
}
