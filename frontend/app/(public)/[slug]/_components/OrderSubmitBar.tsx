import type { Ref } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatArabicQuantity } from "@/lib/utils/number";

type OrderSubmitBarProps = {
	totalItems: number;
	hasPricedItems: boolean;
	estimatedTotal: number;
	orderRequest: string;
	isPending: boolean;
	onSubmitClick?: () => void;
	triggerButtonRef?: Ref<HTMLButtonElement>;
};

export default function OrderSubmitBar({
	totalItems,
	hasPricedItems,
	estimatedTotal,
	orderRequest,
	isPending,
	onSubmitClick,
	triggerButtonRef,
}: OrderSubmitBarProps) {
	if (!(totalItems > 0 || orderRequest.trim())) {
		return null;
	}

	return (
		<>
			<div
				data-order-submit-bar
				className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 p-4 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] z-50"
			>
				<div className="max-w-md mx-auto">
					<div className="flex justify-between items-end mb-4 px-2">
						<div className="text-sm font-medium text-gray-500">العناصر المختارة</div>
						<div className="flex items-baseline gap-1">
							{totalItems > 0 ? (
								<>
									<span className="text-2xl font-bold text-gray-900">
										{formatArabicQuantity(totalItems) || String(totalItems)}
									</span>
									<span className="text-sm font-semibold text-gray-500">عنصر</span>
									{hasPricedItems && (
										<span className="mr-2 text-sm font-bold text-indigo-700">
											{formatCurrency(estimatedTotal)}
										</span>
									)}
								</>
							) : (
								<span className="text-sm font-medium text-gray-500 italic">
									السعر يتم تأكيده بعد الطلب
								</span>
							)}
						</div>
					</div>

					<button
						type="button"
						ref={triggerButtonRef}
						onClick={onSubmitClick}
						disabled={isPending || (totalItems === 0 && !orderRequest.trim())}
						className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
					>
						{isPending ? (
							<>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="animate-spin"
								>
									<path d="M21 12a9 9 0 1 1-6.219-8.56" />
								</svg>
								<span>جاري الإرسال...</span>
							</>
						) : (
							<>
								<span>تأكيد الطلب</span>
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
								>
									<path d="m12 19-7-7 7-7" />
									<path d="M19 12H5" />
								</svg>
							</>
						)}
					</button>
				</div>
			</div>
			<div className="h-32"></div>
		</>
	);
}
