import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../user/users.service';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/users')
export class InternalUsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get user profile by auth user ID (internal)' })
  @ApiParam({ name: 'authUserId', description: 'Auth user UUID' })
  @ApiResponse({ status: 200, description: 'User profile found' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @Get('profile/:authUserId')
  findByAuthUserId(@Param('authUserId') authUserId: string) {
    return this.usersService.findByAuthUserId(authUserId);
  }
}
