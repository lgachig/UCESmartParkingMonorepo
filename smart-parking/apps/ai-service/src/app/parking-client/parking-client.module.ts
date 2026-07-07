import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ParkingClientService } from './parking-client.service';

@Module({
    imports: [HttpModule.register({ timeout: 3000 })],
    providers: [ParkingClientService],
    exports: [ParkingClientService],
})
export class ParkingClientModule { }