export interface Customer {
  id: number;
  tenant_id: number; // or string if utilizing uuids in future, but backend says number for now (TenantBaseEntity usually has id) wait, tenant_id in entity is usually number or uuid. Let's check TenantBaseEntity or just assume number for now based on other files.
  phone: string;
  code: number;
  merchant_label?: string;
  name?: string;
  address?: string;
  notes?: string;
  first_order_at?: string; // Date sent as string
  last_order_at?: string; // Date sent as string
  order_count: number;
  completed_order_count: number;
  created_at: string;
  updated_at: string;
  orders?: any[]; // Avoiding circular import if Order refers to Customer. Or define a partial Order type. Let's use any for now or import Order.
}
