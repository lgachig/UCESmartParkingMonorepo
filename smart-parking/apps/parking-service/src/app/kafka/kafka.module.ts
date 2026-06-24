import { Global, Module, forwardRef } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { ParkingModule } from '../parking/parking.module';

@Global()
@Module({
  imports: [forwardRef(() => ParkingModule)],
  providers: [KafkaService, KafkaConsumerService],
  exports: [KafkaService],
})
export class KafkaModule {}