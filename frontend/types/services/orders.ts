import { Order } from "../models/order";

export interface CreateOrderRequest {
  // Define based on CreateOrderDto if implementation needs it
  customer_id: number;
  items: Array<{
    product_id?: number;
    quantity: number;
    notes?: string;
    // For manual pricing mode
    unit_price?: number;
  }>;
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  last_page: number;
}
