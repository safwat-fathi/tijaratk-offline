'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import {
  addProductFromCatalogAction,
  createProductAction,
  removeProductAction,
  searchTenantProductsAction,
  updateProductAction,
} from '@/actions/product-actions';
import type { CatalogItem, Product, ProductOrderMode } from '@/types/models/product';
import CatalogSection from './CatalogSection';
import EditProductModal from './EditProductModal';
import MyProductsSection from './MyProductsSection';
import ProductMessageBanner from './ProductMessageBanner';
import ProductOnboardingHeader from './ProductOnboardingHeader';
import ProductSectionsTabs from './ProductSectionsTabs';
import QuickAddSection from './QuickAddSection';
import {
  ALL_CATALOG_ITEMS,
  CATEGORY_MODE_SELECT,
  DEFAULT_PRICE_PRESETS,
  DEFAULT_UNIT_LABEL,
  DEFAULT_WEIGHT_PRESETS,
  DUPLICATE_PRODUCT_PREFIX,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  MAX_PRODUCT_IMAGE_SIZE_MB,
  MIN_SEARCH_CHARS,
  ORDER_MODE_QUANTITY,
  SEARCH_DEBOUNCE_MS,
  SEARCH_RESULTS_LIMIT,
  SECTION_MY_PRODUCTS,
} from '../_utils/product-onboarding.constants';
import {
	buildAvailableProductCategories,
	buildCategoryTabsFromCatalog,
	buildOrderConfigPayload,
	buildProductsByNormalizedNameMap,
	buildSectionTabs,
	deriveEditFormState,
	filterCatalogItemsByCategory,
	hasAllowedProductImageFormat,
	isDuplicateMessage,
	isServerActionBodyLimitError,
	normalizeOptionalCategory,
	normalizeProductName,
	parseOptionalPositivePrice,
	resolveSectionFromQuery,
} from "../_utils/product-onboarding";
import type { CategoryMode, ProductSection } from '../_utils/product-onboarding.types';

type ProductOnboardingClientProps = {
	initialProducts: Product[];
	catalogItems: CatalogItem[];
	productCategories: string[];
};

