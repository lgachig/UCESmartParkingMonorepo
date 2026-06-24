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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @ApiOperation({ summary: 'Create new zone (Admin only)' })
  @ApiResponse({ status: 201, description: 'Zone created successfully' })
  @Roles(Role.ADMIN)
  @Post()
  create(
    @Body() createZoneDto: CreateZoneDto,
    @Req() req: any,
  ) {
    return this.zonesService.create(createZoneDto, req.user?.userId);
  }

  @ApiOperation({ summary: 'Get all zones' })
  @ApiResponse({ status: 200, description: 'List of all zones' })
  @Get()
  findAll() {
    return this.zonesService.findAll();
  }

  @ApiOperation({ summary: 'Get a specific zone by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Zone details' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.zonesService.findOne(id);
  }

  @ApiOperation({ summary: 'Get all zones of a faculty' })
  @ApiParam({ name: 'facultyId', example: 1 })
  @ApiResponse({ status: 200, description: 'List of zones belonging to faculty' })
  @Get('faculty/:facultyId')
  findByFaculty(@Param('facultyId', ParseIntPipe) facultyId: number) {
    return this.zonesService.findByFacultyId(facultyId);
  }

  @ApiOperation({ summary: 'Update zone information (Admin only)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Zone updated successfully' })
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateZoneDto: UpdateZoneDto,
    @Req() req: any,
  ) {
    return this.zonesService.update(id, updateZoneDto, req.user?.userId);
  }

  @ApiOperation({ summary: 'Delete a zone (Admin only)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Zone deleted successfully' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.zonesService.remove(id, req.user?.userId);
  }
}
