import type { ReactNode } from "react";
import { OrderStatus } from "@/types/enums";
import { cn } from "@/lib/utils";

const statusBadgeStyles = {
	[OrderStatus.DRAFT]: "bg-status-new/15 text-status-new border-status-new/25",
	[OrderStatus.CONFIRMED]:
		"bg-status-confirmed/15 text-status-confirmed border-status-confirmed/25",
	[OrderStatus.OUT_FOR_DELIVERY]:
		"bg-status-delivery/25 text-amber-800 border-status-delivery/40",
	[OrderStatus.COMPLETED]:
		"bg-status-completed/15 text-status-completed border-status-completed/25",
	[OrderStatus.CANCELLED]:
		"bg-status-cancelled/15 text-status-cancelled border-status-cancelled/25",
	[OrderStatus.REJECTED_BY_CUSTOMER]:
		"bg-status-cancelled/15 text-status-cancelled border-status-cancelled/25",
} as const;

export const statusLabels = {
	[OrderStatus.DRAFT]: "جديد",
	[OrderStatus.CONFIRMED]: "مؤكد",
	[OrderStatus.OUT_FOR_DELIVERY]: "خرج للتوصيل",
	[OrderStatus.COMPLETED]: "اكتمل",
	[OrderStatus.CANCELLED]: "ملغي",
	[OrderStatus.REJECTED_BY_CUSTOMER]: "مرفوض من العميل",
} as const;

type StatusBadgeProps = {
	status: OrderStatus | string;
	label?: string;
	icon?: ReactNode;
	className?: string;
};

export const StatusBadge = ({
	status,
	label,
	icon,
	className,
}: StatusBadgeProps) => {
	const normalizedStatus = status as OrderStatus;
	const style =
		statusBadgeStyles[normalizedStatus] ||
		"bg-brand-soft text-brand-primary border-brand-soft";
	const resolvedLabel = label || statusLabels[normalizedStatus] || String(status);

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
				style,
				className,
			)}
		>
			{icon}
			{resolvedLabel}
		</span>
	);
};
