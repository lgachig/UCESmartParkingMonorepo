import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { CreateSlotDto, UpdateSlotDto, SearchSlotsQueryDto, NearbySlotsQueryDto, SlotStatus } from './dto/slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Slots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @ApiOperation({ summary: 'Create new parking slot (Admin only)' })
  @ApiResponse({ status: 201, description: 'Slot created successfully' })
  @Roles(Role.ADMIN)
  @Post()
  create(
    @Body() createSlotDto: CreateSlotDto,
    @Req() req: any,
  ) {
    return this.slotsService.create(createSlotDto, req.user?.userId);
  }

  @ApiOperation({ summary: 'Get all slots' })
  @ApiResponse({ status: 200, description: 'List of all slots' })
  @Get()
  findAll() {
    return this.slotsService.findAll();
  }

  @ApiOperation({ summary: 'Get available slots' })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  @Get('available')
  findAvailable() {
    return this.slotsService.findByStatus(SlotStatus.AVAILABLE);
  }

  @ApiOperation({ summary: 'Get occupied slots' })
  @ApiResponse({ status: 200, description: 'List of occupied slots' })
  @Get('occupied')
  findOccupied() {
    return this.slotsService.findByStatus(SlotStatus.OCCUPIED);
  }

  @ApiOperation({ summary: 'Get reserved slots' })
  @ApiResponse({ status: 200, description: 'List of reserved slots' })
  @Get('reserved')
  findReserved() {
    return this.slotsService.findByStatus(SlotStatus.RESERVED);
  }

  @ApiOperation({ summary: 'Get maintenance slots' })
  @ApiResponse({ status: 200, description: 'List of maintenance slots' })
  @Get('maintenance')
  findMaintenance() {
    return this.slotsService.findByStatus(SlotStatus.MAINTENANCE);
  }

  @ApiOperation({ summary: 'Advanced search for slots' })
  @ApiResponse({ status: 200, description: 'Filtered slots' })
  @Get('search')
  search(@Query() query: SearchSlotsQueryDto) {
    return this.slotsService.search(query.facultyId, query.zoneId, query.status);
  }

  @ApiOperation({ summary: 'Find slots nearby coordinates' })
  @ApiResponse({ status: 200, description: 'Available slots sorted by distance' })
  @Get('nearby')
  findNearby(@Query() query: NearbySlotsQueryDto) {
    return this.slotsService.findNearby(query.lat, query.lng, query.radius);
  }

  @ApiOperation({ summary: 'Get slot by ID' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiResponse({ status: 200, description: 'Slot details' })
  @ApiResponse({ status: 404, description: 'Slot not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slotsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update slot information (Admin only)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiResponse({ status: 200, description: 'Slot updated successfully' })
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSlotDto: UpdateSlotDto,
    @Req() req: any,
  ) {
    return this.slotsService.update(id, updateSlotDto, req.user?.userId);
  }

  @ApiOperation({ summary: 'Delete a slot (Admin only)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @ApiResponse({ status: 200, description: 'Slot deleted successfully' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.slotsService.remove(id, req.user?.userId);
  }

  // --- STATE TRANSITIONS ---

  @ApiOperation({ summary: 'Reserve a slot (AVAILABLE -> RESERVED)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Patch(':id/reserve')
  reserve(@Param('id') id: string, @Req() req: any) {
    return this.slotsService.reserve(id, req.user?.userId);
  }

  @ApiOperation({ summary: 'Occupy a slot (RESERVED -> OCCUPIED)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Patch(':id/occupy')
  occupy(@Param('id') id: string, @Req() req: any) {
    return this.slotsService.occupy(id, req.user?.userId);
  }

  @ApiOperation({ summary: 'Release a slot (RESERVED/OCCUPIED -> AVAILABLE)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Patch(':id/release')
  release(@Param('id') id: string, @Req() req: any) {
    return this.slotsService.release(id, req.user?.userId);
  }

  @ApiOperation({ summary: 'Set slot status to maintenance (Admin only)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Roles(Role.ADMIN)
  @Patch(':id/maintenance')
  maintenance(@Param('id') id: string, @Req() req: any) {
    return this.slotsService.maintenance(id, req.user?.userId);
  }

  @ApiOperation({ summary: 'Enable slot from maintenance (Admin only)' })
  @ApiParam({ name: 'id', example: 'uuid' })
  @Roles(Role.ADMIN)
  @Patch(':id/enable')
  enable(@Param('id') id: string, @Req() req: any) {
    return this.slotsService.enable(id, req.user?.userId);
  }
}
