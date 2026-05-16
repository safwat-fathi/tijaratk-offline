import type { TenantCategory } from "@/constants";

export interface Tenant {
  id: number;
  name: string;
  phone: string;
  slug: string;
  category: TenantCategory;
  delivery_fee?: number | string;
  delivery_available?: boolean;
  delivery_time_window?: string | null;
}
