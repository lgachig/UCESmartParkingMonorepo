import { Body, Controller, Post, Get, Req, UseGuards, Request} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { RolesGuard } from './guards/roles.guard';
import { ApiBearerAuth, ApiTags, } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register( @Body() data: RegisterDto,) {
    return this.authService.register(data);
  }
  @Throttle({
  default: { limit: 5,
              ttl: 60000,},})
  @Post('login')
  async login( @Body() data: LoginDto,) {
    return this.authService.login(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Throttle({

  default: { limit: 3,
              ttl: 60000,},})
  @Post('refresh')
  async refreshToken( @Body() data: RefreshTokenDto,) {
    return this.authService.refreshToken( data.refreshToken!,);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin')
  adminRoute() {
    return {
      message:'Access granted to admin route',
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout( @Req() req: any ) {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];

    return this.authService.logout( token,);
  }
} 