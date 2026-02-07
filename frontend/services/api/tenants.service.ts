import HttpService from "@/services/base/http.service";
import { Tenant } from "@/types/models/tenant";

class TenantsService extends HttpService {
  constructor() {
    super("/tenants");
  }

  public async getPublicTenant(slug: string) {
    return this.get<Tenant>(`public/${slug}`, undefined, {
      cache: "no-store",
    });
  }

  public async getMyTenant() {
    return this.get<Tenant>("me", undefined, {
      authRequired: true,
      cache: "no-store",
    });
  }
}

export const tenantsService = new TenantsService();
