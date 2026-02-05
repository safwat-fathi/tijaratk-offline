"use client";

import Link from "next/link";

import { useState, useActionState, useEffect } from "react";
import { Product } from "@/types/models/product";
import ProductList from "./ProductList";
import { createOrderAction } from "@/actions/order-actions";

const initialState = {
  success: false,
  message: "",
  errors: undefined,
  data: undefined, // Add data to initial state to hold public_token
};

export default function OrderForm({
	tenantSlug,
	products,
	initialOrder,
}: {
	tenantSlug: string;
	products: Product[];
	initialOrder?: any;
}) {
	// Initialize cart from initialOrder
	const initialCart =
		initialOrder?.items?.reduce(
			(acc: any, item: any) => {
				acc[item.product_id] = item.quantity;
				return acc;
			},
			{} as Record<number, number>,
		) || {};

	const [cart, setCart] = useState<Record<number, number>>(initialCart);
	const [notes, setNotes] = useState(initialOrder?.notes || "");
	const [orderRequest, setOrderRequest] = useState(
		initialOrder?.free_text_payload?.text || "",
	);
	const [orderToken, setOrderToken] = useState<string | null>(null); // New state for orderToken
	const [state, formAction, isPending] = useActionState(
		createOrderAction.bind(null, tenantSlug),
		initialState,
	);

	// Effect to handle success state and capture orderToken
	useEffect(() => {
		if (state.success && state.data?.public_token) {
			setOrderToken(state.data.public_token);
		}
	}, [state]);

	const handleUpdateCart = (pid: number, qty: number) => {
		setCart(prev => {
			if (qty === 0) {
				const { [pid]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [pid]: qty };
		});
	};

	const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
	const totalPrice = Object.entries(cart).reduce((sum, [pid, qty]) => {
		const product = products.find(p => p.id === Number(pid));
		return sum + (product ? Number(product.price) * qty : 0);
	}, 0);

	// Prepare cart items data for hidden input
	const cartItems = Object.entries(cart).map(([pid, qty]) => {
		const product = products.find(p => p.id === Number(pid));
		return {
			product_id: Number(pid),
			title: product?.name || "Unknown",
			unit_price: Number(product?.price || 0),
			quantity: qty,
		};
	});

	const copyToken = () => {
		if (orderToken) {
			const url = `${window.location.origin}/track-order/${orderToken}`;
			navigator.clipboard.writeText(url);
			// Simple feedback
			const btn = document.getElementById("copy-btn");
			if (btn)
				btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-green-600"><path d="M20 6 9 17l-5-5"/></svg>`;
			setTimeout(() => {
				if (btn)
					btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
			}, 2000);
		}
	};

	if (state.success && orderToken) {
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
				<h2 className="text-3xl font-bold mb-2 text-gray-900">
					تم إرسال الطلب!
				</h2>
				<p className="text-gray-500 mb-8 max-w-sm">
					سيتواصل معك صاحب المتجر للتأكيد. <br />
					احفظ رابط التتبع لمتابعة الحالة.
				</p>

				{orderToken && (
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
							onClick={copyToken}
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
				)}

				<div className="flex flex-col gap-3 w-full max-w-xs">
					{orderToken && (
						<Link
							href={`/track-order/${orderToken}`}
							prefetch={true}
							className="w-full"
						>
							<button className="w-full bg-indigo-600 hover:bg-indigo-600/90 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
								<span>تتبع الطلب</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M5 12h14" />
									<path d="m12 5 7 7-7 7" />
								</svg>
							</button>
						</Link>
					)}

					<a href={`/${tenantSlug}`} className="w-full">
						<button className="w-full py-3.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 transition-colors">
							عمل طلب جديد
						</button>
					</a>
				</div>
			</div>
		);
	}

	return (
		<>
			<form action={formAction}>
				<input type="hidden" name="cart" value={JSON.stringify(cartItems)} />

				{/* Manual Order Section (Primary) */}
				<div
					id="order-notes"
					className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 scroll-mt-52"
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
						<h2 className="text-xl font-bold text-gray-900">ملاحظات الطلب</h2>
					</div>
					<p className="text-gray-500 text-sm mb-4 leading-relaxed">
						اكتب ما تحتاجه، وسيؤكد المتجر السعر والتوافر معك.
					</p>
					<textarea
						name="order_request"
						placeholder="مثال: 1 كجم طماطم، 2 باكو سكر...&#10;عيش، لبن، زيت&#10;أي نوع مكرونة ينفع"
						className="w-full p-4 border border-gray-200 rounded-2xl h-40 text-base resize-none focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-gray-400 bg-gray-50/50"
						value={orderRequest}
						onChange={e => setOrderRequest(e.target.value)}
					/>
					{state.errors?.order_request && (
						<p className="text-sm text-red-600 mt-2 font-medium">
							{state.errors.order_request[0]}
						</p>
					)}
				</div>

				{/* Product List (Secondary) - Limit to 5 */}
				{products.length > 0 && (
					<div className="mt-8">
						<div className="flex items-center justify-center mb-6">
							<div className="h-px bg-gray-200 w-full"></div>
							<span className="bg-gray-50 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
								أو اختر من القائمة
							</span>
							<div className="h-px bg-gray-200 w-full"></div>
						</div>
						<ProductList
							products={products.slice(0, 5)}
							onUpdateCart={handleUpdateCart}
						/>
						{products.length > 5 && (
							<div className="text-center mt-4">
								<p className="text-sm text-gray-400 italic">
									عرض أهم 5 منتجات. استخدم "ملاحظات الطلب" لأي شيء آخر.
								</p>
							</div>
						)}
					</div>
				)}

				{/* Delivery Details */}
				<div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mt-8">
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
									name="name"
									type="text"
									placeholder="الاسم"
									className="w-full pl-12 p-4 border border-gray-200 rounded-xl text-base outline-none focus:border-indigo-500 transition-colors bg-gray-50/30"
									required
									defaultValue={initialOrder?.customer?.name || ""}
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
							{state.errors?.name && (
								<p className="text-sm text-red-600 mt-1">
									{state.errors.name[0]}
								</p>
							)}
						</div>
						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2">
								رقم الهاتف
							</label>
							<div className="relative">
								<input
									name="phone"
									type="tel"
									inputMode="numeric"
									dir="ltr"
									placeholder="01xxxxxxxxx"
									className="w-full pl-12 p-4 border border-gray-200 rounded-xl text-base outline-none focus:border-indigo-500 transition-colors bg-gray-50/30"
									required
									defaultValue={initialOrder?.customer?.phone || ""}
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
							{state.errors?.phone && (
								<p className="text-sm text-red-600 mt-1">
									{state.errors.phone[0]}
								</p>
							)}
						</div>

						<div>
							<label className="block text-sm font-bold text-gray-700 mb-2">
								عنوان التوصيل
							</label>
							<div className="relative">
								<input
									name="address"
									type="text"
									placeholder="العمارة، الشارع، الدور..."
									className="w-full pl-12 p-4 border border-gray-200 rounded-xl text-base outline-none focus:border-indigo-500 transition-colors bg-gray-50/30"
									required
									defaultValue={initialOrder?.customer?.address || ""}
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
							{state.errors?.address && (
								<p className="text-sm text-red-600 mt-1">
									{state.errors.address[0]}
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
								onChange={e => setNotes(e.target.value)}
							/>
							{state.errors?.notes && (
								<p className="text-sm text-red-600 mt-1">
									{state.errors.notes[0]}
								</p>
							)}
						</div>
					</div>

					{state.message && !state.success && (
						<div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mt-4">
							{state.message}
						</div>
					)}
				</div>

				{/* Sticky Footer Action */}
				<div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 p-4 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] z-50">
					<div className="max-w-md mx-auto">
						<div className="flex justify-between items-end mb-4 px-2">
							<div className="text-sm font-medium text-gray-500">
								الإجمالي التقديري
							</div>
							<div className="flex items-baseline gap-1">
								{totalPrice > 0 ? (
									<>
										<span className="text-2xl font-bold text-gray-900">
											{totalPrice.toFixed(2)}
										</span>
										<span className="text-sm font-semibold text-gray-500">
											ج.م
										</span>
									</>
								) : (
									<span className="text-sm font-medium text-gray-500 italic">
										يتم تأكيده من المتجر
									</span>
								)}
							</div>
						</div>

						<button
							type="submit"
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
										<path d="M5 12h14" />
										<path d="m12 5 7 7-7 7" />
									</svg>
								</>
							)}
						</button>
					</div>
				</div>
				{/* Spacer for sticky footer */}
				<div className="h-32"></div>
			</form>
		</>
	);
}
