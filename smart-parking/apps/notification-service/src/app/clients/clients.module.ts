import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthClientService } from './auth-client.service';
import { ParkingClientService } from './parking-client.service';

@Module({
    imports: [HttpModule.register({ timeout: 5000 })],
    providers: [AuthClientService, ParkingClientService],
    exports: [AuthClientService, ParkingClientService],
})
export class ClientsModule { }