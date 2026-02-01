import HttpService from "@/services/base/http.service";
import { Order } from "@/types/models/order";

class OrdersService extends HttpService {
  constructor() {
    super("/orders");
  }

  public async getOrders() {
    return this.get<Order[]>("");
  }

  public async getOrder(id: number) {
    return this.get<Order>(`${id}`);
  }

  // Public tracking endpoint
  public async getOrderByPublicToken(token: string) {
    return this.get<Order>(`tracking/${token}`);
  }

  public async createPublicOrder(tenantSlug: string, payload: any) {
    return this.post<any>(`${tenantSlug}`, payload);
  }
}

export const ordersService = new OrdersService();
