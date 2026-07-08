import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { UsageHistory, UsageHistorySchema } from './schemas/usage-history.schema';
import { AuthModule } from '../auth/auth.module';
import { ParkingClientModule } from '../parking-client/parking-client.module';
import { SearchClientModule } from '../search-client/search-client.module';

@Module({
    imports: [
        AuthModule,
        ParkingClientModule,
        SearchClientModule,
        MongooseModule.forFeature([
            { name: UsageHistory.name, schema: UsageHistorySchema },
        ]),
    ],
    controllers: [RecommendationsController],
    providers: [RecommendationsService],
    exports: [RecommendationsService],
})
export class RecommendationsModule { }