import { Body, Controller, Get, HttpCode, Ip, Post, UseGuards } from '@nestjs/common';
import { LogInDto, SignUpDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { IpAuthRateGuard } from 'src/common/rate-limit/guards/ip-auth-rate.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(IpAuthRateGuard)
  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.email, dto.password);
  }

  @UseGuards(IpAuthRateGuard)
  @HttpCode(200)
  @Post('login')
  async logIn(@Body() dto: LogInDto) {
    return this.authService.logIn(dto.email, dto.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() user: { sub: number, email: string }) {
    return user;
  }
}
