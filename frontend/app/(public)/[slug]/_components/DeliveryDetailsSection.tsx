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
			className="mt-8 scroll-mt-24 rounded-lg border border-brand-border bg-white p-5 shadow-soft"
		>
			<div className="mb-4 flex items-center gap-3 border-b border-brand-border pb-4">
				<div className="rounded-md bg-brand-soft p-2.5 text-brand-primary">
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
				<h2 className="text-xl font-bold text-brand-text">تفاصيل التوصيل</h2>
			</div>

			<div className="space-y-5">
				<div>
					<label className="mb-2 block text-sm font-bold text-brand-text">
						الاسم بالكامل
					</label>
					<div className="relative">
						<input
							name="customer_name"
							type="text"
							placeholder="مثال: أحمد محمد…"
							className="w-full rounded-md border border-brand-border bg-brand-soft/30 p-4 pl-12 text-base transition-colors focus:border-brand-accent focus:outline-none focus:ring-4 focus:ring-brand-accent/15"
							required
							defaultValue={defaultName}
						/>
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
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
						<p className="mt-1 text-sm text-status-error">
							{errors.customer_name[0]}
						</p>
					)}
				</div>

				<div>
					<label className="mb-2 block text-sm font-bold text-brand-text">
						رقم الهاتف
					</label>
					<div className="relative">
						<input
							name="customer_phone"
							type="tel"
							inputMode="numeric"
							dir="ltr"
							placeholder="مثال: 01012345678…"
							className="w-full rounded-md border border-brand-border bg-brand-soft/30 p-4 pl-12 text-base transition-colors focus:border-brand-accent focus:outline-none focus:ring-4 focus:ring-brand-accent/15"
							required
							defaultValue={defaultPhone}
						/>
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
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
						<p className="mt-1 text-sm text-status-error">
							{errors.customer_phone[0]}
						</p>
					)}
				</div>

				<div>
					<label className="mb-2 block text-sm font-bold text-brand-text">
						عنوان التوصيل
					</label>
					<div className="relative">
						<input
							name="delivery_address"
							type="text"
							placeholder="مثال: العمارة، الشارع، الدور…"
							className="w-full rounded-md border border-brand-border bg-brand-soft/30 p-4 pl-12 text-base transition-colors focus:border-brand-accent focus:outline-none focus:ring-4 focus:ring-brand-accent/15"
							required
							defaultValue={defaultAddress}
						/>
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
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
						<p className="mt-1 text-sm text-status-error">
							{errors.delivery_address[0]}
						</p>
					)}
				</div>

				<div>
					<label className="mb-2 block text-sm font-bold text-brand-text">
						ملاحظات التوصيل (اختياري)
					</label>
					<textarea
						name="notes"
						placeholder="مثال: اضرب الجرس، سيب الطلب عند الباب…"
						className="h-24 w-full resize-none rounded-md border border-brand-border bg-brand-soft/40 p-4 text-base transition-colors placeholder:text-muted-foreground focus:border-brand-accent focus:outline-none focus:ring-4 focus:ring-brand-accent/15"
						value={notes}
						onChange={e => onNotesChange(e.target.value)}
					/>
					{errors?.notes && (
						<p className="mt-1 text-sm text-status-error">{errors.notes[0]}</p>
					)}
				</div>
			</div>

			{message && !success && (
				<div className="mt-4 rounded-md border border-status-error/20 bg-status-error/10 p-4 text-sm font-medium text-status-error">
					{message}
				</div>
			)}
		</div>
	);
}
