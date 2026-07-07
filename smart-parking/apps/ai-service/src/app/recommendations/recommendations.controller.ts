import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
    @Get()
    async getRecommendations(@Req() req: AuthenticatedRequest) {
        return this.recommendationsService.getRecommendations(
            req.user.userId,
            req.user.role,
        );
    }
}