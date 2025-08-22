import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";

export type JwtPayload = { sub: number, email: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(){
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "dev-secret",
      ignoreExpiration: false,
    })
  }

  validate(payload: JwtPayload){
    return { sub: payload.sub, email: payload.email };
  }
}