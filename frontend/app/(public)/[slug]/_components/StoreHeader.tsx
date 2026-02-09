"use client";

import { TENANT_CATEGORIES, type TenantCategory } from "@/constants";
import { Tenant } from "@/types/models/tenant";
import { JSX } from "react";
import Link from "next/link";

const CATEGORY_BY_VALUE: Record<
	TenantCategory,
	(typeof TENANT_CATEGORIES)[keyof typeof TENANT_CATEGORIES]
> = {
	[TENANT_CATEGORIES.GROCERY.value]: TENANT_CATEGORIES.GROCERY,
	[TENANT_CATEGORIES.GREENGROCER.value]: TENANT_CATEGORIES.GREENGROCER,
	[TENANT_CATEGORIES.BUTCHER.value]: TENANT_CATEGORIES.BUTCHER,
	[TENANT_CATEGORIES.BAKERY.value]: TENANT_CATEGORIES.BAKERY,
	[TENANT_CATEGORIES.PHARMACY.value]: TENANT_CATEGORIES.PHARMACY,
	[TENANT_CATEGORIES.OTHER.value]: TENANT_CATEGORIES.OTHER,
};

const CATEGORY_ICONS: Record<TenantCategory, JSX.Element> = {
	[TENANT_CATEGORIES.GROCERY.value]: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-10 h-10 text-white"
			aria-hidden="true"
		>
			<circle cx="8" cy="21" r="1" />
			<circle cx="19" cy="21" r="1" />
			<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 1.99-1.75l1.24-7.52H6.12" />
		</svg>
	),
	[TENANT_CATEGORIES.GREENGROCER.value]: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-10 h-10 text-white"
			aria-hidden="true"
		>
			<path d="M12 20V10" />
			<path d="M12 10c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" />
			<path d="M12 10c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" />
			<path d="M7 20h10" />
		</svg>
	),
	[TENANT_CATEGORIES.BUTCHER.value]: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-10 h-10 text-white"
			aria-hidden="true"
		>
			<path d="M15 3 5 13a3 3 0 0 0 4 4l10-10V3z" />
			<path d="M9 17h10" />
		</svg>
	),
	[TENANT_CATEGORIES.BAKERY.value]: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-10 h-10 text-white"
			aria-hidden="true"
		>
			<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
			<path d="M8 10v10" />
			<path d="M12 10v10" />
			<path d="M16 10v10" />
		</svg>
	),
	[TENANT_CATEGORIES.PHARMACY.value]: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-10 h-10 text-white"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 8v8" />
			<path d="M8 12h8" />
		</svg>
	),
	[TENANT_CATEGORIES.OTHER.value]: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-10 h-10 text-white"
			aria-hidden="true"
		>
			<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
			<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
			<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
			<path d="M2 7h20" />
			<path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
		</svg>
	),
};

const TrackingOrdersIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
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

export default function StoreHeader({ tenant }: { tenant: Tenant }) {
	const categoryValue = CATEGORY_BY_VALUE[tenant.category]
		? tenant.category
		: TENANT_CATEGORIES.OTHER.value;
	const categoryLabel = CATEGORY_BY_VALUE[categoryValue].labels.ar;
	const categoryIcon =
		CATEGORY_ICONS[categoryValue] ||
		CATEGORY_ICONS[TENANT_CATEGORIES.OTHER.value];

	const scrollToOrderNotes = () => {
		const element = document.getElementById("order-notes");
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
			const textarea = element.querySelector("textarea");
			if (textarea) {
				textarea.focus();
			}
		}
	};

	return (
		<div className="sticky top-0 z-40 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg rounded-b-[2rem] transition-all duration-300">
			<div className="p-6 md:p-8 flex flex-col items-center gap-4 text-center">
				<div className="flex items-center gap-3">
					<div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shadow-inner border border-white/10">
						{categoryIcon}
					</div>
					<div className="text-start">
						<h1 className="text-2xl font-bold tracking-tight leading-tight">
							{tenant.name}
						</h1>
						<p className="text-indigo-100 font-medium text-xs bg-white/10 px-3 py-1 rounded-full inline-block mt-1">
							{categoryLabel}
						</p>
					</div>
				</div>

				<button
					onClick={scrollToOrderNotes}
					className="w-full max-w-xs bg-white text-indigo-700 font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
				>
					<span>✍️ اكتب طلبك</span>
				</button>
				<Link
					href="/track-orders"
					className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-2.5 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
				>
					<TrackingOrdersIcon />
					تتبع طلباتي
				</Link>
			</div>
		</div>
	);
}
