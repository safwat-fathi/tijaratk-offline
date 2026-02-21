import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    let sessionId: string | undefined = cookies
      ? cookies['session_id']
      : undefined;

    if (!sessionId) {
      sessionId = randomUUID();

      res.cookie('session_id', sessionId, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 60 * 1000,
      });
    }

    // Attach to request object
    req.sessionId = sessionId;

    next();
  }
}
