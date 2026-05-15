import { AsyncLocalStorage } from 'async_hooks';
import { Prisma } from '../../../generated/prisma/client';

type DbTenantStore = {
  tenantId: number;
  manager: Prisma.TransactionClient;
};

/**
 * Holds request-scoped tenant + Prisma transaction client for RLS-bound queries.
 */
export class DbTenantContext {
  private static readonly storage = new AsyncLocalStorage<DbTenantStore>();

  /**
   * Runs callback within a request-scoped tenant database context.
   */
  static run<T>(store: DbTenantStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  /**
   * Returns current request tenant id if available.
   */
  static getTenantId(): number | undefined {
    return this.storage.getStore()?.tenantId;
  }

  /**
   * Returns current request-bound Prisma transaction client if available.
   */
  static getManager(): Prisma.TransactionClient | undefined {
    return this.storage.getStore()?.manager;
  }
}
