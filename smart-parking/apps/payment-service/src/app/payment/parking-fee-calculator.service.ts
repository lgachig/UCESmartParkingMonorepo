import { Injectable } from '@nestjs/common';
import { Role } from '../auth/enums/role.enum';

export const BLOCK_MINUTES = 30;
export const STUDENT_RATE_PER_BLOCK = 0.15;
export const GUEST_RATE_PER_BLOCK = 0.25;

export interface FeeCalculationResult {
  amount: number;
  blocks: number;
  durationMinutes: number;
  ratePerBlock: number;
  role: string;
  currency: string;
}

@Injectable()
export class ParkingFeeCalculatorService {
  calculate(role: string, durationMinutes: number): FeeCalculationResult {
    const normalizedRole = role.toUpperCase();

    if (normalizedRole === Role.PROFESSOR || normalizedRole === Role.ADMIN) {
      return {
        amount: 0,
        blocks: 0,
        durationMinutes,
        ratePerBlock: 0,
        role: normalizedRole,
        currency: 'USD',
      };
    }

    const blocks =
      durationMinutes <= 0 ? 0 : Math.ceil(durationMinutes / BLOCK_MINUTES);
    const ratePerBlock =
      normalizedRole === Role.STUDENT
        ? STUDENT_RATE_PER_BLOCK
        : GUEST_RATE_PER_BLOCK;
    const amount = Math.round(blocks * ratePerBlock * 100) / 100;

    return {
      amount,
      blocks,
      durationMinutes,
      ratePerBlock,
      role: normalizedRole,
      currency: 'USD',
    };
  }
}
