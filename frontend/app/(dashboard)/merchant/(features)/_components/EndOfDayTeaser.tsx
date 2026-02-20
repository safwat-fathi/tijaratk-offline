"use client";

import { useMemo, useState, useTransition } from "react";
import { closeDayAction } from "@/actions/order-actions";
import {
	DayClosePayload,
	DayCloseSummary,
	DayCloseTodayStatusResponse,
} from "@/types/services/orders";
import { formatCurrencyOrFallback } from "@/lib/utils/currency";

type EndOfDayTeaserProps = {
	initialStatus: DayCloseTodayStatusResponse;
};

type FeedbackState = {
	kind: "success" | "error";
	message: string;
} | null;

const buildSummaryFromClosure = (
	closure: DayClosePayload | null,
	preview: DayCloseSummary,
): DayCloseSummary => {
	if (!closure) {
		return preview;
	}

	return {
		orders_count: closure.orders_count,
		cancelled_count: closure.cancelled_count,
		completed_sales_total: Number(closure.completed_sales_total || 0),
	};
};

export default function EndOfDayTeaser({ initialStatus }: EndOfDayTeaserProps) {
	const [status, setStatus] = useState<DayCloseTodayStatusResponse>(initialStatus);
	const [feedback, setFeedback] = useState<FeedbackState>(null);
	const [isPending, startTransition] = useTransition();

	const summary = useMemo(
		() => buildSummaryFromClosure(status.closure, status.preview),
		[status.closure, status.preview],
	);
	let closeDayLabel = "إغلاق اليوم";
	if (isPending) {
		closeDayLabel = "جارٍ الإغلاق...";
	} else if (status.is_closed) {
		closeDayLabel = "تم الإغلاق";
	}

	const handleCloseDay = () => {
		if (isPending || status.is_closed) {
			return;
		}

		setFeedback(null);

		startTransition(async () => {
			const response = await closeDayAction();
			if (!response.success || !response.data) {
				setFeedback({
					kind: "error",
					message: response.message || "تعذر إغلاق اليوم. حاول مرة أخرى.",
				});
				return;
			}

			const closure = response.data.closure;
			setStatus({
				is_closed: true,
				closure,
				preview: {
					orders_count: closure.orders_count,
					cancelled_count: closure.cancelled_count,
					completed_sales_total: Number(closure.completed_sales_total || 0),
				},
			});

			if (response.data.is_already_closed) {
				setFeedback({
					kind: "success",
					message: "تم إغلاق هذا اليوم مسبقًا.",
				});
				return;
			}

			if (!response.data.whatsapp_sent) {
				setFeedback({
					kind: "error",
					message: "تم إغلاق اليوم لكن تعذر إرسال الملخص على واتساب.",
				});
				return;
			}

			setFeedback({
				kind: "success",
				message: "تم إغلاق اليوم وإرسال الملخص على واتساب.",
			});
		});
	};

	return (
		<div className="pt-4 pb-8">
			<div className="rounded-xl border shadow-sm bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
				<div className="p-4 flex flex-col gap-4">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="bg-primary/20 p-2 rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-primary"
								>
									<rect width="16" height="20" x="4" y="2" rx="2" />
									<line x1="8" x2="16" y1="6" y2="6" />
									<line x1="16" x2="16" y1="14" y2="18" />
									<path d="M16 10h.01" />
									<path d="M12 10h.01" />
									<path d="M8 10h.01" />
									<path d="M12 14h.01" />
									<path d="M8 14h.01" />
									<path d="M12 18h.01" />
									<path d="M8 18h.01" />
								</svg>
							</div>
							<div>
								<p className="font-medium text-sm text-foreground">
									{status.is_closed ? "تم إغلاق حساب اليوم" : "إغلاق حساب اليوم؟"}
								</p>
								<p className="text-xs text-muted-foreground">
									{status.is_closed
										? "تم حفظ الملخص اليومي"
										: "احصل على ملخص ليومك"}
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={handleCloseDay}
							disabled={isPending || status.is_closed}
							className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
						>
							{closeDayLabel}
						</button>
					</div>

					<div className="grid grid-cols-3 gap-2 text-sm">
						<div className="rounded-lg border border-primary/15 bg-white/35 p-2">
							<p className="text-xs text-muted-foreground">الطلبات</p>
							<p className="font-semibold">{summary.orders_count}</p>
						</div>
						<div className="rounded-lg border border-primary/15 bg-white/35 p-2">
							<p className="text-xs text-muted-foreground">الملغية</p>
							<p className="font-semibold">{summary.cancelled_count}</p>
						</div>
						<div className="rounded-lg border border-primary/15 bg-white/35 p-2">
							<p className="text-xs text-muted-foreground">المبيعات</p>
							<p className="font-semibold">
								{formatCurrencyOrFallback(summary.completed_sales_total)}
							</p>
						</div>
					</div>

					{feedback ? (
						<p
							className={`text-xs ${
								feedback.kind === "error" ? "text-rose-600" : "text-emerald-700"
							}`}
							aria-live="polite"
						>
							{feedback.message}
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
