import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsageHistoryDocument = UsageHistory & Document;

@Schema({ timestamps: true, collection: 'usage_history' })
export class UsageHistory {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true })
    slotId: string;

    @Prop({ required: true, default: 1 })
    usageCount: number;
}

export const UsageHistorySchema = SchemaFactory.createForClass(UsageHistory);
UsageHistorySchema.index({ userId: 1, slotId: 1 }, { unique: true });