import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UserClientService } from './user-client.service';

@Module({
  imports: [HttpModule.register({ timeout: 5000 })],
  providers: [UserClientService],
  exports: [UserClientService],
})
export class UserClientModule {}