import Link from "next/link";

type OrderSuccessViewProps = {
	tenantSlug: string;
	orderToken: string;
	onCopyToken: () => void;
};

const TrackingOrdersIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="shrink-0 opacity-90"
		aria-hidden="true"
	>
		<path d="M3 7h13" />
		<path d="M3 12h9" />
		<path d="M3 17h6" />
		<circle cx="17" cy="17" r="4" />
		<path d="m19 19-2-2V15" />
	</svg>
);

export default function OrderSuccessView({
	tenantSlug,
	orderToken,
	onCopyToken,
}: OrderSuccessViewProps) {
	return (
		<div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
			<div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="40"
					height="40"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M20 6 9 17l-5-5" />
				</svg>
			</div>
			<h2 className="text-3xl font-bold mb-2 text-gray-900">تم إرسال الطلب!</h2>
			<p className="text-gray-500 mb-8 max-w-sm">
				سيتواصل معك صاحب المتجر للتأكيد. <br />
				احفظ رابط التتبع لمتابعة الحالة.
			</p>

			<div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 w-full max-w-sm mb-8">
				<div className="flex flex-col items-start overflow-hidden">
					<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
						رابط التتبع
					</span>
					<div className="flex items-center gap-1 w-full text-gray-800">
						<span className="text-sm font-mono truncate w-full text-gray-500">
							{typeof window !== "undefined" ? window.location.origin : ""}
							/track-order/
						</span>
						<span className="text-sm font-mono font-bold">
							{orderToken.slice(0, 8)}...
						</span>
					</div>
				</div>
				<button
					id="copy-btn"
					type="button"
					onClick={onCopyToken}
					className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-indigo-600 transition-all active:scale-95"
					title="نسخ الرابط"
				>
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
						<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
						<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
					</svg>
				</button>
			</div>

			<div className="flex flex-col gap-3 w-full max-w-xs">
				<Link href={`/track-order/${orderToken}`} prefetch={true} className="w-full">
					<button className="w-full bg-indigo-600 hover:bg-indigo-600/90 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
						<span>تتبع الطلب</span>
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
					</button>
				</Link>
				<Link
					href="/track-orders"
					className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-50"
				>
					<TrackingOrdersIcon />
					عرض كل طلباتي
				</Link>

				<a href={`/${tenantSlug}`} className="w-full">
					<button className="w-full py-3.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 transition-colors">
						عمل طلب جديد
					</button>
				</a>
			</div>
		</div>
	);
}
