import { OrderStatus, OrderType, PricingMode } from "../enums";
// Remove unused import if not used, or use it if User is meant to be the Customer type
// import { User } from "./user"; 

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  product_snapshot?: Record<string, unknown>; 
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  notes?: string;
}

export interface Order {
  id: number;
  tenant_id: number;
  tenant?: {
    name: string;
  };
  customer_id: number;
  customer?: Record<string, unknown>; // Ideally this should be a Customer interface
  items: OrderItem[];
  public_token: string;
  order_type: OrderType;
  status: OrderStatus;
  pricing_mode: PricingMode;
  subtotal?: number | string;
  delivery_fee?: number | string;
  total?: number | string;
  free_text_payload?: { text: string };
  notes?: string;
  created_at: string;
  updated_at: string;
}
