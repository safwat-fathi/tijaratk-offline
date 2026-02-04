import { OrderStatus, OrderType, PricingMode } from "../enums";
// Remove unused import if not used, or use it if User is meant to be the Customer type
// import { User } from "./user"; 

// Basic customer interface for order display
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
	product_snapshot?: Record<string, unknown>;
	quantity: number;
	unit_price: number | string;
	total_price: number | string;
	title: string; // Added title as it is used in components
	notes?: string;
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
	subtotal?: number | string;
	delivery_fee?: number | string;
	total?: number | string;
	free_text_payload?: { text: string };
	notes?: string;
	payment_method?: string; // Adding it optional to avoid TS errors in components if sticking to old assumptions, but better removed.
	// Actually, I removed payment_method from component, so no need to add here.
	created_at: string;
	updated_at: string;
}
