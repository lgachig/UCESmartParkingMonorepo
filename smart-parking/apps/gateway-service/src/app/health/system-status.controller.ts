import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGatewayGuard, GatewayUser } from '../auth/jwt-gateway.guard';
import { UpstreamHealthService } from './upstream-health.service';

@ApiTags('System')
@ApiExcludeController()
@Controller('api/system')
@UseGuards(JwtGatewayGuard)
export class SystemStatusController {
    constructor(private readonly upstreamHealthService: UpstreamHealthService) { }

    @ApiOperation({ summary: 'Estado agregado del sistema para el dashboard admin' })
    @Get('status')
    async getStatus(@Req() req: Request) {
        const user = (req as Request & { user?: GatewayUser }).user;
        if (user?.role !== 'ADMIN') {
            throw new ForbiddenException('Solo un administrador puede ver el estado del sistema');
        }

        const [services, realtimeConnections, outbox] = await Promise.all([
            this.upstreamHealthService.checkAll(),
            this.upstreamHealthService.getRealtimeConnections(),
            this.upstreamHealthService.getOutboxSummary(),
        ]);

        const servicesDown = services.filter((s) => !s.up);

        return {
            generatedAt: new Date().toISOString(),
            overallStatus: servicesDown.length === 0 ? 'operational' : 'degraded',
            services,
            summary: {
                total: services.length,
                up: services.filter((s) => s.up).length,
                down: servicesDown.length,
                downNames: servicesDown.map((s) => s.name),
            },
            realtime: {
                connected: realtimeConnections !== null,
                activeConnections: realtimeConnections,
            },
            outbox,
        };
    }
}