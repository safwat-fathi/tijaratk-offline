import {
  OrderStatus,
  OrderType,
  PricingMode,
  ReplacementDecisionStatus,
} from '../enums';

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
    image_url?: string | null;
  } | null;
  pending_replacement_product_id?: number | null;
  pending_replacement_product?: {
    id: number;
    name: string;
    image_url?: string | null;
  } | null;
  replacement_decision_status?: ReplacementDecisionStatus;
  replacement_decision_reason?: string | null;
  replacement_decided_at?: string | null;
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
  customer_rejection_reason?: string | null;
  customer_rejected_at?: string | null;
  created_at: string;
  updated_at: string;
}
