import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SignUpDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.email, dto.password);
  }

  @HttpCode(200)
  @Post('login')
  async logIn(@Body() dto: SignUpDto) {
    return this.authService.logIn(dto.email, dto.password);
  }
}
