import { getCookieAction } from "@/app/actions/cookie-store";
import { STORAGE_KEYS } from "@/constants";
import { ordersService } from "@/services/api/orders.service";
import { OrderStatus } from "@/types/enums";
import { Order } from "@/types/models/order";
import TodaySnapshot from "./_components/TodaySnapshot";
import ActionCenter from "./_components/ActionCenter";
import LatestOrders from "./_components/LatestOrders";
import QuickActions from "./_components/QuickActions";
import EndOfDayTeaser from "./_components/EndOfDayTeaser";
import {
	ActionItem,
	DashboardStats,
	LatestOrder,
} from "./_components/dashboard.types";

export const metadata = {
	title: "Dashboard Home",
};

function getTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	let interval = seconds / 31536000;
	if (interval > 1) return Math.floor(interval) + "y ago";
	interval = seconds / 2592000;
	if (interval > 1) return Math.floor(interval) + "mo ago";
	interval = seconds / 86400;
	if (interval > 1) return Math.floor(interval) + "d ago";
	interval = seconds / 3600;
	if (interval > 1) return Math.floor(interval) + "h ago";
	interval = seconds / 60;
	if (interval > 1) return Math.floor(interval) + "m ago";
	return Math.floor(seconds) + "s ago";
}

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
	const name = user?.name || "Merchant";

	// Fetch orders (Server Side)
	const response = await ordersService.getOrders();
	const allOrders = response.success && response.data ? response.data : [];

	// 1. Process Today's Snapshot
	const todayOrders = allOrders.filter(o => isToday(o.created_at));

	const stats: DashboardStats = {
		totalEgp: todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
		ordersCount: todayOrders.length,
		pendingOrdersCount: todayOrders.filter(
			o => o.status === OrderStatus.DRAFT || o.status === OrderStatus.CONFIRMED,
		).length, // Assuming Draft/Confirmed are 'Pending' work. Or specifically 'New'
		deliveryFees: todayOrders.reduce(
			(sum, o) => sum + Number(o.delivery_fee || 0),
			0,
		),
	};

	// Correction: "Pending / New Orders" usually means ones that need action.
	// "New orders" = DRAFT. "Confirmed" are already processed?
	// Let's refine based on "Action Center" logic.
	// Snapshot "Pending" probably means "Active orders today" or "New".
	// Let's stick to DRAFT (New) + CONFIRMED (in progress) for the count.

	// 2. Process Action Center
	// "New orders not confirmed": Status DRAFT
	// "Orders out for delivery": Status OUT_FOR_DELIVERY
	// "Orders waiting too long": DRAFT > 30mins.

	const now = new Date();
	const actionItems: ActionItem[] = [];

	// Sort orders by date DESC (should be already, but ensure)
	const sortedOrders = [...allOrders].sort(
		(a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
	);

	sortedOrders.forEach(order => {
		// Only care about active orders? Or all history?
		// Usually action center is for ACTIVE orders.
		// Completed/Cancelled don't need action.
		if (
			order.status === OrderStatus.COMPLETED ||
			order.status === OrderStatus.CANCELLED
		)
			return;

		const createdAt = new Date(order.created_at);
		const diffMs = now.getTime() - createdAt.getTime();
		const diffMins = diffMs / (1000 * 60);

		let type: ActionItem["type"] | null = null;

		if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
			type = "out_for_delivery";
		} else if (order.status === OrderStatus.DRAFT) {
			if (diffMins > 30) {
				type = "late_order";
			} else {
				type = "new_order";
			}
		}

		if (type) {
			actionItems.push({
				type,
				orderId: order.id,
				customerName: order.customer?.name || "Unknown",
				totalAmount: Number(order.total || 0),
				timeAgo: getTimeAgo(order.created_at),
				publicToken: order.public_token,
			});
		}
	});

	// Limit action items? Design doesn't say, but "Action Center" suggests all relevant.
	// Design says "If there’s nothing to act on → don’t show this section".

	// 3. Latest Orders (Last 5)
	// already sorted
	const latestOrdersData: LatestOrder[] = sortedOrders.slice(0, 5).map(o => ({
		id: o.id,
		customerName: o.customer?.name || "Walk-in",
		status: o.status,
		totalPrice: Number(o.total || 0),
		timeAgo: getTimeAgo(o.created_at),
	}));

	return (
		<div className="flex flex-col gap-6 pb-20">
			{/* Header / Welcome - Minimal */}
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
					Good {new Date().getHours() < 12 ? "morning" : "evening"}, {name}
				</h1>
			</div>

			{/* 1. Today Snapshot */}
			<TodaySnapshot stats={stats} />

			{/* 2. Action Center */}
			<ActionCenter items={actionItems} />

			{/* 4. Quick Actions */}
			<QuickActions />

			{/* 3. Latest Orders */}
			<LatestOrders orders={latestOrdersData} />

			{/* 6. End-of-Day Teaser */}
			{/* Show only if it's evening? Design says "After 6-7 PM". 
          Let's just show it always or condition it. 
          Condition: Hour > 18. */}
			{new Date().getHours() >= 18 && <EndOfDayTeaser />}
		</div>
	);
}
