import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsageHistory, UsageHistoryDocument } from './schemas/usage-history.schema';
import { Role } from '../auth/enums/role.enum';

const STUDENT_RECOMMENDATION_LIMIT = 3;

@Injectable()
export class RecommendationsService {
    constructor(
        @InjectModel(UsageHistory.name)
        private readonly usageHistoryModel: Model<UsageHistoryDocument>,
    ) { }

    async getRecommendations(userId: string, role: Role): Promise<string[]> {
        const history = await this.usageHistoryModel
            .find({ userId })
            .sort({ usageCount: -1 })
            .exec();

        const slotIds = history.map((entry) => entry.slotId);

        if (role === Role.STUDENT) {
            return slotIds.slice(0, STUDENT_RECOMMENDATION_LIMIT);
        }

        return slotIds;
    }
}