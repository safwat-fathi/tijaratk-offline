import { AsyncLocalStorage } from 'async_hooks';

export class TenantContext {
  private static storage = new AsyncLocalStorage<number>();

  static run(tenantId: number, callback: () => void) {
    this.storage.run(tenantId, callback);
  }

  static getTenantId(): number | undefined {
    return this.storage.getStore();
  }
}
