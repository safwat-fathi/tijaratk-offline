import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

const cookieTokenExtractor = (request: Request): string | null => {
  if (!request?.cookies) {
    return null;
  }

  const token: unknown = request.cookies.access_token;
  if (typeof token !== 'string' || !token.trim()) {
    return null;
  }

  return token;
};

type JwtPayload = {
  sub: number;
  phone: string;
  tenantId: number;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // @InjectRepository(UserSession)
    // private readonly sessionRepository: Repository<UserSession>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieTokenExtractor,
      ]),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      // Technically this might happen if user is deleted but token is valid
      // or tenant changed etc.
      throw new UnauthorizedException();
    }

    // Return the user object (or a subset) which will be injected into the request object
    return {
      userId: payload.sub,
      phone: payload.phone,
      tenant_id: payload.tenantId,
      role: payload.role,
    };
  }
}
