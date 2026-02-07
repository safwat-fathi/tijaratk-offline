'use client';

import { replaceOrderItemAction } from '@/actions/order-actions';
import { createProductAction } from '@/actions/product-actions';
import { OrderItem } from '@/types/models/order';
import { Product } from '@/types/models/product';
import { useEffect, useMemo, useState, useTransition } from 'react';

type OrderItemsReplacementProps = {
  orderId: number;
  initialItems: OrderItem[];
  products: Product[];
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      setActiveItemId(null);
      setNewProductName('');
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
      setActiveItemId(null);
      setNewProductName('');
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
      setActiveItemId(null);
      setNewProductName('');
    });
  };

  return (
    <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
        العناصر
      </h2>

      {feedback && <p className="mb-3 text-sm font-medium text-indigo-700">{feedback}</p>}

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => {
            const replacementName = item.replaced_by_product?.name;

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
                  <p className="mt-2 text-sm font-medium text-green-700">
                    تم الاستبدال بـ: {replacementName}
                  </p>
                )}

                {item.notes && (
                  <p className="mt-2 text-xs text-amber-700">ملاحظة: {item.notes}</p>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 italic">لا توجد عناصر</p>
        )}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 h-full w-full"
            onClick={() => {
              setActiveItemId(null);
              setNewProductName('');
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />
            <h3 className="text-lg font-bold text-gray-900">اختر المنتج البديل</h3>
            <p className="text-sm text-gray-500">{activeItem.name_snapshot}</p>

            <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
              {availableProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectReplacement(activeItem.id, product)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-3 text-start"
                >
                  <span className="font-medium text-gray-900">{product.name}</span>
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
