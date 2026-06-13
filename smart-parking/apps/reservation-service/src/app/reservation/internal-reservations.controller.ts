import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/reservations')
export class InternalReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: 'Get reservations by user ID (internal)' })
  @ApiParam({ name: 'userId', description: 'Auth user UUID' })
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.reservationsService.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Get reservations by vehicle ID (internal)' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle UUID' })
  @Get('vehicle/:vehicleId')
  findByVehicleId(@Param('vehicleId') vehicleId: string) {
    return this.reservationsService.findByVehicleId(vehicleId);
  }

  @ApiOperation({ summary: 'Get reservations by slot ID (internal)' })
  @ApiParam({ name: 'slotId', description: 'Slot UUID' })
  @Get('slot/:slotId')
  findBySlotId(@Param('slotId') slotId: string) {
    return this.reservationsService.findBySlotId(slotId);
  }

  @ApiOperation({ summary: 'Check if user has active reservation (internal)' })
  @ApiParam({ name: 'userId', description: 'Auth user UUID' })
  @Get('active/user/:userId')
  hasActiveByUser(@Param('userId') userId: string) {
    return this.reservationsService.hasActiveReservationByUser(userId);
  }

  @ApiOperation({ summary: 'Check if slot has active reservation (internal)' })
  @ApiParam({ name: 'slotId', description: 'Slot UUID' })
  @Get('active/slot/:slotId')
  hasActiveBySlot(@Param('slotId') slotId: string) {
    return this.reservationsService.hasActiveReservationBySlot(slotId);
  }

  @ApiOperation({
    summary: 'Admin cancel: force-cancel any reservation and release slot + Redis lock',
  })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled by admin' })
  @ApiResponse({ status: 400, description: 'Reservation already in a terminal state' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @Patch(':id/admin-cancel')
  adminCancel(
    @Param('id') id: string,
    @Req() req: { headers: Record<string, string> },
  ) {
    const adminUserId = req.headers['x-admin-user-id'] ?? 'ADMIN_SERVICE';
    return this.reservationsService.adminCancel(id, adminUserId);
  }
}