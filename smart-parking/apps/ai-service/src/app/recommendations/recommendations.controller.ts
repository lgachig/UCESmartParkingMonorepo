import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';
import { Role } from '../auth/enums/role.enum';

interface AuthenticatedRequest extends Request {
    user: { userId: string; email: string; role: Role };
}

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
    constructor(private readonly recommendationsService: RecommendationsService) { }

    @ApiOperation({ summary: 'Get slot recommendations for the authenticated user' })
    @ApiQuery({ name: 'lat', required: false, type: Number })
    @ApiQuery({ name: 'lng', required: false, type: Number })
    @Get()
    async getRecommendations(
        @Req() req: AuthenticatedRequest,
        @Query('lat') lat?: number,
        @Query('lng') lng?: number,
    ) {
        return this.recommendationsService.getRecommendations(
            req.user.userId,
            req.user.role,
            lat !== undefined ? Number(lat) : undefined,
            lng !== undefined ? Number(lng) : undefined,
        );
    }
}