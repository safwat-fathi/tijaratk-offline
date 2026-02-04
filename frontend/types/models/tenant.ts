import type { TenantCategory } from "@/constants";

export interface Tenant {
  id: number;
  name: string;
  phone: string;
  slug: string;
  category: TenantCategory;
}