export default function ProductOnboardingClient({
	initialProducts,
	catalogItems,
	productCategories,
}: ProductOnboardingClientProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [products, setProducts] = useState<Product[]>(initialProducts);

	const [manualName, setManualName] = useState("");
	const [manualPrice, setManualPrice] = useState("");
	const [manualOrderMode, setManualOrderMode] =
		useState<ProductOrderMode>(ORDER_MODE_QUANTITY);
	const [manualUnitLabel, setManualUnitLabel] = useState(DEFAULT_UNIT_LABEL);
	const [manualSecondaryUnitLabel, setManualSecondaryUnitLabel] = useState("");
	const [manualSecondaryUnitMultiplier, setManualSecondaryUnitMultiplier] =
		useState("");
	const [manualWeightPresets, setManualWeightPresets] = useState(
		DEFAULT_WEIGHT_PRESETS,
	);
	const [manualPricePresets, setManualPricePresets] = useState(
		DEFAULT_PRICE_PRESETS,
	);
	const [manualCategoryMode, setManualCategoryMode] =
		useState<CategoryMode>(CATEGORY_MODE_SELECT);
	const [manualCategorySelect, setManualCategorySelect] = useState("");
	const [manualCategoryCustom, setManualCategoryCustom] = useState("");

	const [message, setMessage] = useState<string | null>(null);
	const [activeCategory, setActiveCategory] = useState(ALL_CATALOG_ITEMS);
	const [pendingCatalogIds, setPendingCatalogIds] = useState<
		Record<number, boolean>
	>({});
	const [failedImageIds, setFailedImageIds] = useState<Record<number, boolean>>(
		{},
	);
	const [failedProductImageIds, setFailedProductImageIds] = useState<
		Record<number, boolean>
	>({});

	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [editName, setEditName] = useState("");
	const [editPrice, setEditPrice] = useState("");
	const [editIsAvailable, setEditIsAvailable] = useState(true);
	const [editOrderMode, setEditOrderMode] =
		useState<ProductOrderMode>(ORDER_MODE_QUANTITY);
	const [editUnitLabel, setEditUnitLabel] = useState(DEFAULT_UNIT_LABEL);
	const [editSecondaryUnitLabel, setEditSecondaryUnitLabel] = useState("");
	const [editSecondaryUnitMultiplier, setEditSecondaryUnitMultiplier] =
		useState("");
	const [editWeightPresets, setEditWeightPresets] = useState(
		DEFAULT_WEIGHT_PRESETS,
	);
	const [editPricePresets, setEditPricePresets] = useState(
		DEFAULT_PRICE_PRESETS,
	);
	const [editCategoryMode, setEditCategoryMode] =
		useState<CategoryMode>(CATEGORY_MODE_SELECT);
	const [editCategorySelect, setEditCategorySelect] = useState("");
	const [editCategoryCustom, setEditCategoryCustom] = useState("");
	const [editImageFile, setEditImageFile] = useState<File | null>(null);
	const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

	const [confirmRemoveProductId, setConfirmRemoveProductId] = useState<
		number | null
	>(null);
	const [removingProductId, setRemovingProductId] = useState<number | null>(
		null,
	);
	const [highlightedProductId, setHighlightedProductId] = useState<
		number | null
	>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Product[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [searchRefreshKey, setSearchRefreshKey] = useState(0);

	const productRowRefs = useRef<Record<number, HTMLLIElement | null>>({});

	const [isPending, startTransition] = useTransition();
	const [isEditPending, startEditTransition] = useTransition();
	const [, startRemoveTransition] = useTransition();

	const [debouncedSearchQuery] = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

	const [activeSection, setActiveSection] = useState<ProductSection>(() =>
		resolveSectionFromQuery(searchParams.get("section")),
	);

	const [availableProductCategories, setAvailableProductCategories] = useState<
		string[]
	>(() => buildAvailableProductCategories(productCategories));

	const availableProductCategorySet = useMemo(
		() => new Set(availableProductCategories),
		[availableProductCategories],
	);

	const categoryTabs = useMemo(
		() => buildCategoryTabsFromCatalog(catalogItems),
		[catalogItems],
	);

	const filteredCatalogItems = useMemo(
		() => filterCatalogItemsByCategory(catalogItems, activeCategory),
		[activeCategory, catalogItems],
	);

	const normalizedSearchInput = searchQuery.trim();
	const normalizedDebouncedSearch = debouncedSearchQuery.trim();
	const isSearchActive = normalizedDebouncedSearch.length >= MIN_SEARCH_CHARS;
	const needsMoreSearchChars =
		normalizedSearchInput.length > 0 &&
		normalizedSearchInput.length < MIN_SEARCH_CHARS;

	const displayedProducts = isSearchActive ? searchResults : products;
	const displayedProductsCountLabel = isSearchActive
		? `نتائج البحث: ${displayedProducts.length}`
		: `${products.length} منتج`;

	const sectionTabs = useMemo(
		() => buildSectionTabs(catalogItems.length, products.length),
		[catalogItems.length, products.length],
	);

	const activeSectionLabel =
		sectionTabs.find(section => section.key === activeSection)?.label ||
		sectionTabs[0].label;

	const safeMessage = typeof message === "string" ? message : "";
	const isDuplicateWarning = safeMessage.startsWith(DUPLICATE_PRODUCT_PREFIX);

	const productsByNormalizedName = useMemo(
		() => buildProductsByNormalizedNameMap(products),
		[products],
	);

	useEffect(() => {
		const sectionFromQuery = resolveSectionFromQuery(
			searchParams.get("section"),
		);
		setActiveSection(currentSection =>
			currentSection === sectionFromQuery ? currentSection : sectionFromQuery,
		);
	}, [searchParams]);

	const replaceSectionInQuery = (section: ProductSection) => {
		const nextParams = new URLSearchParams(searchParams.toString());
		if (section === "quick-add") {
			nextParams.delete("section");
		} else {
			nextParams.set("section", section);
		}

		const currentQuery = searchParams.toString();
		const nextQuery = nextParams.toString();
		if (currentQuery === nextQuery) {
			return;
		}

		const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
		router.replace(nextUrl, { scroll: false });
	};

	const handleSectionChange = (section: ProductSection) => {
		setActiveSection(section);
		replaceSectionInQuery(section);
	};

	useEffect(() => {
		if (!highlightedProductId) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setHighlightedProductId(null);
		}, 1800);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [highlightedProductId]);

	useEffect(() => {
		if (!isSearchActive) {
			setSearchResults([]);
			setSearchError(null);
			setIsSearching(false);
			return;
		}

		let isCancelled = false;
		setIsSearching(true);
		setSearchError(null);

		void (async () => {
			const response = await searchTenantProductsAction(
				normalizedDebouncedSearch,
				1,
				SEARCH_RESULTS_LIMIT,
			);

			if (isCancelled) {
				return;
			}

			if (!response.success || !response.data) {
				setSearchResults([]);
				setSearchError(response.message || "تعذر تحميل نتائج البحث");
				setIsSearching(false);
				return;
			}

			setSearchResults(response.data.data);
			setIsSearching(false);
		})();

		return () => {
			isCancelled = true;
		};
	}, [isSearchActive, normalizedDebouncedSearch, searchRefreshKey]);

	const refreshSearchResultsIfActive = () => {
		if (!isSearchActive) {
			return;
		}

		setSearchRefreshKey(prev => prev + 1);
	};

	const addCategoryOption = (category: string | null | undefined) => {
		const normalizedCategory = normalizeOptionalCategory(category ?? "");
		if (!normalizedCategory) {
			return;
		}

		setAvailableProductCategories(prev => {
			if (prev.includes(normalizedCategory)) {
				return prev;
			}

			return [...prev, normalizedCategory].sort((left, right) =>
				left.localeCompare(right, "ar"),
			);
		});
	};

	const highlightExistingProduct = (product: Product) => {
		setActiveSection(SECTION_MY_PRODUCTS);
		replaceSectionInQuery(SECTION_MY_PRODUCTS);
		setHighlightedProductId(product.id);
		setMessage(`${DUPLICATE_PRODUCT_PREFIX} ${product.name}`);
		setConfirmRemoveProductId(null);

		requestAnimationFrame(() => {
			const row = productRowRefs.current[product.id];
			if (!row) {
				return;
			}

			row.scrollIntoView({ behavior: "smooth", block: "center" });
			row.focus();
		});
	};

	const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmedName = manualName.trim();
		if (!trimmedName) {
			setMessage("اكتب اسم المنتج أولاً");
			return;
		}

		const parsedPrice = parseOptionalPositivePrice(manualPrice);
		if (!parsedPrice.valid) {
			setMessage("ادخل سعرًا صحيحًا أكبر من صفر");
			return;
		}

		const normalizedCategory = normalizeOptionalCategory(
			manualCategoryMode === CATEGORY_MODE_SELECT
				? manualCategorySelect
				: manualCategoryCustom,
		);

		const duplicateProduct = productsByNormalizedName.get(
			normalizeProductName(trimmedName),
		);
		if (duplicateProduct) {
			highlightExistingProduct(duplicateProduct);
			return;
		}

		startTransition(async () => {
			const orderConfig = buildOrderConfigPayload({
				mode: manualOrderMode,
				unitLabel: manualUnitLabel,
				secondaryLabel: manualSecondaryUnitLabel,
				secondaryMultiplier: manualSecondaryUnitMultiplier,
				weightPresets: manualWeightPresets,
				pricePresets: manualPricePresets,
			});

			const response = await createProductAction(
				trimmedName,
				undefined,
				parsedPrice.value ?? undefined,
				normalizedCategory,
				manualOrderMode,
				orderConfig,
			);

			if (!response.success || !response.data) {
				if (isDuplicateMessage(response.message)) {
					const existingProduct = productsByNormalizedName.get(
						normalizeProductName(trimmedName),
					);
					if (existingProduct) {
						highlightExistingProduct(existingProduct);
						return;
					}
				}

				setMessage(response.message || "تعذر إضافة المنتج");
				return;
			}

			setProducts(prev => [response.data, ...prev]);
			addCategoryOption(response.data.category);
			setManualName("");
			setManualPrice("");
			setManualOrderMode(ORDER_MODE_QUANTITY);
			setManualUnitLabel(DEFAULT_UNIT_LABEL);
			setManualSecondaryUnitLabel("");
			setManualSecondaryUnitMultiplier("");
			setManualWeightPresets(DEFAULT_WEIGHT_PRESETS);
			setManualPricePresets(DEFAULT_PRICE_PRESETS);
			setManualCategoryMode(CATEGORY_MODE_SELECT);
			setManualCategorySelect("");
			setManualCategoryCustom("");
			refreshSearchResultsIfActive();
			setConfirmRemoveProductId(null);
			setMessage("تم حفظ المنتج");
		});
	};

	const handleAddFromCatalog = (item: CatalogItem) => {
		const duplicateProduct = productsByNormalizedName.get(
			normalizeProductName(item.name),
		);
		if (duplicateProduct) {
			highlightExistingProduct(duplicateProduct);
			return;
		}

		const catalogItemId = item.id;
		setPendingCatalogIds(prev => ({
			...prev,
			[catalogItemId]: true,
		}));

		void (async () => {
			try {
				const response = await addProductFromCatalogAction(catalogItemId);

				if (!response.success || !response.data) {
					if (isDuplicateMessage(response.message)) {
						const existingProduct = productsByNormalizedName.get(
							normalizeProductName(item.name),
						);
						if (existingProduct) {
							highlightExistingProduct(existingProduct);
							return;
						}
					}

					setMessage(response.message || "تعذر إضافة المنتج من الكتالوج");
					return;
				}

				setProducts(prev => [response.data, ...prev]);
				addCategoryOption(response.data.category);
				refreshSearchResultsIfActive();
				setConfirmRemoveProductId(null);
				setMessage("تمت الإضافة");
			} finally {
				setPendingCatalogIds(prev => ({
					...prev,
					[catalogItemId]: false,
				}));
			}
		})();
	};

	const handleStartEdit = (product: Product) => {
		if (editImagePreview?.startsWith("blob:")) {
			URL.revokeObjectURL(editImagePreview);
		}

		const editState = deriveEditFormState(product, availableProductCategorySet);

		setEditingProduct(product);
		setEditName(editState.name);
		setEditPrice(editState.price);
		setEditIsAvailable(editState.isAvailable);
		setEditOrderMode(editState.orderMode);
		setEditUnitLabel(editState.unitLabel);
		setEditSecondaryUnitLabel(editState.secondaryUnitLabel);
		setEditSecondaryUnitMultiplier(editState.secondaryUnitMultiplier);
		setEditWeightPresets(editState.weightPresets);
		setEditPricePresets(editState.pricePresets);
		setEditCategoryMode(editState.categoryMode);
		setEditCategorySelect(editState.categorySelect);
		setEditCategoryCustom(editState.categoryCustom);
		setEditImageFile(null);
		setEditImagePreview(null);
		setConfirmRemoveProductId(null);
		setMessage(null);
	};

	const handleCloseEdit = () => {
		if (editImagePreview?.startsWith("blob:")) {
			URL.revokeObjectURL(editImagePreview);
		}

		setEditingProduct(null);
		setEditName("");
		setEditPrice("");
		setEditIsAvailable(true);
		setEditOrderMode(ORDER_MODE_QUANTITY);
		setEditUnitLabel(DEFAULT_UNIT_LABEL);
		setEditSecondaryUnitLabel("");
		setEditSecondaryUnitMultiplier("");
		setEditWeightPresets(DEFAULT_WEIGHT_PRESETS);
		setEditPricePresets(DEFAULT_PRICE_PRESETS);
		setEditCategoryMode(CATEGORY_MODE_SELECT);
		setEditCategorySelect("");
		setEditCategoryCustom("");
		setEditImageFile(null);
		setEditImagePreview(null);
	};

	const handleRequestRemove = (productId: number) => {
		if (removingProductId) {
			return;
		}

		setConfirmRemoveProductId(prev => (prev === productId ? null : productId));
		setMessage(null);
	};

	const handleRemoveProduct = (product: Product) => {
		setRemovingProductId(product.id);

		startRemoveTransition(async () => {
			const response = await removeProductAction(product.id);
			setRemovingProductId(null);

			if (!response.success) {
				setMessage(response.message || "تعذر حذف المنتج");
				return;
			}

			setProducts(prev => prev.filter(item => item.id !== product.id));
			refreshSearchResultsIfActive();
			setConfirmRemoveProductId(prev => (prev === product.id ? null : prev));
			if (editingProduct?.id === product.id) {
				handleCloseEdit();
			}
			if (highlightedProductId === product.id) {
				setHighlightedProductId(null);
			}
			setMessage(response.message || "تم حذف المنتج");
		});
	};

	const handleEditImageChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const selectedFile = event.target.files?.[0] ?? null;

		if (editImagePreview?.startsWith("blob:")) {
			URL.revokeObjectURL(editImagePreview);
		}

		if (selectedFile && selectedFile.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
			setEditImageFile(null);
			setEditImagePreview(null);
			event.target.value = "";
			setMessage(
				`حجم الصورة يجب ألا يتجاوز ${MAX_PRODUCT_IMAGE_SIZE_MB} ميجابايت`,
			);
			return;
		}

		if (selectedFile && !hasAllowedProductImageFormat(selectedFile)) {
			setEditImageFile(null);
			setEditImagePreview(null);
			event.target.value = "";
			setMessage(
				"صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP أو HEIC أو HEIF.",
			);
			return;
		}

		setEditImageFile(selectedFile);
		setEditImagePreview(
			selectedFile ? URL.createObjectURL(selectedFile) : null,
		);
	};

	const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!editingProduct) {
			return;
		}

		const trimmedName = editName.trim();
		if (!trimmedName) {
			setMessage("اسم المنتج مطلوب");
			return;
		}

		const parsedPrice = parseOptionalPositivePrice(editPrice);
		if (!parsedPrice.valid) {
			setMessage("ادخل سعرًا صحيحًا أكبر من صفر");
			return;
		}

		const normalizedCategory = normalizeOptionalCategory(
			editCategoryMode === CATEGORY_MODE_SELECT
				? editCategorySelect
				: editCategoryCustom,
		);

		const duplicateProduct = products.find(
			product =>
				product.id !== editingProduct.id &&
				normalizeProductName(product.name) ===
					normalizeProductName(trimmedName),
		);
		if (duplicateProduct) {
			highlightExistingProduct(duplicateProduct);
			return;
		}

		startEditTransition(async () => {
			try {
				const formData = new FormData();
				formData.set("name", trimmedName);
				formData.set("order_mode", editOrderMode);
				formData.set(
					"order_config",
					JSON.stringify(
						buildOrderConfigPayload({
							mode: editOrderMode,
							unitLabel: editUnitLabel,
							secondaryLabel: editSecondaryUnitLabel,
							secondaryMultiplier: editSecondaryUnitMultiplier,
							weightPresets: editWeightPresets,
							pricePresets: editPricePresets,
						}),
					),
				);
				if (parsedPrice.value !== null) {
					formData.set("current_price", String(parsedPrice.value));
				}
				formData.set("is_available", String(editIsAvailable));
				if (normalizedCategory) {
					formData.set("category", normalizedCategory);
				}
				if (editImageFile) {
					formData.set("file", editImageFile);
				}

				const response = await updateProductAction(editingProduct.id, formData);
				console.log("🚀 ~ :642 ~ handleEditSubmit ~ response:", response);

				if (!response.success || !response.data) {
					if (isDuplicateMessage(response.message)) {
						const existingProduct = products.find(
							product =>
								product.id !== editingProduct.id &&
								normalizeProductName(product.name) ===
									normalizeProductName(trimmedName),
						);
						if (existingProduct) {
							highlightExistingProduct(existingProduct);
							return;
						}
					}

					setMessage(response.message || "تعذر تعديل المنتج");
					return;
				}

				setProducts(prev =>
					prev.map(product =>
						product.id === editingProduct.id ? response.data! : product,
					),
				);
				addCategoryOption(response.data.category);
				refreshSearchResultsIfActive();
				setMessage("تم تعديل المنتج");
				handleCloseEdit();
			} catch (error) {
				if (isServerActionBodyLimitError(error)) {
					setMessage(
						`حجم الصورة كبير. الحد الأقصى ${MAX_PRODUCT_IMAGE_SIZE_MB} ميجابايت.`,
					);
					return;
				}

				setMessage("تعذر تعديل المنتج");
			}
		});
	};

	return (
		<div className="mx-auto w-full max-w-5xl space-y-4 pb-10">
			<div className="sticky top-[57px] z-20 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:top-0">
				<ProductOnboardingHeader
					activeSectionLabel={activeSectionLabel}
					productsCount={products.length}
				/>
				<ProductSectionsTabs
					sectionTabs={sectionTabs}
					activeSection={activeSection}
					onSectionChange={handleSectionChange}
				/>
			</div>

			{safeMessage && (
				<ProductMessageBanner
					message={safeMessage}
					isDuplicateWarning={isDuplicateWarning}
				/>
			)}

			<QuickAddSection
				active={activeSection === "quick-add"}
				onSubmit={handleManualSubmit}
				onShowMyProducts={() => handleSectionChange(SECTION_MY_PRODUCTS)}
				isPending={isPending}
				manualName={manualName}
				onManualNameChange={setManualName}
				manualPrice={manualPrice}
				onManualPriceChange={setManualPrice}
				manualOrderMode={manualOrderMode}
				onManualOrderModeChange={setManualOrderMode}
				manualUnitLabel={manualUnitLabel}
				onManualUnitLabelChange={setManualUnitLabel}
				manualSecondaryUnitLabel={manualSecondaryUnitLabel}
				onManualSecondaryUnitLabelChange={setManualSecondaryUnitLabel}
				manualSecondaryUnitMultiplier={manualSecondaryUnitMultiplier}
				onManualSecondaryUnitMultiplierChange={setManualSecondaryUnitMultiplier}
				manualWeightPresets={manualWeightPresets}
				onManualWeightPresetsChange={setManualWeightPresets}
				manualPricePresets={manualPricePresets}
				onManualPricePresetsChange={setManualPricePresets}
				manualCategoryMode={manualCategoryMode}
				onManualCategoryModeChange={setManualCategoryMode}
				manualCategorySelect={manualCategorySelect}
				onManualCategorySelectChange={setManualCategorySelect}
				manualCategoryCustom={manualCategoryCustom}
				onManualCategoryCustomChange={setManualCategoryCustom}
				availableProductCategories={availableProductCategories}
			/>

			<CatalogSection
				active={activeSection === "catalog"}
				catalogItems={catalogItems}
				categoryTabs={categoryTabs}
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
				filteredCatalogItems={filteredCatalogItems}
				pendingCatalogIds={pendingCatalogIds}
				failedImageIds={failedImageIds}
				onCatalogImageError={itemId =>
					setFailedImageIds(prev => ({
						...prev,
						[itemId]: true,
					}))
				}
				onAddFromCatalog={handleAddFromCatalog}
			/>

			<MyProductsSection
				active={activeSection === "my-products"}
				displayedProductsCountLabel={displayedProductsCountLabel}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
				needsMoreSearchChars={needsMoreSearchChars}
				isSearching={isSearching}
				searchError={searchError}
				isSearchActive={isSearchActive}
				displayedProducts={displayedProducts}
				confirmRemoveProductId={confirmRemoveProductId}
				removingProductId={removingProductId}
				highlightedProductId={highlightedProductId}
				failedProductImageIds={failedProductImageIds}
				onProductImageError={productId =>
					setFailedProductImageIds(prev => ({
						...prev,
						[productId]: true,
					}))
				}
				onStartEdit={handleStartEdit}
				onRequestRemove={handleRequestRemove}
				onRemoveProduct={handleRemoveProduct}
				onCancelRemove={() => setConfirmRemoveProductId(null)}
				setProductRowRef={(productId, node) => {
					productRowRefs.current[productId] = node;
				}}
			/>

			<EditProductModal
				editingProduct={editingProduct}
				onClose={handleCloseEdit}
				onSubmit={handleEditSubmit}
				isEditPending={isEditPending}
				editName={editName}
				onEditNameChange={setEditName}
				editPrice={editPrice}
				onEditPriceChange={setEditPrice}
				editIsAvailable={editIsAvailable}
				onEditIsAvailableChange={setEditIsAvailable}
				editOrderMode={editOrderMode}
				onEditOrderModeChange={setEditOrderMode}
				editUnitLabel={editUnitLabel}
				onEditUnitLabelChange={setEditUnitLabel}
				editSecondaryUnitLabel={editSecondaryUnitLabel}
				onEditSecondaryUnitLabelChange={setEditSecondaryUnitLabel}
				editSecondaryUnitMultiplier={editSecondaryUnitMultiplier}
				onEditSecondaryUnitMultiplierChange={setEditSecondaryUnitMultiplier}
				editWeightPresets={editWeightPresets}
				onEditWeightPresetsChange={setEditWeightPresets}
				editPricePresets={editPricePresets}
				onEditPricePresetsChange={setEditPricePresets}
				editCategoryMode={editCategoryMode}
				onEditCategoryModeChange={setEditCategoryMode}
				editCategorySelect={editCategorySelect}
				onEditCategorySelectChange={setEditCategorySelect}
				editCategoryCustom={editCategoryCustom}
				onEditCategoryCustomChange={setEditCategoryCustom}
				availableProductCategories={availableProductCategories}
				editImagePreview={editImagePreview}
				onEditImageChange={handleEditImageChange}
			/>
		</div>
	);
}
