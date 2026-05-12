import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

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
    private readonly prisma: PrismaService,
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
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
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
