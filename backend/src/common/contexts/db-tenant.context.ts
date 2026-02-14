import { AsyncLocalStorage } from 'async_hooks';
import { EntityManager } from 'typeorm';

type DbTenantStore = {
  tenantId: number;
  manager: EntityManager;
};

/**
 * Holds request-scoped tenant + TypeORM manager for RLS-bound queries.
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
   * Returns current request-bound manager if available.
   */
  static getManager(): EntityManager | undefined {
    return this.storage.getStore()?.manager;
  }
}
