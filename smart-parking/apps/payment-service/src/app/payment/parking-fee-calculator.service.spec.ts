import { Test, TestingModule } from '@nestjs/testing';
import {
  GUEST_RATE_PER_HOUR,
  ParkingFeeCalculatorService,
  STUDENT_RATE_PER_HOUR,
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
    expect(result.ratePerHour).toBe(0);
  });

  it('charges admins $0 regardless of duration', () => {
    const result = service.calculate(Role.ADMIN, 120);
    expect(result.amount).toBe(0);
  });

  it('charges students $4 per hour, proportional to the minute', () => {
    expect(STUDENT_RATE_PER_HOUR).toBe(4);
    expect(service.calculate(Role.STUDENT, 60).amount).toBe(4);
    expect(service.calculate(Role.STUDENT, 30).amount).toBe(2);
    expect(service.calculate(Role.STUDENT, 15).amount).toBe(1);
    expect(service.calculate(Role.STUDENT, 90).amount).toBe(6);
    expect(service.calculate(Role.STUDENT, 1).amount).toBe(0.07);
  });

  it('charges guests $4 per hour, proportional to the minute', () => {
    expect(GUEST_RATE_PER_HOUR).toBe(4);
    expect(service.calculate(Role.GUEST, 60).amount).toBe(4);
    expect(service.calculate(Role.GUEST, 45).amount).toBe(3);
    expect(service.calculate(Role.GUEST, 90).amount).toBe(6);
  });

  it('returns zero amount when duration is zero for billable roles', () => {
    expect(service.calculate(Role.STUDENT, 0).amount).toBe(0);
    expect(service.calculate(Role.GUEST, 0).amount).toBe(0);
  });
});