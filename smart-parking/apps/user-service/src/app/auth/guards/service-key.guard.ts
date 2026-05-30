import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const serviceKey = request.headers['x-service-key'];
    const expectedKey = this.configService.get<string>('INTERNAL_SERVICE_KEY');

    if (!serviceKey || serviceKey !== expectedKey) {
      throw new UnauthorizedException('Invalid service credentials');
    }

    return true;
  }
}
