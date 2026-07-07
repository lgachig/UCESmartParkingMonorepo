import { aiApi } from '@/lib/api';

export interface RecommendationResult {
  slotIds: string[];
  replacedFavorite?: { original: string; replacement: string };
}

export const aiService = {
  async getRecommendations(lat?: number, lng?: number): Promise<RecommendationResult> {
    const params: Record<string, number> = {};
    if (lat !== undefined) params.lat = lat;
    if (lng !== undefined) params.lng = lng;

    const { data } = await aiApi.get<RecommendationResult>('/recommendations', { params });
    return data;
  },
};