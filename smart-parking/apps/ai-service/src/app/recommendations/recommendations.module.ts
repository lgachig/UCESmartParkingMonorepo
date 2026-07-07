import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { UsageHistory, UsageHistorySchema } from './schemas/usage-history.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        AuthModule,
        MongooseModule.forFeature([
            { name: UsageHistory.name, schema: UsageHistorySchema },
        ]),
    ],
    controllers: [RecommendationsController],
    providers: [RecommendationsService],
})
export class RecommendationsModule { }