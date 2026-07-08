import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { NotificationService, SystemAlertEvent } from '../notifications/notification.service';

@ApiTags('Internal')
@ApiHeader({ name: 'x-service-key', required: true })
@UseGuards(ServiceKeyGuard)
@Controller('internal/system-alerts')
export class SystemAlertsController {
    constructor(private readonly notificationService: NotificationService) { }

    @ApiOperation({ summary: 'Recibe alertas de sistema (n8n / servicios internos) y las procesa (Service key required)' })
    @Post()
    @HttpCode(202)
    async receive(@Body() body: SystemAlertEvent) {
        if (!body?.service || !body?.severity || !body?.message) {
            return { accepted: false, reason: 'service, severity y message son requeridos' };
        }

        await this.notificationService.handleSystemAlert({
            ...body,
            timestamp: body.timestamp ?? new Date().toISOString(),
        });

        return { accepted: true };
    }
}