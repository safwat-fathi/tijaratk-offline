import { ordersService } from "@/services/api/orders.service";
import OrdersView from "./_components/OrdersView";

export const metadata = {
	title: "Orders",
};

export const dynamic = "force-dynamic";

async function getOrders(date?: string) {
	try {
		const response = await ordersService.getOrders(date);
		if (response.success && response.data) {
			return response.data;
		}
		return [];
	} catch (error) {
		console.error("Failed to fetch orders", error);
		return [];
	}
}

import { getCookieAction } from "@/app/actions/cookie-store";
import { STORAGE_KEYS } from "@/constants";

export default async function OrdersPage({
	searchParams,
}: {
	searchParams: Promise<{ date?: string }>;
}) {
	const { date } = await searchParams;

	const orders = await getOrders(date);

	const userCookie = await getCookieAction(STORAGE_KEYS.USER);
	const user = userCookie ? JSON.parse(userCookie) : null;
	const tenantId = user?.tenantId;

	return (
		<OrdersView
			initialOrders={orders}
			selectedDate={date}
			tenantId={tenantId}
		/>
	);
}
