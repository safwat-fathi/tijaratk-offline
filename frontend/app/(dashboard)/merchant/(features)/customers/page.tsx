import { customersService } from "@/services/api/customers.service";
import CustomersView from "./_components/CustomersView";

export const metadata = {
	title: "Customers",
};

export default async function CustomersPage() {
	// Rendering client view which handles fetching
	return <CustomersView initialCustomers={[]} />;
}
