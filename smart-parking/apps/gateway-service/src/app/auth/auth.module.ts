import { Module } from '@nestjs/common';
import { JwtGatewayGuard } from './jwt-gateway.guard';

@Module({
  providers: [JwtGatewayGuard],
  exports: [JwtGatewayGuard],
})
export class AuthModule {}
