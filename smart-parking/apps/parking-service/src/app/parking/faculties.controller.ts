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
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/faculty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Faculties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('faculties')
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  @ApiOperation({ summary: 'Create new faculty (Admin only)' })
  @ApiResponse({ status: 201, description: 'Faculty created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required)' })
  @Roles(Role.ADMIN)
  @Post()
  create(
    @Body() createFacultyDto: CreateFacultyDto,
    @Req() req: any,
  ) {
    return this.facultiesService.create(createFacultyDto, req.user?.userId);
  }

  @ApiOperation({ summary: 'Get all faculties' })
  @ApiResponse({ status: 200, description: 'List of all faculties' })
  @Get()
  findAll() {
    return this.facultiesService.findAll();
  }

  @ApiOperation({ summary: 'Get a specific faculty by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Faculty details' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facultiesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update faculty information (Admin only)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Faculty updated successfully' })
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacultyDto: UpdateFacultyDto,
    @Req() req: any,
  ) {
    return this.facultiesService.update(id, updateFacultyDto, req.user?.userId);
  }

  @ApiOperation({ summary: 'Delete a faculty (Admin only)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Faculty deleted successfully' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.facultiesService.remove(id, req.user?.userId);
  }
}
