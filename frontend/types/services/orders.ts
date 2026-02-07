import { Order } from '../models/order';
import { OrderType } from '../enums';

export interface CreateOrderRequest {
  customer: {
    name?: string;
    phone: string;
    address?: string;
  };
  items?: Array<{
    product_id?: number;
    name?: string;
    quantity: string;
    notes?: string;
    unit_price?: number;
    total_price?: number;
  }>;
  notes?: string;
  free_text_payload?: { text: string };
  order_type: OrderType;
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  last_page: number;
}
