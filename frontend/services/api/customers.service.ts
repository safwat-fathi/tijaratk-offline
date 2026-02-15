import HttpService from "@/services/base/http.service";
import { Customer } from "@/types/models/customer";

type CustomersListMeta = {
	total: number;
	page: number;
	last_page: number;
	limit?: number;
	has_next?: boolean;
};

type CustomersListResponse = {
	data: Customer[];
	meta: CustomersListMeta;
};

class CustomersService extends HttpService {
	constructor() {
		super("/customers");
	}

	public async getCustomers(params?: { search?: string; page?: number; limit?: number }) {
		return this.get<CustomersListResponse>("", params, { authRequired: true });
	}

	public async getCustomer(id: number) {
		return this.get<Customer>(`${id}`, undefined, { authRequired: true });
	}
}

export const customersService = new CustomersService();
