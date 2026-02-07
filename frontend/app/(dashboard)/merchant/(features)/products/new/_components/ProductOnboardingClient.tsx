'use client';

import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import {
  addProductFromCatalogAction,
  createProductAction,
  updateProductAction,
} from '@/actions/product-actions';
import { CatalogItem, Product } from '@/types/models/product';

const ALL_CATALOG_ITEMS = '__all__';

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

type ProductOnboardingClientProps = {
  initialProducts: Product[];
  catalogItems: CatalogItem[];
};

export default function ProductOnboardingClient({
  initialProducts,
  catalogItems,
}: ProductOnboardingClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [manualName, setManualName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(ALL_CATALOG_ITEMS);
  const [pendingCatalogIds, setPendingCatalogIds] = useState<Record<number, boolean>>({});
  const [failedImageIds, setFailedImageIds] = useState<Record<number, boolean>>({});
  const [failedProductImageIds, setFailedProductImageIds] = useState<Record<number, boolean>>(
    {},
  );
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();

  const catalogCategories = useMemo(
    () =>
      Array.from(new Set(catalogItems.map((item) => item.category))).sort((a, b) =>
        a.localeCompare(b, 'ar'),
      ),
    [catalogItems],
  );

  const filteredCatalogItems = useMemo(() => {
    if (activeCategory === ALL_CATALOG_ITEMS) {
      return catalogItems;
    }

    return catalogItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, catalogItems]);

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = manualName.trim();
    if (!trimmedName) {
      setMessage('اكتب اسم المنتج أولاً');
      return;
    }

    startTransition(async () => {
      const response = await createProductAction(trimmedName);

      if (!response.success || !response.data) {
        setMessage(response.message || 'تعذر إضافة المنتج');
        return;
      }

      setProducts((prev) => [response.data, ...prev]);
      setManualName('');
      setMessage('تم حفظ المنتج');
    });
  };

  const handleAddFromCatalog = (catalogItemId: number) => {
    setPendingCatalogIds((prev) => ({
      ...prev,
      [catalogItemId]: true,
    }));

    startTransition(async () => {
      const response = await addProductFromCatalogAction(catalogItemId);

      setPendingCatalogIds((prev) => ({
        ...prev,
        [catalogItemId]: false,
      }));

      if (!response.success || !response.data) {
        setMessage(response.message || 'تعذر إضافة المنتج من الكتالوج');
        return;
      }

      setProducts((prev) => [response.data, ...prev]);
      setMessage('تمت الإضافة');
    });
  };

  const handleStartEdit = (product: Product) => {
    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }

    setEditingProduct(product);
    setEditName(product.name);
    setEditImageFile(null);
    setEditImagePreview(null);
    setMessage(null);
  };

  const handleCloseEdit = () => {
    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }

    setEditingProduct(null);
    setEditName('');
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleEditImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (editImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
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

    startEditTransition(async () => {
      const formData = new FormData();
      formData.set('name', trimmedName);
      if (editImageFile) {
        formData.set('file', editImageFile);
      }

      const response = await updateProductAction(editingProduct.id, formData);

      if (!response.success || !response.data) {
        setMessage(response.message || 'تعذر تعديل المنتج');
        return;
      }

      setProducts((prev) =>
        prev.map((product) => (product.id === editingProduct.id ? response.data! : product)),
      );
      setMessage('تم تعديل المنتج');
      handleCloseEdit();
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">إضافة منتج سريع</h2>
        <p className="mt-1 text-sm text-gray-500">الاسم فقط كفاية للبداية. السعر يتم داخل الطلب لاحقاً.</p>

        <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
          <input
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
            placeholder="مثال: زيت عباد الشمس"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
          >
            حفظ
          </button>
        </form>

        {message && <p className="mt-3 text-sm font-medium text-indigo-700">{message}</p>}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">اختار من منتجات جاهزة</h2>
        <p className="mt-1 text-sm text-gray-500">
          اضغط إضافة ويتم حفظ المنتج فوراً. متاح الآن {catalogItems.length} منتج من قاعدة البيانات.
        </p>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory(ALL_CATALOG_ITEMS)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              activeCategory === ALL_CATALOG_ITEMS
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-700'
            }`}
          >
            الكل
          </button>
          {catalogCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                activeCategory === category
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredCatalogItems.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            لا توجد منتجات في الكتالوج حالياً. شغّل seeder لإضافة عناصر الكتالوج ثم حدّث الصفحة.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredCatalogItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.image_url?.trim() && !failedImageIds[item.id] ? (
                      <Image
                        src={item.image_url}
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
                    onClick={() => handleAddFromCatalog(item.id)}
                    disabled={pendingCatalogIds[item.id] || isPending}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pendingCatalogIds[item.id] ? '...جاري' : 'إضافة'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">منتجاتك</h2>
        <p className="mt-1 text-sm text-gray-500">{products.length} منتج</p>

        <ul className="mt-4 space-y-2">
          {products.slice(0, 20).map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2"
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
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {product.source === 'catalog' ? 'كتالوج' : 'يدوي'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartEdit(product)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                تعديل
              </button>
            </li>
          ))}
        </ul>
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
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditImageChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

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
