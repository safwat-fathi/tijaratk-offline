'use client';

import Image from 'next/image';
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
import { formatCurrency } from '@/lib/utils/currency';
import { CatalogItem, Product } from '@/types/models/product';

const ALL_CATALOG_ITEMS = '__all__';
const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_SIZE_MB = 5;
const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const ALLOWED_PRODUCT_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
]);
const DUPLICATE_PRODUCT_PREFIX = 'المنتج موجود بالفعل:';
const MIN_SEARCH_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULTS_LIMIT = 20;
const CATEGORY_MODE_SELECT = 'select';
const CATEGORY_MODE_CUSTOM = 'custom';
type CategoryMode = typeof CATEGORY_MODE_SELECT | typeof CATEGORY_MODE_CUSTOM;
const SECTION_QUICK_ADD = 'quick-add';
const SECTION_CATALOG = 'catalog';
const SECTION_MY_PRODUCTS = 'my-products';
type ProductSection =
  | typeof SECTION_QUICK_ADD
  | typeof SECTION_CATALOG
  | typeof SECTION_MY_PRODUCTS;
type SectionTab = {
  key: ProductSection;
  label: string;
  description: string;
};

const resolveSectionFromQuery = (value: string | null): ProductSection => {
  if (value === SECTION_CATALOG || value === SECTION_MY_PRODUCTS || value === SECTION_QUICK_ADD) {
    return value;
  }

  return SECTION_QUICK_ADD;
};

const normalizeProductName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').toLowerCase();

const normalizeOptionalCategory = (value: string): string | undefined => {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized;
};

const isDuplicateMessage = (message?: string): boolean => {
  if (!message) {
    return false;
  }

  return /(already exists|duplicate|موجود بالفعل)/i.test(message);
};

const resolveImageUrl = (imageUrl?: string | null): string | null => {
  if (!imageUrl?.trim()) {
    return null;
  }

  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/uploads')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return imageUrl;
    }

    return `${apiBaseUrl.replace(/\/$/, '')}${imageUrl}`;
  }

  return imageUrl;
};

const isServerActionBodyLimitError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('Body exceeded') ||
    error.message.includes('body size limit') ||
    error.message.includes('body limit')
  );
};

const parseOptionalPositivePrice = (
  value: string,
): { value: number | null; valid: boolean } => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return { value: null, valid: true };
  }

  const parsedPrice = Number(normalized);
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return { value: null, valid: false };
  }

  return { value: Number(parsedPrice.toFixed(2)), valid: true };
};

const resolveProductPriceText = (value: Product['current_price']): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsedPrice = Number(value);
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return null;
  }

  return formatCurrency(parsedPrice) || null;
};

const hasAllowedProductImageFormat = (file: File): boolean => {
  const mimeType = file.type.trim().toLowerCase();
  if (ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(mimeType)) {
    return true;
  }

  const extensionMatch = /\.[^.]+$/.exec(file.name);
  const extension = extensionMatch?.[0].toLowerCase() || '';
  const hasAllowedExtension = ALLOWED_PRODUCT_IMAGE_EXTENSIONS.has(extension);
  const hasGenericMimeType = !mimeType || mimeType === 'application/octet-stream';

  return hasGenericMimeType && hasAllowedExtension;
};

type ProductOnboardingClientProps = {
  initialProducts: Product[];
  catalogItems: CatalogItem[];
  catalogCategories: string[];
};

