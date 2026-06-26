import { Test, TestingModule } from '@nestjs/testing';
import {
  BLOCK_MINUTES,
  GUEST_RATE_PER_BLOCK,
  ParkingFeeCalculatorService,
  STUDENT_RATE_PER_BLOCK,
} from './parking-fee-calculator.service';
import { Role } from '../auth/enums/role.enum';

describe('ParkingFeeCalculatorService', () => {
  let service: ParkingFeeCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParkingFeeCalculatorService],
    }).compile();

    service = module.get(ParkingFeeCalculatorService);
  });

  it('charges professors $0 regardless of duration', () => {
    const result = service.calculate(Role.PROFESSOR, 120);
    expect(result.amount).toBe(0);
    expect(result.blocks).toBe(0);
    expect(result.ratePerBlock).toBe(0);
  });

  it('charges students $0.15 per 30-minute block (rounded up)', () => {
    expect(service.calculate(Role.STUDENT, 1).amount).toBe(STUDENT_RATE_PER_BLOCK);
    expect(service.calculate(Role.STUDENT, BLOCK_MINUTES).amount).toBe(
      STUDENT_RATE_PER_BLOCK,
    );
    expect(service.calculate(Role.STUDENT, BLOCK_MINUTES + 1).amount).toBe(
      STUDENT_RATE_PER_BLOCK * 2,
    );
    expect(service.calculate(Role.STUDENT, 90).blocks).toBe(3);
    expect(service.calculate(Role.STUDENT, 90).amount).toBe(0.45);
  });

  it('charges guests $0.25 per 30-minute block (rounded up)', () => {
    expect(service.calculate(Role.GUEST, 45).amount).toBe(GUEST_RATE_PER_BLOCK * 2);
    expect(service.calculate(Role.GUEST, 60).amount).toBe(GUEST_RATE_PER_BLOCK * 2);
    expect(service.calculate(Role.GUEST, 61).amount).toBe(GUEST_RATE_PER_BLOCK * 3);
  });

  it('returns zero blocks when duration is zero for billable roles', () => {
    expect(service.calculate(Role.STUDENT, 0).amount).toBe(0);
    expect(service.calculate(Role.GUEST, 0).amount).toBe(0);
  });
});
