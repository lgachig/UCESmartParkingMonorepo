import { Injectable } from '@nestjs/common';
import { Role } from '../auth/enums/role.enum';

export const STUDENT_RATE_PER_HOUR = 10;
export const GUEST_RATE_PER_HOUR = 10;

export interface FeeCalculationResult {
  amount: number;
  durationMinutes: number;
  ratePerHour: number;
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
        durationMinutes,
        ratePerHour: 0,
        role: normalizedRole,
        currency: 'USD',
      };
    }

    const safeDuration = durationMinutes > 0 ? durationMinutes : 0;
    const ratePerHour =
      normalizedRole === Role.STUDENT
        ? STUDENT_RATE_PER_HOUR
        : GUEST_RATE_PER_HOUR;

    const amount = Math.round((safeDuration / 60) * ratePerHour * 100) / 100;

    return {
      amount,
      durationMinutes: safeDuration,
      ratePerHour,
      role: normalizedRole,
      currency: 'USD',
    };
  }
}