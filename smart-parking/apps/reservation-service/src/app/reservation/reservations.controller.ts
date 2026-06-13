import {
  Body, Controller, Get, Param, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: 'Create a reservation (student, professor, guest)' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  @ApiResponse({ status: 409, description: 'Slot unavailable or user has active reservation' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.GUEST, Role.ADMIN)
  @Post()
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Get my reservation history' })
  @ApiResponse({ status: 200, description: 'Reservation list' })
  @Get('my-reservations')
  findMyReservations(@Req() req: { user: { userId: string } }) {
    return this.reservationsService.findMyReservations(req.user.userId);
  }

  @ApiOperation({ summary: 'List active reservations (admin)' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('active')
  findActive() {
    return this.reservationsService.findByStatus('ACTIVE');
  }

  @ApiOperation({ summary: 'List pending reservations (admin)' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('pending')
  findPending() {
    return this.reservationsService.findByStatus('PENDING');
  }

  @ApiOperation({ summary: 'List completed reservations (admin)' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('completed')
  findCompleted() {
    return this.reservationsService.findByStatus('COMPLETED');
  }

  @ApiOperation({ summary: 'Get reservation statistics (admin)' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('statistics')
  getStatistics() {
    return this.reservationsService.getStatistics();
  }

  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.reservationsService.findById(id);
  }

  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.PROFESSOR, Role.GUEST, Role.ADMIN)
  @Put(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reservationsService.cancel(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Check-in: activate reservation when user arrives' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Check-in successful' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':id/check-in')
  checkIn(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reservationsService.checkIn(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Check-out: complete reservation and release slot' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Check-out successful, duration calculated' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':id/check-out')
  checkOut(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.reservationsService.checkOut(id, req.user.userId);
  }
}