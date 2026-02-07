import { OrderStatus, OrderType, PricingMode } from '../enums';

export interface OrderCustomer {
  name?: string;
  phone?: string;
  address?: string;
  [key: string]: unknown;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  name_snapshot: string;
  quantity: string;
  unit_price?: number | string | null;
  total_price?: number | string | null;
  notes?: string;
  replaced_by_product_id?: number | null;
  replaced_by_product?: {
    id: number;
    name: string;
  } | null;
}

export interface Order {
  id: number;
  tenant_id: number;
  tenant?: {
    name: string;
    id: number;
    slug?: string;
  };
  customer_id: number;
  customer?: OrderCustomer;
  items: OrderItem[];
  public_token: string;
  order_type: OrderType;
  status: OrderStatus;
  pricing_mode: PricingMode;
  subtotal?: number | string | null;
  delivery_fee?: number | string | null;
  total?: number | string | null;
  free_text_payload?: { text?: string };
  notes?: string;
  created_at: string;
  updated_at: string;
}
