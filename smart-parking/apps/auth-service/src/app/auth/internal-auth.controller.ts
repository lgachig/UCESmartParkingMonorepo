import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
    ApiHeader,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ServiceKeyGuard } from './guards/service-key.guard';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/auth')
export class InternalAuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiOperation({ summary: 'Get user email by ID (internal)' })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Get('users/:id')
    findEmailById(@Param('id') id: string) {
        return this.authService.findEmailById(id);
    }
}