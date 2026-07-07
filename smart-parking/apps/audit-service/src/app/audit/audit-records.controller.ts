import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditRecordsService } from './audit-records.service';
import { QueryAuditRecordsDto } from './dto/query-audit-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('audit')
export class AuditRecordsController {
  constructor(private readonly auditRecordsService: AuditRecordsService) {}

  @ApiOperation({
    summary: 'Query the immutable audit history (Admin only)',
    description:
      'Filter by source service, action type and date range. Read-only: there is no endpoint that modifies or deletes an audit record.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of audit records' })
  @Get()
  findAll(@Query() query: QueryAuditRecordsDto) {
    return this.auditRecordsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a single audit record by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Audit record UUID' })
  @ApiResponse({ status: 200, description: 'Audit record detail' })
  @ApiResponse({ status: 404, description: 'Audit record not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditRecordsService.findOne(id);
  }
}
