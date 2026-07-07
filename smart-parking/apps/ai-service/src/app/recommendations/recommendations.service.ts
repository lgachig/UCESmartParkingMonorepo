import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsageHistory, UsageHistoryDocument } from './schemas/usage-history.schema';
import { Role } from '../auth/enums/role.enum';
import { ParkingClientService } from '../parking-client/parking-client.service';
import { SearchClientService } from '../search-client/search-client.service';

const STUDENT_RECOMMENDATION_LIMIT = 3;

export interface RecommendationResult {
    slotIds: string[];
    replacedFavorite?: { original: string; replacement: string };
}

@Injectable()
export class RecommendationsService {
    constructor(
        @InjectModel(UsageHistory.name)
        private readonly usageHistoryModel: Model<UsageHistoryDocument>,
        private readonly parkingClientService: ParkingClientService,
        private readonly searchClientService: SearchClientService,
    ) { }

    async getRecommendations(
        userId: string,
        role: Role,
        lat?: number,
        lng?: number,
    ): Promise<RecommendationResult> {
        const history = await this.usageHistoryModel
            .find({ userId })
            .sort({ usageCount: -1 })
            .exec();

        let slotIds = history.map((entry) => entry.slotId);

        if (role === Role.STUDENT) {
            slotIds = slotIds.slice(0, STUDENT_RECOMMENDATION_LIMIT);
        }

        if (slotIds.length === 0) {
            return { slotIds: [] };
        }

        const favoriteSlot = slotIds[0];
        const isAvailable = await this.parkingClientService.isSlotAvailable(favoriteSlot);

        if (!isAvailable && lat !== undefined && lng !== undefined) {
            const nearest = await this.searchClientService.findNearestSlot(lat, lng);
            if (nearest) {
                const replaced = [...slotIds];
                replaced[0] = nearest.slotId;
                return {
                    slotIds: replaced,
                    replacedFavorite: { original: favoriteSlot, replacement: nearest.slotId },
                };
            }
        }

        return { slotIds };
    }

    async recordUsage(userId: string, slotId: string): Promise<void> {
        await this.usageHistoryModel.findOneAndUpdate(
            { userId, slotId },
            { $inc: { usageCount: 1 } },
            { upsert: true, new: true },
        );
    }
}