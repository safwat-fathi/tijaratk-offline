import { getCookieAction } from "@/app/actions/cookie-store";
import { STORAGE_KEYS } from "@/constants";
import { ordersService } from "@/services/api/orders.service";
import { tenantsService } from "@/services/api/tenants.service";
import { OrderStatus } from "@/types/enums";
import TodaySnapshot from "./_components/TodaySnapshot";
import EndOfDayTeaser from "./_components/EndOfDayTeaser";
import StorefrontLinkCard from "./_components/StorefrontLinkCard";
import { DashboardStats } from "./_components/dashboard.types";

export const metadata = {
	title: "Dashboard Home",
};

function isToday(dateString: string): boolean {
	const date = new Date(dateString);
	const today = new Date();
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	);
}

export default async function Dashboard() {
	const userCookie = await getCookieAction(STORAGE_KEYS.USER);
	const user = userCookie ? JSON.parse(userCookie) : null;
	const name = user?.name || "تاجر";

	const [ordersResponse, tenantResponse] = await Promise.all([
		ordersService.getOrders(),
		tenantsService.getMyTenant(),
	]);

	const allOrders =
		ordersResponse.success && ordersResponse.data ? ordersResponse.data : [];
	const tenantSlug =
		tenantResponse.success && tenantResponse.data
			? tenantResponse.data.slug
			: undefined;

	// 1. Process Today's Snapshot
	const todayOrders = allOrders.filter(o => isToday(o.created_at));

	const stats: DashboardStats = {
		totalEgp: todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
		ordersCount: todayOrders.length,
		pendingOrdersCount: todayOrders.filter(
			o => o.status === OrderStatus.DRAFT || o.status === OrderStatus.CONFIRMED,
		).length,
		deliveryFees: todayOrders.reduce(
			(sum, o) => sum + Number(o.delivery_fee || 0),
			0,
		),
	};

	return (
		<div className="flex flex-col gap-6 pb-20">
			{/* Header / Welcome - Minimal */}
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold tracking-tight">
					{new Date().getHours() < 12 ? "صباح الخير" : "مساء الخير"} {name}
				</h1>
			</div>
			<StorefrontLinkCard slug={tenantSlug} />

			{/* 1. Today Snapshot */}
			<TodaySnapshot stats={stats} />

			{/* 2. Action Center */}
			{/* <ActionCenter items={actionItems} /> */}

			{/* 4. Quick Actions */}
			{/* <QuickActions /> */}

			{/* 3. Latest Orders */}
			{/* <LatestOrders orders={latestOrdersData} /> */}

			{/* 6. End-of-Day Teaser */}
			{/* Show only if it's evening? Design says "After 6-7 PM". 
          Let's just show it always or condition it. 
          Condition: Hour > 18. */}
			{new Date().getHours() >= 18 && <EndOfDayTeaser />}
		</div>
	);
}
