import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { SlotStatus } from './dto/slot.dto';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/slots')
export class InternalSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @ApiOperation({ summary: 'Get internal details of a slot (Service key required)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiResponse({ status: 200, description: 'Slot details' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slotsService.findOne(id);
  }

  @ApiOperation({ summary: 'Verify slot availability (Service key required)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiResponse({ status: 200, description: 'True if AVAILABLE, false otherwise' })
  @Get(':id/availability')
  async checkAvailability(@Param('id') id: string) {
    try {
      const slot = await this.slotsService.findOne(id);
      return slot.status === SlotStatus.AVAILABLE;
    } catch {
      return false;
    }
  }

  @ApiOperation({ summary: 'Reserve slot internally (Service key required)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Patch(':id/reserve')
  reserve(@Param('id') id: string) {
    return this.slotsService.reserve(id, 'INTERNAL_SERVICE');
  }

  @ApiOperation({ summary: 'Occupy slot internally (Service key required)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Patch(':id/occupy')
  occupy(@Param('id') id: string) {
    return this.slotsService.occupy(id, 'INTERNAL_SERVICE');
  }

  @ApiOperation({ summary: 'Release slot internally (Service key required)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Patch(':id/release')
  release(@Param('id') id: string) {
    return this.slotsService.release(id, 'INTERNAL_SERVICE');
  }
}
