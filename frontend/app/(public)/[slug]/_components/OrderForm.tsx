"use client";

import Image from "next/image";
import Link from "next/link";

import {
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Product,
	PublicProductCategory,
	PublicProductsMeta,
} from "@/types/models/product";
import { Order } from "@/types/models/order";
import ProductList from "./ProductList";
import { createOrderAction } from "@/actions/order-actions";
import { productsService } from "@/services/api/products.service";
import { getImageUrl } from "@/lib/utils/image";

const initialState = {
	success: false,
	message: "",
	errors: undefined,
	data: undefined,
};

const ALL_PRODUCTS_CATEGORY = "__all_products__";
const PAGE_SIZE = 20;
const PRELOAD_THRESHOLD_ITEMS = 5;

type PaginationState = {
	page: number;
	lastPage: number;
	isLoading: boolean;
	error: string | null;
};

const DEFAULT_PAGINATION_STATE: PaginationState = {
	page: 1,
	lastPage: 1,
	isLoading: false,
	error: null,
};

const dedupeProducts = (products: Product[]): Product[] => {
	const seen = new Set<number>();

	return products.filter(product => {
		if (seen.has(product.id)) {
			return false;
		}
		seen.add(product.id);
		return true;
	});
};

export default function OrderForm({
	tenantSlug,
	initialProducts,
	initialProductsMeta,
	initialCategories,
	initialOrder,
}: {
	tenantSlug: string;
	initialProducts: Product[];
	initialProductsMeta: PublicProductsMeta;
	initialCategories: PublicProductCategory[];
	initialOrder?: Order | null;
}) {
	// Initialize cart from initialOrder
	const initialCart =
		initialOrder?.items?.reduce(
			(acc: Record<number, number>, item) => {
				if (item.product_id) {
					const parsedQty = Number.parseFloat(String(item.quantity ?? "1"));
					acc[item.product_id] =
						Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;
				}
				return acc;
			},
			{} as Record<number, number>,
		) || {};

	const [cart, setCart] = useState<Record<number, number>>(initialCart);
	const [notes, setNotes] = useState(initialOrder?.notes || "");
	const [orderRequest, setOrderRequest] = useState(
		initialOrder?.free_text_payload?.text || "",
	);
	const [state, formAction, isPending] = useActionState(
		createOrderAction.bind(null, tenantSlug),
		initialState,
	);
	const [activeCategory, setActiveCategory] = useState(ALL_PRODUCTS_CATEGORY);
	const [productsByCategory, setProductsByCategory] = useState<
		Record<string, Product[]>
	>({
		[ALL_PRODUCTS_CATEGORY]: initialProducts,
	});
	const [paginationByCategory, setPaginationByCategory] = useState<
		Record<string, PaginationState>
	>({
		[ALL_PRODUCTS_CATEGORY]: {
			page: initialProductsMeta.page,
			lastPage: initialProductsMeta.last_page,
			isLoading: false,
			error: null,
		},
	});
	const [knownProductsById, setKnownProductsById] = useState<
		Record<number, Product>
	>(() =>
		initialProducts.reduce<Record<number, Product>>((acc, product) => {
			acc[product.id] = product;
			return acc;
		}, {}),
	);

	const loadMoreObserver = useRef<IntersectionObserver | null>(null);

	const categoryTabs = useMemo(() => {
		const categoriesSource: PublicProductCategory[] =
			initialCategories.length > 0
				? initialCategories
				: Array.from(
						initialProducts.reduce<Map<string, number>>((acc, product) => {
							const category = product.category?.trim();
							if (!category) {
								return acc;
							}
							acc.set(category, (acc.get(category) || 0) + 1);
							return acc;
						}, new Map<string, number>()),
					).map(([category, count]) => ({
						category,
						count,
						image_url: undefined,
					}));

		const allCount =
			categoriesSource.length > 0
				? categoriesSource.reduce((sum, category) => sum + category.count, 0)
				: initialProductsMeta.total;

		return [
			{
				key: ALL_PRODUCTS_CATEGORY,
				label: "الكل",
				count: allCount,
				image_url: categoriesSource.find(item => item.image_url)?.image_url,
			},
			...categoriesSource.map(category => ({
				key: category.category,
				label: category.category,
				count: category.count,
				image_url: category.image_url,
			})),
		];
	}, [initialCategories, initialProducts, initialProductsMeta.total]);

	const activeProducts = productsByCategory[activeCategory] || [];
	const activePagination =
		paginationByCategory[activeCategory] || DEFAULT_PAGINATION_STATE;
	const hasMoreInActiveCategory = activePagination.page < activePagination.lastPage;
	const activeLoadMoreIndex =
		activeProducts.length === 0
			? -1
			: Math.max(0, activeProducts.length - (PRELOAD_THRESHOLD_ITEMS + 1));

	const fetchProductsPage = useCallback(
		async (categoryKey: string, page: number, replace: boolean) => {
			const currentState =
				paginationByCategory[categoryKey] || DEFAULT_PAGINATION_STATE;
			if (currentState.isLoading) {
				return;
			}

			setPaginationByCategory(prev => ({
				...prev,
				[categoryKey]: {
					...(prev[categoryKey] || DEFAULT_PAGINATION_STATE),
					isLoading: true,
					error: null,
				},
			}));

			const response = await productsService.getPublicProducts(tenantSlug, {
				category:
					categoryKey === ALL_PRODUCTS_CATEGORY ? undefined : categoryKey,
				page,
				limit: PAGE_SIZE,
			});

			if (!response.success || !response.data) {
				setPaginationByCategory(prev => ({
					...prev,
					[categoryKey]: {
						...(prev[categoryKey] || DEFAULT_PAGINATION_STATE),
						isLoading: false,
						error: "تعذر تحميل المنتجات حالياً",
					},
				}));
				return;
			}

			const nextProducts = response.data.data;
			const nextMeta = response.data.meta;

			setProductsByCategory(prev => ({
				...prev,
				[categoryKey]: replace
					? nextProducts
					: dedupeProducts([...(prev[categoryKey] || []), ...nextProducts]),
			}));

			setKnownProductsById(prev => {
				const next = { ...prev };
				for (const product of nextProducts) {
					next[product.id] = product;
				}
				return next;
			});

			setPaginationByCategory(prev => ({
				...prev,
				[categoryKey]: {
					page: nextMeta.page,
					lastPage: nextMeta.last_page,
					isLoading: false,
					error: null,
				},
			}));
		},
		[paginationByCategory, tenantSlug],
	);

	const handleCategoryChange = useCallback(
		(categoryKey: string) => {
			setActiveCategory(categoryKey);

			const hasData = (productsByCategory[categoryKey] || []).length > 0;
			const categoryState =
				paginationByCategory[categoryKey] || DEFAULT_PAGINATION_STATE;

			if (!hasData && !categoryState.isLoading) {
				void fetchProductsPage(categoryKey, 1, true);
			}
		},
		[fetchProductsPage, paginationByCategory, productsByCategory],
	);

	const loadNextPage = useCallback(() => {
		const categoryState =
			paginationByCategory[activeCategory] || DEFAULT_PAGINATION_STATE;

		if (categoryState.isLoading || categoryState.page >= categoryState.lastPage) {
			return;
		}

		void fetchProductsPage(activeCategory, categoryState.page + 1, false);
	}, [activeCategory, fetchProductsPage, paginationByCategory]);

	const setLoadMoreTarget = useCallback(
		(node: HTMLDivElement | null) => {
			if (loadMoreObserver.current) {
				loadMoreObserver.current.disconnect();
			}

			if (!node || !hasMoreInActiveCategory || activePagination.isLoading) {
				return;
			}

			loadMoreObserver.current = new IntersectionObserver(
				entries => {
					if (entries[0]?.isIntersecting) {
						loadNextPage();
					}
				},
				{
					root: null,
					threshold: 0.5,
					rootMargin: "0px 0px 120px 0px",
				},
			);

			loadMoreObserver.current.observe(node);
		},
		[
			activePagination.isLoading,
			hasMoreInActiveCategory,
			loadNextPage,
		],
	);

	useEffect(() => {
		return () => {
			loadMoreObserver.current?.disconnect();
		};
	}, []);

	const orderToken =
		state.success &&
		state.data &&
		typeof state.data === "object" &&
		"public_token" in state.data &&
		typeof state.data.public_token === "string"
			? state.data.public_token
			: null;

	const handleUpdateCart = (pid: number, qty: number) => {
		setCart(prev => {
			if (qty === 0) {
				const rest = { ...prev };
				delete rest[pid];
				return rest;
			}
			return { ...prev, [pid]: qty };
		});
	};

	const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

	// Prepare cart items data for hidden input
	const cartItems = Object.entries(cart).map(([pid, qty]) => {
		const product = knownProductsById[Number(pid)];
		return {
			product_id: Number(pid),
			name: product?.name || "منتج",
			quantity: String(qty),
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

				{/* Product List (Secondary) */}
				{categoryTabs.length > 0 && (
					<div className="mt-8">
						<div className="flex items-center justify-center mb-6">
							<div className="h-px bg-gray-200 w-full"></div>
							<span className="bg-gray-50 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
								أو اختر من القائمة
							</span>
							<div className="h-px bg-gray-200 w-full"></div>
						</div>

						<div className="mb-4 flex gap-2 overflow-x-auto pb-2">
							{categoryTabs.map(category => (
								<button
									key={category.key}
									type="button"
									onClick={() => handleCategoryChange(category.key)}
									className={`shrink-0 rounded h-14 border px-3 py-1.5 ${
										activeCategory === category.key
											? "border-indigo-600 bg-indigo-50 text-indigo-700"
											: "border-gray-300 bg-white text-gray-700"
									}`}
								>
									<span className="flex items-center gap-2">
										{category.image_url ? (
											<Image
												src={getImageUrl(category.image_url)}
												alt={category.label}
												width={40}
												height={40}
												className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
												unoptimized
											/>
										) : (
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">
												🛒
											</span>
										)}
										<span className="whitespace-nowrap text-sm font-medium">
											{category.label}
										</span>
										<span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
											{category.count}
										</span>
									</span>
								</button>
							))}
						</div>

						{activeProducts.length > 0 ? (
							<ProductList
								products={activeProducts}
								quantities={cart}
								onUpdateCart={handleUpdateCart}
								loadMoreTriggerIndex={
									hasMoreInActiveCategory ? activeLoadMoreIndex : undefined
								}
								setLoadMoreTarget={setLoadMoreTarget}
							/>
						) : (
							<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
								لا توجد منتجات في هذا القسم حالياً.
							</div>
						)}

						{activePagination.error && (
							<div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
								{activePagination.error}
							</div>
						)}

						{activePagination.isLoading && (
							<div className="mt-4 flex justify-center">
								<svg
									className="h-6 w-6 animate-spin text-gray-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
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
								العناصر المختارة
							</div>
							<div className="flex items-baseline gap-1">
								{totalItems > 0 ? (
									<>
										<span className="text-2xl font-bold text-gray-900">
											{totalItems}
										</span>
										<span className="text-sm font-semibold text-gray-500">
											عنصر
										</span>
									</>
								) : (
									<span className="text-sm font-medium text-gray-500 italic">
										السعر يتم تأكيده بعد الطلب
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
										<path d="m12 19-7-7 7-7" />
										<path d="M19 12H5" />
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
