import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TenantContext } from '../contexts/tenant.context';
import { decode } from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantIdInit = req.headers['x-tenant-id'];
    let tenantId: number | undefined;

    if (tenantIdInit) {
      tenantId = parseInt(tenantIdInit as string, 10);
    } else if (req.headers.authorization) {
      // Try to extract from JWT if header not present
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const decoded = decode(token) as { tenant_id?: unknown } | null;
        if (decoded && decoded.tenant_id) {
          tenantId =
            typeof decoded.tenant_id === 'number'
              ? decoded.tenant_id
              : Number(decoded.tenant_id);
        }
      }
    }

    if (tenantId) {
      TenantContext.run(tenantId, () => {
        next();
      });
    } else {
      next();
    }
  }
}
