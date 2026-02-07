import HttpService from "@/services/base/http.service";
import { Order } from "@/types/models/order";
import { CreateOrderRequest } from "@/types/services/orders";

class OrdersService extends HttpService {
	constructor() {
		super("/orders");
	}

	public async getOrders(date?: string) {
		const query = date ? `?date=${date}` : "";
		return this.get<Order[]>(`${query}`, undefined, { authRequired: true });
	}

	public async getOrder(id: number) {
		return this.get<Order>(`${id}`, undefined, { authRequired: true });
	}

	// Public tracking endpoint
	public async getOrderByPublicToken(token: string) {
		return this.get<Order>(`tracking/${token}`);
	}

	public async createPublicOrder(
		tenantSlug: string,
		payload: CreateOrderRequest,
	) {
		return this.post<Order>(`${tenantSlug}`, payload);
	}

	public async updateOrder(
		id: number,
		payload: Partial<Pick<Order, "status" | "total">>,
	) {
		return this.patch<Order>(`${id}`, payload, undefined, {
			authRequired: true,
		});
	}

	public async replaceOrderItem(
		itemId: number,
		payload: { replaced_by_product_id: number | null },
	) {
		return this.patch<{ id: number }>(
			`items/${itemId}/replace`,
			payload,
			undefined,
			{ authRequired: true },
		);
	}
}

export const ordersService = new OrdersService();
