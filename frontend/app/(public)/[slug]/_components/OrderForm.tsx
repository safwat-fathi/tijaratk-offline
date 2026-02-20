"use client";

import {
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { InvalidEvent } from "react";
import type { Product, PublicProductCategory, PublicProductsMeta } from "@/types/models/product";
import type { Order } from "@/types/models/order";
import { createOrderAction, type CreateOrderState } from "@/actions/order-actions";
import {
	markAvailabilityRequestSentAction,
	prepareAvailabilityRequestAction,
} from "@/actions/availability-request-cookie-actions";
import { productsService } from "@/services/api/products.service";
import { availabilityRequestsService } from "@/services/api/availability-requests.service";
import { dedupeByNumericId } from "@/lib/utils/collections";
import {
	type AvailabilityRequestOutcome,
	type ProductCartSelection,
} from "./ProductList";
import Toast from "./Toast";
import CategoryEntryGrid from "./CategoryEntryGrid";
import CategoryProductsView from "./CategoryProductsView";
import OrderSuccessView from "./OrderSuccessView";
import OrderNotesSection from "./OrderNotesSection";
import DeliveryDetailsSection from "./DeliveryDetailsSection";
import OrderSubmitBar from "./OrderSubmitBar";
import {
	ALL_PRODUCTS_CATEGORY,
	buildInitialCartSelections,
	buildCategoryTabs,
	buildCartItems,
	calculateCartSummary,
	type PaginationState,
} from "../_utils/order-form";

const initialState: CreateOrderState = {
	success: false,
	message: "",
	errors: undefined,
	data: undefined,
};

const PAGE_SIZE = 20;
const PRELOAD_THRESHOLD_ITEMS = 5;
const STICKY_HEADER_SELECTOR = "[data-store-header]";
const SUBMIT_BAR_SELECTOR = "[data-order-submit-bar]";
const VIEWPORT_SCROLL_MARGIN = 16;

const DEFAULT_PAGINATION_STATE: PaginationState = {
	page: 1,
	lastPage: 1,
	isLoading: false,
	error: null,
};

type ToastState = {
	message: string;
	type: "success" | "error";
};

type OrderFormProps = {
	tenantSlug: string;
	initialProducts: Product[];
	initialProductsMeta: PublicProductsMeta;
	initialCategories: PublicProductCategory[];
	initialOrder?: Order | null;
	savedCustomerProfile?: {
		name?: string;
		phone: string;
		address?: string;
		notes?: string;
		updated_at: string;
	} | null;
};

export default function OrderForm({
	tenantSlug,
	initialProducts,
	initialProductsMeta,
	initialCategories,
	initialOrder,
	savedCustomerProfile,
}: OrderFormProps) {
	const [cartSelections, setCartSelections] = useState<
		Record<number, ProductCartSelection>
	>(() => buildInitialCartSelections(initialOrder));
	const [notes, setNotes] = useState(
		initialOrder?.notes || savedCustomerProfile?.notes || "",
	);
	const [orderRequest, setOrderRequest] = useState(
		initialOrder?.free_text_payload?.text || "",
	);
	const [state, formAction, isPending] = useActionState(
		createOrderAction.bind(null, tenantSlug),
		initialState,
	);
	const [activeCategory, setActiveCategory] = useState(ALL_PRODUCTS_CATEGORY);
	const [isCategoryProductsView, setIsCategoryProductsView] = useState(false);
	const [toastState, setToastState] = useState<ToastState | null>(null);
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
		Object.fromEntries(
			initialProducts.map((product) => [product.id, product]),
		) as Record<number, Product>,
	);

	const loadMoreObserver = useRef<IntersectionObserver | null>(null);
	const categoryPillRefs = useRef<Map<string, HTMLButtonElement | null>>(
		new Map(),
	);
	const hasHandledInvalidRef = useRef(false);

	const categoryTabs = useMemo(
		() =>
			buildCategoryTabs(initialCategories, initialProducts, initialProductsMeta.total),
		[initialCategories, initialProducts, initialProductsMeta.total],
	);

	const categoryCards = useMemo(
		() => categoryTabs.filter(category => category.key !== ALL_PRODUCTS_CATEGORY),
		[categoryTabs],
	);

	const hasMerchantProducts =
		initialProductsMeta.total > 0 ||
		initialProducts.length > 0 ||
		initialCategories.some(category => category.count > 0);
	const productsByCategoryMap = useMemo(
		() => new Map(Object.entries(productsByCategory)),
		[productsByCategory],
	);
	const paginationByCategoryMap = useMemo(
		() => new Map(Object.entries(paginationByCategory)),
		[paginationByCategory],
	);

	const activeProducts = productsByCategoryMap.get(activeCategory) || [];
	const activePagination =
		paginationByCategoryMap.get(activeCategory) || DEFAULT_PAGINATION_STATE;
	const hasMoreInActiveCategory = activePagination.page < activePagination.lastPage;
	const activeLoadMoreIndex =
		activeProducts.length === 0
			? -1
			: Math.max(0, activeProducts.length - (PRELOAD_THRESHOLD_ITEMS + 1));

	const fetchProductsPage = useCallback(
		async (categoryKey: string, page: number, replace: boolean) => {
			const currentState =
				paginationByCategoryMap.get(categoryKey) || DEFAULT_PAGINATION_STATE;
			if (currentState.isLoading) {
				return;
			}

			setPaginationByCategory((prev) => {
				const prevMap = new Map(Object.entries(prev));
				const previousState =
					prevMap.get(categoryKey) || DEFAULT_PAGINATION_STATE;
				prevMap.set(categoryKey, {
					...previousState,
					isLoading: true,
					error: null,
				});
				return Object.fromEntries(prevMap);
			});

			const response = await productsService.getPublicProducts(tenantSlug, {
				category: categoryKey === ALL_PRODUCTS_CATEGORY ? undefined : categoryKey,
				page,
				limit: PAGE_SIZE,
			});

			if (!response.success || !response.data) {
				setPaginationByCategory((prev) => {
					const prevMap = new Map(Object.entries(prev));
					const previousState =
						prevMap.get(categoryKey) || DEFAULT_PAGINATION_STATE;
					prevMap.set(categoryKey, {
						...previousState,
						isLoading: false,
						error: "تعذر تحميل المنتجات حالياً",
					});
					return Object.fromEntries(prevMap);
				});
				return;
			}

			const nextProducts = response.data.data;
			const nextMeta = response.data.meta;

			setProductsByCategory((prev) => {
				const prevMap = new Map(Object.entries(prev));
				const previousProducts = prevMap.get(categoryKey) || [];
				prevMap.set(
					categoryKey,
					replace
						? nextProducts
						: dedupeByNumericId([...previousProducts, ...nextProducts]),
				);
				return Object.fromEntries(prevMap);
			});

			setKnownProductsById((prev) => {
				const nextMap = new Map(
					Object.entries(prev).map(([productId, product]) => [
						Number(productId),
						product,
					]),
				);
				for (const product of nextProducts) {
					nextMap.set(product.id, product);
				}
				return Object.fromEntries(nextMap) as Record<number, Product>;
			});

			setPaginationByCategory((prev) => {
				const prevMap = new Map(Object.entries(prev));
				prevMap.set(categoryKey, {
					page: nextMeta.page,
					lastPage: nextMeta.last_page,
					isLoading: false,
					error: null,
				});
				return Object.fromEntries(prevMap);
			});
		},
		[paginationByCategoryMap, tenantSlug],
	);

	const handleCategoryChange = useCallback(
		(categoryKey: string) => {
			setActiveCategory(categoryKey);

			const hasData = (productsByCategoryMap.get(categoryKey) || []).length > 0;
			const categoryState =
				paginationByCategoryMap.get(categoryKey) || DEFAULT_PAGINATION_STATE;

			if (!hasData && !categoryState.isLoading) {
				void fetchProductsPage(categoryKey, 1, true);
			}
		},
		[fetchProductsPage, paginationByCategoryMap, productsByCategoryMap],
	);

	const handleCategoryEntry = useCallback(
		(categoryKey: string) => {
			setIsCategoryProductsView(true);
			handleCategoryChange(categoryKey);
		},
		[handleCategoryChange],
	);

	const scrollActiveCategoryPillIntoView = useCallback((categoryKey: string) => {
		const pillNode = categoryPillRefs.current.get(categoryKey);
		if (!pillNode) {
			return;
		}

		pillNode.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "center",
		});
	}, []);

	const loadNextPage = useCallback(() => {
		const categoryState =
			paginationByCategoryMap.get(activeCategory) || DEFAULT_PAGINATION_STATE;

		if (categoryState.isLoading || categoryState.page >= categoryState.lastPage) {
			return;
		}

		void fetchProductsPage(activeCategory, categoryState.page + 1, false);
	}, [activeCategory, fetchProductsPage, paginationByCategoryMap]);

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
		[activePagination.isLoading, hasMoreInActiveCategory, loadNextPage],
	);

	const setCategoryPillRef = useCallback(
		(categoryKey: string, node: HTMLButtonElement | null) => {
			if (node) {
				categoryPillRefs.current.set(categoryKey, node);
				return;
			}

			categoryPillRefs.current.delete(categoryKey);
		},
		[],
	);

	useEffect(() => {
		return () => {
			loadMoreObserver.current?.disconnect();
		};
	}, []);

	useEffect(() => {
		if (!isCategoryProductsView) {
			return;
		}

		const raf = requestAnimationFrame(() => {
			scrollActiveCategoryPillIntoView(activeCategory);
		});

		return () => cancelAnimationFrame(raf);
	}, [activeCategory, isCategoryProductsView, scrollActiveCategoryPillIntoView]);

	const orderToken =
		state.success &&
		state.data &&
		typeof state.data === "object" &&
		"public_token" in state.data &&
		typeof state.data.public_token === "string"
			? state.data.public_token
			: null;

	const handleUpdateSelection = (
		product: Product,
		selection: ProductCartSelection | null,
	) => {
		if (!product.is_available) {
			return;
		}

		setCartSelections(prev => {
			if (!selection) {
				const next = { ...prev };
				delete next[product.id];
				return next;
			}

			return {
				...prev,
				[product.id]: selection,
			};
		});
	};

	const handleProductAdded = () => {
		setToastState({ message: "تمت الإضافة", type: "success" });
		if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
			navigator.vibrate(10);
		}
	};

	const getViewportOffsets = useCallback(() => {
		const stickyHeader = document.querySelector<HTMLElement>(
			STICKY_HEADER_SELECTOR,
		);
		const submitBar = document.querySelector<HTMLElement>(SUBMIT_BAR_SELECTOR);
		const safeTop =
			(stickyHeader?.getBoundingClientRect().height || 0) +
			VIEWPORT_SCROLL_MARGIN;
		const desiredSafeBottom =
			window.innerHeight -
			(submitBar?.getBoundingClientRect().height || 0) -
			VIEWPORT_SCROLL_MARGIN;
		const safeBottom = Math.max(safeTop + 120, desiredSafeBottom);
		return { safeTop, safeBottom };
	}, []);

	const keepElementVisibleInViewport = useCallback(
		(element: HTMLElement, behavior: ScrollBehavior) => {
			const { safeTop, safeBottom } = getViewportOffsets();
			const rect = element.getBoundingClientRect();
			let targetTop: number | null = null;

			if (rect.top < safeTop) {
				targetTop = window.scrollY + rect.top - safeTop;
			} else if (rect.bottom > safeBottom) {
				targetTop = window.scrollY + rect.bottom - safeBottom;
			}

			if (targetTop === null) {
				return;
			}

			window.scrollTo({
				top: Math.max(0, targetTop),
				behavior,
			});
		},
		[getViewportOffsets],
	);

	const scrollToDeliveryDetails = useCallback(() => {
		const section = document.getElementById("delivery-details-section");
		if (!section) {
			return;
		}

		const { safeTop } = getViewportOffsets();
		const sectionTop = window.scrollY + section.getBoundingClientRect().top;
		window.scrollTo({
			top: Math.max(0, sectionTop - safeTop),
			behavior: "smooth",
		});
	}, [getViewportOffsets]);

	const handleFormSubmitCapture = useCallback(() => {
		hasHandledInvalidRef.current = false;
	}, []);

	const handleFormInvalidCapture = useCallback(
		(event: InvalidEvent<HTMLFormElement>) => {
			if (hasHandledInvalidRef.current) {
				return;
			}

			const invalidElement = event.target;
			if (!(invalidElement instanceof HTMLElement)) {
				return;
			}

			hasHandledInvalidRef.current = true;
			invalidElement.focus({ preventScroll: true });
			keepElementVisibleInViewport(invalidElement, "auto");
		},
		[keepElementVisibleInViewport],
	);

	const handleRequestAvailability = useCallback(
		async (product: Product): Promise<AvailabilityRequestOutcome> => {
			if (product.is_available) {
				return "failed";
			}

			const prepared = await prepareAvailabilityRequestAction({
				slug: tenantSlug,
				product_id: product.id,
			});

			if (!prepared.success || !prepared.visitor_key) {
				setToastState({
					message: prepared.message || "تعذر إرسال الطلب حالياً",
					type: "error",
				});
				return "failed";
			}

			if (prepared.already_requested_today) {
				setToastState({
					message: "سبق وسجلنا طلبك لهذا المنتج اليوم",
					type: "success",
				});
				return "already_requested_today";
			}

			const response = await availabilityRequestsService.createPublicRequest(
				tenantSlug,
				{
					product_id: product.id,
					visitor_key: prepared.visitor_key,
				},
			);

			if (!response.success || !response.data) {
				setToastState({
					message: response.message || "تعذر إرسال الطلب حالياً",
					type: "error",
				});
				return "failed";
			}

			await markAvailabilityRequestSentAction({
				slug: tenantSlug,
				product_id: product.id,
				date_key: prepared.date_key,
			});

			if (response.data.status === "created") {
				setToastState({ message: "تم إرسال طلبك للتاجر", type: "success" });
			} else {
				setToastState({
					message: "سبق وسجلنا طلبك لهذا المنتج اليوم",
					type: "success",
				});
			}

			return response.data.status;
		},
		[tenantSlug],
	);

	const knownProductsByIdMap = useMemo(
		() =>
			new Map(
				Object.entries(knownProductsById).map(([productId, product]) => [
					Number(productId),
					product,
				]),
			),
		[knownProductsById],
	);

	const effectiveCartSelections = useMemo(() => {
		const effectiveSelectionEntries = Object.entries(cartSelections).flatMap(
			([productId, selection]) => {
				const parsedProductId = Number(productId);
				const product = knownProductsByIdMap.get(parsedProductId);
				if (product?.is_available === false) {
					return [];
				}

				return [[parsedProductId, selection]] as Array<
					[number, ProductCartSelection]
				>;
			},
		);

		return Object.fromEntries(effectiveSelectionEntries) as Record<
			number,
			ProductCartSelection
		>;
	}, [cartSelections, knownProductsByIdMap]);

	const { totalItems, estimatedTotal, hasPricedItems } = useMemo(
		() => calculateCartSummary(effectiveCartSelections, knownProductsById),
		[effectiveCartSelections, knownProductsById],
	);

	const cartItems = useMemo(
		() =>
			buildCartItems(effectiveCartSelections, knownProductsById).filter(item => {
				const product = knownProductsByIdMap.get(item.product_id);
				return product ? product.is_available !== false : true;
			}),
		[effectiveCartSelections, knownProductsById, knownProductsByIdMap],
	);

	const copyToken = () => {
		if (orderToken) {
			const url = `${window.location.origin}/track-order/${orderToken}`;
			navigator.clipboard.writeText(url);
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
			<OrderSuccessView
				tenantSlug={tenantSlug}
				orderToken={orderToken}
				onCopyToken={copyToken}
			/>
		);
	}

	return (
		<>
			{toastState && (
				<Toast
					message={toastState.message}
					type={toastState.type}
					position="bottom"
					duration={1400}
					onClose={() => setToastState(null)}
				/>
			)}
			<form
				action={formAction}
				onSubmitCapture={handleFormSubmitCapture}
				onInvalidCapture={handleFormInvalidCapture}
			>
				<input type="hidden" name="cart" value={JSON.stringify(cartItems)} />

				{hasMerchantProducts && (
					<div className="mt-4 space-y-4">
						{!isCategoryProductsView && (
							<CategoryEntryGrid
								categoryCards={categoryCards}
								onSelectCategory={handleCategoryEntry}
								onShowAll={() => handleCategoryEntry(ALL_PRODUCTS_CATEGORY)}
							/>
						)}

						{isCategoryProductsView && (
							<CategoryProductsView
								categoryTabs={categoryTabs}
								activeCategory={activeCategory}
								activeProducts={activeProducts}
								activePagination={activePagination}
								hasMoreInActiveCategory={hasMoreInActiveCategory}
								activeLoadMoreIndex={activeLoadMoreIndex}
								cartSelections={effectiveCartSelections}
								onBack={() => setIsCategoryProductsView(false)}
								onCategoryChange={handleCategoryChange}
								setCategoryPillRef={setCategoryPillRef}
								onUpdateSelection={handleUpdateSelection}
								onProductAdded={handleProductAdded}
								onRequestAvailability={handleRequestAvailability}
								setLoadMoreTarget={setLoadMoreTarget}
							/>
						)}
					</div>
				)}

				<OrderNotesSection
					orderRequest={orderRequest}
					onOrderRequestChange={setOrderRequest}
					error={state.errors?.order_request?.[0]}
				/>

				<DeliveryDetailsSection
					initialOrder={initialOrder}
					savedCustomerProfile={savedCustomerProfile}
					notes={notes}
					onNotesChange={setNotes}
					errors={state.errors}
					message={state.message}
					success={state.success}
				/>

				<OrderSubmitBar
					totalItems={totalItems}
					hasPricedItems={hasPricedItems}
					estimatedTotal={estimatedTotal}
					orderRequest={orderRequest}
					isPending={isPending}
					onSubmitClick={scrollToDeliveryDetails}
				/>
			</form>
		</>
	);
}
