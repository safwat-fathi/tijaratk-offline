import HttpService from "@/services/base/http.service";
import { Customer } from "@/types/models/customer";

class CustomersService extends HttpService {
	constructor() {
		super("/customers");
	}

	public async getCustomers(params?: { search?: string; page?: number; limit?: number }) {
		const searchParams = new URLSearchParams();
		if (params?.search) searchParams.append("search", params.search);
		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit) searchParams.append("limit", params.limit.toString());
		
		return this.get<{ data: Customer[]; meta: any }>(`?${searchParams.toString()}`);
	}

	public async getCustomer(id: number) {
		return this.get<Customer>(`${id}`);
	}
}

export const customersService = new CustomersService();
