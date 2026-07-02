import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReservationClientService } from './reservation-client.service';
import { UserClientService } from './user-client.service';

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  providers: [ReservationClientService, UserClientService],
  exports: [ReservationClientService, UserClientService],
})
export class ClientsModule {}
