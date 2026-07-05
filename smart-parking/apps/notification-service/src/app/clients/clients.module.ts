import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthClientService } from './auth-client.service';
import { ParkingClientService } from './parking-client.service';
import { ReservationClientService } from './reservation-client.service';

@Module({
    imports: [HttpModule.register({ timeout: 5000 })],
    providers: [AuthClientService, ParkingClientService, ReservationClientService],
    exports: [AuthClientService, ParkingClientService, ReservationClientService],
})
export class ClientsModule { }