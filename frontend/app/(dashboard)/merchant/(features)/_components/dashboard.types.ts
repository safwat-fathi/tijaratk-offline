import { Order } from "@/types/models/order";

export interface DashboardStats {
	totalEgp: number;
	ordersCount: number;
	pendingOrdersCount: number;
	deliveryFees: number;
}

export interface ActionItem {
	type: "new_order" | "out_for_delivery" | "late_order";
	orderId: number;
	customerName: string;
	totalAmount: number;
	timeAgo?: string;
	publicToken: string;
}

export interface LatestOrder {
	id: number;
	customerName: string;
	status: string;
	totalPrice: number;
	timeAgo: string;
}

export interface DashboardData {
	stats: DashboardStats;
	actionItems: ActionItem[];
	latestOrders: Order[];
}
