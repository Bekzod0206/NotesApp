import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async signUp (email: string, password: string) {
    return this.users.createUser(email, password);
  }

  async logIn(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if(!user) throw new UnauthorizedException('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) throw new UnauthorizedException('Invalid password');

    const payload = { email: user.email, sub: user.id };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken };
  }
}
