import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) { }

  @ApiOperation({ summary: 'Get vehicle statistics for admin dashboard (admin)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Aggregated vehicle statistics' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stats')
  getStats() {
    return this.vehiclesService.getStats();
  }

  @ApiOperation({ summary: 'Get my registered vehicle' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Vehicle found' })
  @ApiResponse({ status: 404, description: 'No vehicle registered' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@Req() req: { user: { userId: string } }) {
    return this.vehiclesService.findMine(req.user.userId);
  }

  @ApiOperation({ summary: 'Register my vehicle (one per user)' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({ status: 201, description: 'Vehicle created' })
  @ApiResponse({ status: 409, description: 'User already has a vehicle' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('me')
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Update my vehicle' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, description: 'Vehicle updated' })
  @ApiResponse({ status: 404, description: 'No vehicle registered' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete my vehicle' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Vehicle deleted' })
  @ApiResponse({ status: 404, description: 'No vehicle registered' })
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  remove(@Req() req: { user: { userId: string } }) {
    return this.vehiclesService.remove(req.user.userId);
  }

  @ApiOperation({ summary: 'Get vehicle by ID (admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle found' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }
}