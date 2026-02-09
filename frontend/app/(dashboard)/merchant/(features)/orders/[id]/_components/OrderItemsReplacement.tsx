'use client';

import Image from 'next/image';
import { useDebounce } from 'use-debounce';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { replaceOrderItemAction } from '@/actions/order-actions';
import { createProductAction } from '@/actions/product-actions';
import { productsService } from '@/services/api/products.service';
import { getImageUrl } from '@/lib/utils/image';
import { OrderItem } from '@/types/models/order';
import { Product } from '@/types/models/product';

const MIN_SEARCH_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULTS_LIMIT = 20;

type OrderItemsReplacementProps = {
  orderId: number;
  initialItems: OrderItem[];
  products: Product[];
};

const ProductThumbnail = ({
  imageUrl,
  name,
  size = 36,
}: {
  imageUrl?: string | null;
  name: string;
  size?: number;
}) => {
  if (imageUrl?.trim()) {
    return (
      <Image
        src={getImageUrl(imageUrl)}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className="rounded-lg border border-gray-200 bg-gray-50 object-cover"
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-500"
      style={{ width: size, height: size }}
    >
      🛒
    </div>
  );
};

export default function OrderItemsReplacement({
  orderId,
  initialItems,
  products,
}: OrderItemsReplacementProps) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>(products);
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [debouncedSearch] = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setAvailableProducts(products);
  }, [products]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeItemId) || null,
    [activeItemId, items],
  );

  const normalizedSearch = debouncedSearch.trim();
  const isTextSearchActive = normalizedSearch.length >= MIN_SEARCH_CHARS;

  useEffect(() => {
    if (!activeItemId) {
      return;
    }

    if (!isTextSearchActive) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);
    setSearchError(null);

    void (async () => {
      const response = await productsService.searchProducts({
        search: normalizedSearch,
        page: 1,
        limit: SEARCH_RESULTS_LIMIT,
      });

      if (isCancelled) {
        return;
      }

      if (!response.success || !response.data) {
        setSearchResults([]);
        setSearchError('تعذر تحميل نتائج البحث');
        setIsSearching(false);
        return;
      }

      setSearchResults(response.data.data);
      setIsSearching(false);
    })();

    return () => {
      isCancelled = true;
    };
  }, [activeItemId, isTextSearchActive, normalizedSearch]);

  const replacementOptions = isTextSearchActive
    ? searchResults
    : availableProducts;

  const closeSheet = () => {
    setActiveItemId(null);
    setNewProductName('');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
  };

  const applyReplacement = (itemId: number, product: Product | null) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          replaced_by_product_id: product?.id || null,
          replaced_by_product: product
            ? {
                id: product.id,
                name: product.name,
                image_url: product.image_url || null,
              }
            : null,
        };
      }),
    );
  };

  const handleSelectReplacement = (itemId: number, product: Product) => {
    startTransition(async () => {
      const response = await replaceOrderItemAction(orderId, itemId, product.id);

      if (!response.success) {
        setFeedback('تعذر تحديث البديل');
        return;
      }

      applyReplacement(itemId, product);
      setFeedback(`تم الاستبدال بـ ${product.name}`);
      closeSheet();
    });
  };

  const handleClearReplacement = (itemId: number) => {
    startTransition(async () => {
      const response = await replaceOrderItemAction(orderId, itemId, null);

      if (!response.success) {
        setFeedback('تعذر إزالة البديل');
        return;
      }

      applyReplacement(itemId, null);
      setFeedback('تمت إزالة البديل');
      closeSheet();
    });
  };

  const handleCreateAndSelect = () => {
    if (!activeItem) {
      return;
    }

    const trimmedName = newProductName.trim();
    if (!trimmedName) {
      setFeedback('اكتب اسم المنتج أولاً');
      return;
    }

    startTransition(async () => {
      const createResponse = await createProductAction(trimmedName);

      if (!createResponse.success || !createResponse.data) {
        setFeedback(createResponse.message || 'تعذر إضافة المنتج');
        return;
      }

      const product = createResponse.data as Product;
      setAvailableProducts((prev) => [product, ...prev]);
      const replaceResponse = await replaceOrderItemAction(
        orderId,
        activeItem.id,
        product.id,
      );

      if (!replaceResponse.success) {
        setFeedback('تم إنشاء المنتج لكن تعذر ربطه كبديل');
        return;
      }

      applyReplacement(activeItem.id, product);
      setFeedback(`تمت الإضافة والاستبدال بـ ${product.name}`);
      closeSheet();
    });
  };

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
        العناصر
      </h2>

      {feedback && <p className="mb-3 text-sm font-medium text-indigo-700">{feedback}</p>}

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => {
            const replacementProduct = item.replaced_by_product;
            const replacementName = replacementProduct?.name;

            return (
              <div key={item.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name_snapshot}</p>
                    <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveItemId(item.id)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
                  >
                    {replacementName ? 'تغيير البديل' : 'استبدال المنتج'}
                  </button>
                </div>

                {replacementName && (
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-green-700">
                    <ProductThumbnail
                      imageUrl={replacementProduct?.image_url}
                      name={replacementName}
                      size={28}
                    />
                    <p>تم الاستبدال بـ: {replacementName}</p>
                  </div>
                )}

                {item.notes && (
                  <p className="mt-2 text-xs text-amber-700">ملاحظة: {item.notes}</p>
                )}
              </div>
            );
          })
        ) : (
          <p className="italic text-gray-400">لا توجد عناصر</p>
        )}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 h-full w-full"
            onClick={closeSheet}
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />
            <h3 className="text-lg font-bold text-gray-900">اختر المنتج البديل</h3>
            <p className="text-sm text-gray-500">{activeItem.name_snapshot}</p>

            <div className="mt-3 rounded-xl border border-gray-200 p-3">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ابحث بالاسم"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                اكتب {MIN_SEARCH_CHARS} حرف على الأقل للبحث
              </p>
            </div>

            <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
              {isSearching && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  جاري البحث...
                </p>
              )}

              {!isSearching && searchError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {searchError}
                </p>
              )}

              {!isSearching && !searchError && replacementOptions.length === 0 && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  لا توجد نتائج مطابقة
                </p>
              )}

              {!isSearching &&
                !searchError &&
                replacementOptions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectReplacement(activeItem.id, product)}
                    disabled={isPending}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-3 text-start"
                  >
                    <span className="flex items-center gap-3">
                      <ProductThumbnail
                        imageUrl={product.image_url}
                        name={product.name}
                      />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </span>
                    <span className="text-xs text-gray-500">اختيار</span>
                  </button>
                ))}
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 p-3">
              <p className="text-sm font-semibold text-gray-800">+ إضافة منتج جديد</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={newProductName}
                  onChange={(event) => setNewProductName(event.target.value)}
                  placeholder="اسم المنتج البديل"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCreateAndSelect}
                  disabled={isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  حفظ
                </button>
              </div>
            </div>

            {activeItem.replaced_by_product_id && (
              <button
                type="button"
                onClick={() => handleClearReplacement(activeItem.id)}
                disabled={isPending}
                className="mt-3 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
              >
                إلغاء الاستبدال
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
