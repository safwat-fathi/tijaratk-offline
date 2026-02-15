import type { Order } from "@/types/models/order";

type DeliveryDetailsSectionProps = {
	initialOrder?: Order | null;
	savedCustomerProfile?: {
		name?: string;
		phone: string;
		address?: string;
		notes?: string;
		updated_at: string;
	} | null;
	notes: string;
	onNotesChange: (value: string) => void;
	errors?: Record<string, string[]>;
	message?: string;
	success?: boolean;
};

export default function DeliveryDetailsSection({
	initialOrder,
	savedCustomerProfile,
	notes,
	onNotesChange,
	errors,
	message,
	success,
}: DeliveryDetailsSectionProps) {
	const defaultName =
		initialOrder?.customer?.name || savedCustomerProfile?.name || "";
	const defaultPhone =
		initialOrder?.customer?.phone || savedCustomerProfile?.phone || "";
	const defaultAddress =
		initialOrder?.customer?.address || savedCustomerProfile?.address || "";

	return (
		<div
			id="delivery-details-section"
			className="scroll-mt-24 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mt-8"
		>
			<div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
				<div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
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
						<circle cx="12" cy="12" r="10" />
						<path d="M12 6v6l4 2" />
					</svg>
				</div>
				<h2 className="text-xl font-bold text-gray-900">تفاصيل التوصيل</h2>
			</div>

			<div className="space-y-5">
				<div>
					<label className="block text-sm font-bold text-gray-700 mb-2">
						الاسم بالكامل
					</label>
					<div className="relative">
						<input
							name="customer_name"
							type="text"
							placeholder="الاسم"
							className="w-full pl-12 p-4 border border-gray-200 rounded-xl text-base outline-none focus:border-indigo-500 transition-colors bg-gray-50/30"
							required
							defaultValue={defaultName}
						/>
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
								<circle cx="12" cy="7" r="4" />
							</svg>
						</div>
					</div>
					{errors?.customer_name && (
						<p className="text-sm text-red-600 mt-1">
							{errors.customer_name[0]}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-bold text-gray-700 mb-2">
						رقم الهاتف
					</label>
					<div className="relative">
						<input
							name="customer_phone"
							type="tel"
							inputMode="numeric"
							dir="ltr"
							placeholder="01xxxxxxxxx"
							className="w-full pl-12 p-4 border border-gray-200 rounded-xl text-base outline-none focus:border-indigo-500 transition-colors bg-gray-50/30"
							required
							defaultValue={defaultPhone}
						/>
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
								<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
							</svg>
						</div>
					</div>
					{errors?.customer_phone && (
						<p className="text-sm text-red-600 mt-1">
							{errors.customer_phone[0]}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-bold text-gray-700 mb-2">
						عنوان التوصيل
					</label>
					<div className="relative">
						<input
							name="delivery_address"
							type="text"
							placeholder="العمارة، الشارع، الدور..."
							className="w-full pl-12 p-4 border border-gray-200 rounded-xl text-base outline-none focus:border-indigo-500 transition-colors bg-gray-50/30"
							required
							defaultValue={defaultAddress}
						/>
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
						</div>
					</div>
					{errors?.delivery_address && (
						<p className="text-sm text-red-600 mt-1">
							{errors.delivery_address[0]}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-bold text-gray-700 mb-2">
						ملاحظات التوصيل (اختياري)
					</label>
					<textarea
						name="notes"
						placeholder="مثال: اضرب الجرس، سيب الطلب عند الباب..."
						className="w-full p-4 border border-gray-200 rounded-xl h-24 text-base resize-none focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 bg-gray-50/50"
						value={notes}
						onChange={e => onNotesChange(e.target.value)}
					/>
					{errors?.notes && (
						<p className="text-sm text-red-600 mt-1">{errors.notes[0]}</p>
					)}
				</div>
			</div>

			{message && !success && (
				<div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mt-4">
					{message}
				</div>
			)}
		</div>
	);
}
