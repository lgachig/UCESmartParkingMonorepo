import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import {
  PaginationQueryDto,
  SearchUsersQueryDto,
} from '../dto/search-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiOperation({ summary: 'Create user profile (internal - auth-service only)' })
  @ApiBody({ type: CreateUserProfileDto })
  @ApiResponse({ status: 201, description: 'Profile created' })
  @ApiResponse({ status: 401, description: 'Invalid service key' })
  @UseGuards(ServiceKeyGuard)
  @Post()
  create(@Body() dto: CreateUserProfileDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: 'Get my profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'JWT required' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@Req() req: { user: { userId: string } }) {
    return this.usersService.findMe(req.user.userId);
  }

  @ApiOperation({ summary: 'Update my profile' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 429, description: 'Too many requests (limit: 10/min)' })
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Search users (admin)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'q', required: true, example: 'Luis' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 429, description: 'Too many requests (limit: 15/min)' })
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('search')
  search(@Query() query: SearchUsersQueryDto) {
    return this.usersService.search(query.q, query.page, query.limit);
  }

  @ApiOperation({ summary: 'Get user statistics for admin dashboard (admin)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Aggregated user statistics' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('stats')
  getStats() {
    return this.usersService.getStats();
  }

  @ApiOperation({ summary: 'List all active profiles (admin)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated profile list' })
  @ApiResponse({ status: 429, description: 'Too many requests (limit: 15/min)' })
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query.page, query.limit);
  }

  @ApiOperation({ summary: 'Get profile by auth user ID (admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'authUserId', example: '406fda9e-8ebc-4816-95d7-6af3d1af4392' })
  @ApiResponse({ status: 200, description: 'Profile found' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('profile/:authUserId')
  findByAuthUserId(@Param('authUserId') authUserId: string) {
    return this.usersService.findByAuthUserId(authUserId);
  }

  @ApiOperation({ summary: 'Get profile by profile ID (admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Internal profile UUID' })
  @ApiResponse({ status: 200, description: 'Profile found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Update profile by ID (admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Internal profile UUID' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({ status: 429, description: 'Too many requests (limit: 10/min)' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({ summary: 'Deactivate profile (admin soft delete)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Internal profile UUID' })
  @ApiResponse({ status: 200, description: 'Profile deactivated' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}