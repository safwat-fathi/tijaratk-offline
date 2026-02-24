type OrderNotesSectionProps = {
	orderRequest: string;
	onOrderRequestChange: (value: string) => void;
	error?: string;
};

export default function OrderNotesSection({
	orderRequest,
	onOrderRequestChange,
	error,
}: OrderNotesSectionProps) {
	return (
		<div
			id="order-notes"
			className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mt-4 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 scroll-mt-52"
		>
			<div className="flex items-center gap-3 mb-3">
				<div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
				</div>
				<div className="flex flex-col">
					{/* <h2 className="text-xl font-bold text-gray-900">ملاحظات الطلب</h2> */}
					<h2 className="text-xl font-bold text-gray-900">طلب يدوي</h2>
					<p className="text-gray-900">
						مش لاقي اللي انت عايزه؟ اكتبه هنا وإحنا هنوفره لو متاح
					</p>
				</div>
			</div>

			<textarea
				id="order-request-textarea"
				name="order_request"
				placeholder="مثال: 1 كجم طماطم، 2 باكو سكر...&#10;عيش، لبن، زيت&#10;أي نوع مكرونة ينفع"
				className="w-full p-4 border border-gray-200 rounded-2xl h-22 text-base resize-none focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-gray-400 bg-gray-50/50"
				value={orderRequest}
				onChange={e => onOrderRequestChange(e.target.value)}
			/>
			<p className="text-gray-500 text-sm mb-4 leading-relaxed">
				ملاحظات: المتجر هيتواصل معاك لتأكيد السعر والتوفر قبل التنفيذ
			</p>
			{error && (
				<p className="text-sm text-red-600 mt-2 font-medium">{error}</p>
			)}
		</div>
	);
}