export default function ProductOnboardingClient({
  initialProducts,
  catalogItems,
  catalogCategories,
}: ProductOnboardingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualCategoryMode, setManualCategoryMode] = useState<CategoryMode>(CATEGORY_MODE_SELECT);
  const [manualCategorySelect, setManualCategorySelect] = useState('');
  const [manualCategoryCustom, setManualCategoryCustom] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(ALL_CATALOG_ITEMS);
  const [pendingCatalogIds, setPendingCatalogIds] = useState<Record<number, boolean>>({});
  const [failedImageIds, setFailedImageIds] = useState<Record<number, boolean>>({});
  const [failedProductImageIds, setFailedProductImageIds] = useState<Record<number, boolean>>(
    {},
  );
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategoryMode, setEditCategoryMode] = useState<CategoryMode>(CATEGORY_MODE_SELECT);
  const [editCategorySelect, setEditCategorySelect] = useState('');
  const [editCategoryCustom, setEditCategoryCustom] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [confirmRemoveProductId, setConfirmRemoveProductId] = useState<number | null>(null);
  const [removingProductId, setRemovingProductId] = useState<number | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    resolveSectionFromQuery(searchParams.get('section')),
  );
  const availableCatalogCategories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    for (const category of catalogCategories) {
      const normalizedCategory = category.trim();
      if (!normalizedCategory) {
        continue;
      }
      uniqueCategories.add(normalizedCategory);
    }

    return Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [catalogCategories]);
  const availableCatalogCategorySet = useMemo(
    () => new Set(availableCatalogCategories),
    [availableCatalogCategories],
  );

  const categoryTabs = useMemo(() => {
    const categoryMap = new Map<string, { count: number; imageUrl: string | null }>();

    for (const item of catalogItems) {
      const resolvedImageUrl = resolveImageUrl(item.image_url);
      const existing = categoryMap.get(item.category);

      if (existing) {
        existing.count += 1;
        if (!existing.imageUrl && resolvedImageUrl) {
          existing.imageUrl = resolvedImageUrl;
        }
        continue;
      }

      categoryMap.set(item.category, {
        count: 1,
        imageUrl: resolvedImageUrl,
      });
    }

    const categories = Array.from(categoryMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'ar'))
      .map(([category, value]) => ({
        key: category,
        label: category,
        count: value.count,
        imageUrl: value.imageUrl,
      }));

    const allTabImage = categories.find((category) => category.imageUrl)?.imageUrl || null;

    return [
      {
        key: ALL_CATALOG_ITEMS,
        label: 'الكل',
        count: catalogItems.length,
        imageUrl: allTabImage,
      },
      ...categories,
    ];
  }, [catalogItems]);

  const filteredCatalogItems = useMemo(() => {
    if (activeCategory === ALL_CATALOG_ITEMS) {
      return catalogItems;
    }

    return catalogItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, catalogItems]);
  const normalizedSearchInput = searchQuery.trim();
  const normalizedDebouncedSearch = debouncedSearchQuery.trim();
  const isSearchActive = normalizedDebouncedSearch.length >= MIN_SEARCH_CHARS;
  const needsMoreSearchChars =
    normalizedSearchInput.length > 0 && normalizedSearchInput.length < MIN_SEARCH_CHARS;
  const displayedProducts = isSearchActive ? searchResults : products;
  const displayedProductsCountLabel = isSearchActive
    ? `نتائج البحث: ${displayedProducts.length}`
    : `${products.length} منتج`;
  const sectionTabs = useMemo<SectionTab[]>(
    () => [
      {
        key: SECTION_QUICK_ADD,
        label: 'إضافة سريع',
        description: 'إضافة منتج يدويًا',
      },
      {
        key: SECTION_CATALOG,
        label: 'الكتالوج',
        description: `${catalogItems.length} منتج جاهز`,
      },
      {
        key: SECTION_MY_PRODUCTS,
        label: 'منتجاتك',
        description: `${products.length} منتج`,
      },
    ],
    [catalogItems.length, products.length],
  );
  const activeSectionLabel =
    sectionTabs.find((section) => section.key === activeSection)?.label || sectionTabs[0].label;

  const isDuplicateWarning = message?.startsWith(DUPLICATE_PRODUCT_PREFIX);

  const productsByNormalizedName = useMemo(() => {
    const map = new Map<string, Product>();

    for (const product of products) {
      const normalizedName = normalizeProductName(product.name);
      if (!normalizedName || map.has(normalizedName)) {
        continue;
      }

      map.set(normalizedName, product);
    }

    return map;
  }, [products]);

  useEffect(() => {
    const sectionFromQuery = resolveSectionFromQuery(searchParams.get('section'));
    setActiveSection((currentSection) =>
      currentSection === sectionFromQuery ? currentSection : sectionFromQuery,
    );
  }, [searchParams]);

  const replaceSectionInQuery = (section: ProductSection) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (section === SECTION_QUICK_ADD) {
      nextParams.delete('section');
    } else {
      nextParams.set('section', section);
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
        setSearchError(response.message || 'تعذر تحميل نتائج البحث');
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

    setSearchRefreshKey((prev) => prev + 1);
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

      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.focus();
    });
  };

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = manualName.trim();
    if (!trimmedName) {
      setMessage('اكتب اسم المنتج أولاً');
      return;
    }

    const parsedPrice = parseOptionalPositivePrice(manualPrice);
    if (!parsedPrice.valid) {
      setMessage('ادخل سعرًا صحيحًا أكبر من صفر');
      return;
    }

    const normalizedCategory = normalizeOptionalCategory(
      manualCategoryMode === CATEGORY_MODE_SELECT
        ? manualCategorySelect
        : manualCategoryCustom,
    );

    const duplicateProduct = productsByNormalizedName.get(normalizeProductName(trimmedName));
    if (duplicateProduct) {
      highlightExistingProduct(duplicateProduct);
      return;
    }

    startTransition(async () => {
      const response = await createProductAction(
        trimmedName,
        undefined,
        parsedPrice.value ?? undefined,
        normalizedCategory,
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

        setMessage(response.message || 'تعذر إضافة المنتج');
        return;
      }

      setProducts((prev) => [response.data, ...prev]);
      setManualName('');
      setManualPrice('');
      setManualCategoryMode(CATEGORY_MODE_SELECT);
      setManualCategorySelect('');
      setManualCategoryCustom('');
      refreshSearchResultsIfActive();
      setConfirmRemoveProductId(null);
      setMessage('تم حفظ المنتج');
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
    setPendingCatalogIds((prev) => ({
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

          setMessage(response.message || 'تعذر إضافة المنتج من الكتالوج');
          return;
        }

        setProducts((prev) => [response.data, ...prev]);
        refreshSearchResultsIfActive();
        setConfirmRemoveProductId(null);
        setMessage('تمت الإضافة');
      } finally {
        setPendingCatalogIds((prev) => ({
          ...prev,
          [catalogItemId]: false,
        }));
      }
    })();
  };

  const handleStartEdit = (product: Product) => {
    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }

    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(
      product.current_price === null || product.current_price === undefined || product.current_price === ''
        ? ''
        : String(Number(product.current_price)),
    );
    const normalizedCategory = product.category?.trim() || '';
    if (normalizedCategory && availableCatalogCategorySet.has(normalizedCategory)) {
      setEditCategoryMode(CATEGORY_MODE_SELECT);
      setEditCategorySelect(normalizedCategory);
      setEditCategoryCustom('');
    } else if (normalizedCategory) {
      setEditCategoryMode(CATEGORY_MODE_CUSTOM);
      setEditCategorySelect('');
      setEditCategoryCustom(normalizedCategory);
    } else {
      setEditCategoryMode(CATEGORY_MODE_SELECT);
      setEditCategorySelect('');
      setEditCategoryCustom('');
    }
    setEditImageFile(null);
    setEditImagePreview(null);
    setConfirmRemoveProductId(null);
    setMessage(null);
  };

  const handleCloseEdit = () => {
    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }

    setEditingProduct(null);
    setEditName('');
    setEditPrice('');
    setEditCategoryMode(CATEGORY_MODE_SELECT);
    setEditCategorySelect('');
    setEditCategoryCustom('');
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleRequestRemove = (productId: number) => {
    if (removingProductId) {
      return;
    }

    setConfirmRemoveProductId((prev) => (prev === productId ? null : productId));
    setMessage(null);
  };

  const handleRemoveProduct = (product: Product) => {
    setRemovingProductId(product.id);

    startRemoveTransition(async () => {
      const response = await removeProductAction(product.id);
      setRemovingProductId(null);

      if (!response.success) {
        setMessage(response.message || 'تعذر حذف المنتج');
        return;
      }

      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      refreshSearchResultsIfActive();
      setConfirmRemoveProductId((prev) => (prev === product.id ? null : prev));
      if (editingProduct?.id === product.id) {
        handleCloseEdit();
      }
      if (highlightedProductId === product.id) {
        setHighlightedProductId(null);
      }
      setMessage(response.message || 'تم حذف المنتج');
    });
  };

  const handleEditImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }

    if (selectedFile && selectedFile.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      setEditImageFile(null);
      setEditImagePreview(null);
      event.target.value = '';
      setMessage(`حجم الصورة يجب ألا يتجاوز ${MAX_PRODUCT_IMAGE_SIZE_MB} ميجابايت`);
      return;
    }

    if (selectedFile && !hasAllowedProductImageFormat(selectedFile)) {
      setEditImageFile(null);
      setEditImagePreview(null);
      event.target.value = '';
      setMessage('صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP أو HEIC أو HEIF.');
      return;
    }

    setEditImageFile(selectedFile);
    setEditImagePreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setMessage('اسم المنتج مطلوب');
      return;
    }

    const parsedPrice = parseOptionalPositivePrice(editPrice);
    if (!parsedPrice.valid) {
      setMessage('ادخل سعرًا صحيحًا أكبر من صفر');
      return;
    }

    const normalizedCategory = normalizeOptionalCategory(
      editCategoryMode === CATEGORY_MODE_SELECT ? editCategorySelect : editCategoryCustom,
    );

    const duplicateProduct = products.find(
      (product) =>
        product.id !== editingProduct.id &&
        normalizeProductName(product.name) === normalizeProductName(trimmedName),
    );
    if (duplicateProduct) {
      highlightExistingProduct(duplicateProduct);
      return;
    }

    startEditTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('name', trimmedName);
        if (parsedPrice.value !== null) {
          formData.set('current_price', String(parsedPrice.value));
        }
        if (normalizedCategory) {
          formData.set('category', normalizedCategory);
        }
        if (editImageFile) {
          formData.set('file', editImageFile);
        }

        const response = await updateProductAction(editingProduct.id, formData);

        if (!response.success || !response.data) {
          if (isDuplicateMessage(response.message)) {
            const existingProduct = products.find(
              (product) =>
                product.id !== editingProduct.id &&
                normalizeProductName(product.name) === normalizeProductName(trimmedName),
            );
            if (existingProduct) {
              highlightExistingProduct(existingProduct);
              return;
            }
          }

          setMessage(response.message || 'تعذر تعديل المنتج');
          return;
        }

        setProducts((prev) =>
          prev.map((product) => (product.id === editingProduct.id ? response.data! : product)),
        );
        refreshSearchResultsIfActive();
        setMessage('تم تعديل المنتج');
        handleCloseEdit();
      } catch (error) {
        if (isServerActionBodyLimitError(error)) {
          setMessage(`حجم الصورة كبير. الحد الأقصى ${MAX_PRODUCT_IMAGE_SIZE_MB} ميجابايت.`);
          return;
        }

        setMessage('تعذر تعديل المنتج');
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-10">
      <div className="sticky top-[57px] z-20 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:top-0">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">الإدارة السريعة للمنتجات</p>
            <p className="text-xs text-gray-500">القسم الحالي: {activeSectionLabel}</p>
          </div>
          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {products.length} منتج في متجرك
          </div>
        </div>

        <div
          role="tablist"
          aria-label="أقسام إدارة المنتجات"
          className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-1"
        >
          {sectionTabs.map((section) => {
            const isActive = activeSection === section.key;

            return (
              <button
                key={section.key}
                id={`section-tab-${section.key}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`section-panel-${section.key}`}
                onClick={() => handleSectionChange(section.key)}
                className={`rounded-lg px-2 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                <span className="block text-sm font-semibold">{section.label}</span>
                <span className="block text-[11px] text-gray-500">{section.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <p
          aria-live="polite"
          className={`rounded-xl border px-3 py-2 text-sm font-medium ${
            isDuplicateWarning
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-indigo-200 bg-indigo-50 text-indigo-700'
          }`}
        >
          {message}
        </p>
      )}

      <section
        id={`section-panel-${SECTION_QUICK_ADD}`}
        role="tabpanel"
        aria-labelledby={`section-tab-${SECTION_QUICK_ADD}`}
        className={activeSection === SECTION_QUICK_ADD ? 'block' : 'hidden'}
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">إضافة منتج سريع</h2>
              <p className="mt-1 text-sm text-gray-500">
                اكتب الاسم بسرعة، ويمكنك إضافة سعر اختياري الآن أو لاحقاً من تعديل المنتج.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSectionChange(SECTION_MY_PRODUCTS)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              عرض منتجاتك
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
            <input
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              placeholder="مثال: زيت عباد الشمس"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500"
            />
            <input
              value={manualPrice}
              onChange={(event) => setManualPrice(event.target.value)}
              placeholder="السعر (اختياري)"
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500"
            />

            <div className="space-y-2 rounded-xl border border-gray-200 p-3">
              <span className="block text-sm text-gray-700">تصنيف المنتج (اختياري)</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setManualCategoryMode(CATEGORY_MODE_SELECT)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    manualCategoryMode === CATEGORY_MODE_SELECT
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 text-gray-700'
                  }`}
                >
                  اختر من الموجود
                </button>
                <button
                  type="button"
                  onClick={() => setManualCategoryMode(CATEGORY_MODE_CUSTOM)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    manualCategoryMode === CATEGORY_MODE_CUSTOM
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 text-gray-700'
                  }`}
                >
                  اكتب تصنيف جديد
                </button>
              </div>

              {manualCategoryMode === CATEGORY_MODE_SELECT ? (
                <select
                  value={manualCategorySelect}
                  onChange={(event) => setManualCategorySelect(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">بدون تصنيف محدد</option>
                  {availableCatalogCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={manualCategoryCustom}
                  onChange={(event) => setManualCategoryCustom(event.target.value)}
                  placeholder="مثال: منظفات"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
            >
              حفظ
            </button>
          </form>
        </div>
      </section>

      <section
        id={`section-panel-${SECTION_CATALOG}`}
        role="tabpanel"
        aria-labelledby={`section-tab-${SECTION_CATALOG}`}
        className={activeSection === SECTION_CATALOG ? 'block' : 'hidden'}
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">اختار من منتجات جاهزة</h2>
          <p className="mt-1 text-sm text-gray-500">
            اضغط إضافة ويتم حفظ المنتج فوراً. متاح الآن {catalogItems.length} منتج من قاعدة البيانات.
          </p>

          <div className="mb-4 mt-3 flex gap-2 overflow-x-auto pb-2">
            {categoryTabs.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveCategory(category.key)}
                className={`h-14 shrink-0 rounded-2xl border px-3 py-1.5 ${
                  activeCategory === category.key
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.label}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">
                      🛒
                    </span>
                  )}
                  <span className="whitespace-nowrap text-sm font-medium">{category.label}</span>
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                    {category.count}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="lg:max-h-[58vh] lg:overflow-y-auto lg:pe-1">
            {filteredCatalogItems.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                لا توجد منتجات في الكتالوج حالياً. شغّل seeder لإضافة عناصر الكتالوج ثم حدّث الصفحة.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredCatalogItems.map((item) => {
                  const catalogItemImageUrl = resolveImageUrl(item.image_url);

                  return (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {catalogItemImageUrl && !failedImageIds[item.id] ? (
                            <Image
                              src={catalogItemImageUrl}
                              alt={item.name}
                              width={56}
                              height={56}
                              unoptimized
                              onError={() =>
                                setFailedImageIds((prev) => ({
                                  ...prev,
                                  [item.id]: true,
                                }))
                              }
                              className="h-14 w-14 rounded-lg border border-gray-200 bg-gray-50 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-1 text-center text-[10px] leading-4 text-gray-500">
                              لا توجد صورة
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddFromCatalog(item)}
                          disabled={Boolean(pendingCatalogIds[item.id])}
                          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {pendingCatalogIds[item.id] ? '...جاري' : 'إضافة'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        id={`section-panel-${SECTION_MY_PRODUCTS}`}
        role="tabpanel"
        aria-labelledby={`section-tab-${SECTION_MY_PRODUCTS}`}
        className={activeSection === SECTION_MY_PRODUCTS ? 'block' : 'hidden'}
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">منتجاتك</h2>
          <p className="mt-1 text-sm text-gray-500">{displayedProductsCountLabel}</p>

          <div className="mt-3">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ابحث بالاسم"
              inputMode="search"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
            {needsMoreSearchChars && (
              <p className="mt-2 text-xs text-gray-500">اكتب حرفين أو أكثر لبدء البحث</p>
            )}
            {isSearching && <p className="mt-2 text-xs text-gray-500">جاري البحث...</p>}
            {!isSearching && searchError && <p className="mt-2 text-xs text-red-600">{searchError}</p>}
          </div>

          <div className="lg:max-h-[58vh] lg:overflow-y-auto lg:pe-1">
            {displayedProducts.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                {isSearchActive ? 'لا توجد نتائج مطابقة.' : 'لا توجد منتجات حتى الآن.'}
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {displayedProducts.map((product) => {
                  const isConfirmingRemoval = confirmRemoveProductId === product.id;
                  const isRemoving = removingProductId === product.id;
                  const isHighlighted = highlightedProductId === product.id;

                  return (
                    <li
                      key={product.id}
                      ref={(node) => {
                        productRowRefs.current[product.id] = node;
                      }}
                      tabIndex={-1}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                        isHighlighted
                          ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {resolveImageUrl(product.image_url) && !failedProductImageIds[product.id] ? (
                          <Image
                            src={resolveImageUrl(product.image_url)!}
                            alt={product.name}
                            width={40}
                            height={40}
                            unoptimized
                            onError={() =>
                              setFailedProductImageIds((prev) => ({
                                ...prev,
                                [product.id]: true,
                              }))
                            }
                            className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-500">
                            صورة
                          </div>
                        )}

                        <div>
                          <span className="block text-sm font-medium text-gray-900">{product.name}</span>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              {product.source === 'catalog' ? 'كتالوج' : 'يدوي'}
                            </span>
                            <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                              {resolveProductPriceText(product.current_price) || 'السعر غير محدد'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isConfirmingRemoval ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(product)}
                              disabled={isRemoving}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              {isRemoving ? '...جاري الحذف' : 'تأكيد الحذف'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveProductId(null)}
                              disabled={isRemoving}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                              إلغاء
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(product)}
                              disabled={isRemoving}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRequestRemove(product.id)}
                              disabled={Boolean(removingProductId)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              حذف
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">تعديل المنتج</h3>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">اسم المنتج</span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">صورة المنتج</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  onChange={handleEditImageChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">السعر (اختياري)</span>
                <input
                  value={editPrice}
                  onChange={(event) => setEditPrice(event.target.value)}
                  inputMode="decimal"
                  placeholder="مثال: 45.50"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>

              <div className="space-y-2 rounded-xl border border-gray-200 p-3">
                <span className="block text-sm text-gray-700">تصنيف المنتج (اختياري)</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCategoryMode(CATEGORY_MODE_SELECT)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      editCategoryMode === CATEGORY_MODE_SELECT
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 text-gray-700'
                    }`}
                  >
                    اختر من الموجود
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCategoryMode(CATEGORY_MODE_CUSTOM)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      editCategoryMode === CATEGORY_MODE_CUSTOM
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 text-gray-700'
                    }`}
                  >
                    اكتب تصنيف جديد
                  </button>
                </div>

                {editCategoryMode === CATEGORY_MODE_SELECT ? (
                  <select
                    value={editCategorySelect}
                    onChange={(event) => setEditCategorySelect(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">بدون تصنيف محدد</option>
                    {availableCatalogCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={editCategoryCustom}
                    onChange={(event) => setEditCategoryCustom(event.target.value)}
                    placeholder="مثال: منظفات"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 p-3">
                <p className="mb-2 text-xs text-gray-500">معاينة الصورة</p>
                {editImagePreview || resolveImageUrl(editingProduct.image_url) ? (
                  <Image
                    src={editImagePreview || resolveImageUrl(editingProduct.image_url)!}
                    alt={editingProduct.name}
                    width={96}
                    height={96}
                    unoptimized
                    className="h-24 w-24 rounded-lg border border-gray-200 bg-gray-50 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500">
                    لا توجد صورة
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isEditPending}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isEditPending ? '...جاري الحفظ' : 'حفظ التعديل'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
