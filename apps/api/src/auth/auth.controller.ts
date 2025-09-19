import { Body, Controller, Get, HttpCode, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { LogInDto, SignUpDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './decorators/current-user.decorator';
import { IpAuthRateGuard } from '../common/rate-limit/guards/ip-auth-rate.guard'
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 201, description: "User created" })
  @ApiResponse({ status: 409, description: "Duplicate email" })
  @Public()
  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.email, dto.password);
  }

  @ApiResponse({ status: 200, description: "Logged in" })
  @ApiResponse({ status: 401, description: "Invalid creds" })
  @Public()
  @UseGuards(IpAuthRateGuard)
  @HttpCode(200)
  @Post('login')
  async logIn(@Body() dto: LogInDto) {
    return this.authService.logIn(dto.email, dto.password);
  }

  @ApiBearerAuth('BearerAuth')
  @Get('me')
  me(@CurrentUser() user: { sub: number, email: string }) {
    return user;
  }

  @Public()
  @UseGuards(IpAuthRateGuard)
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth('BearerAuth')
  @Post('logout')
  async logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @ApiBearerAuth('BearerAuth')
  @Post('logout-all')
  async logoutAll(@Req() req: any) {
    return this.authService.logoutAll(req.user.sub);
  }
}
