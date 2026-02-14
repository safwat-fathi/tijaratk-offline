import Image from 'next/image';
import type { ChangeEvent, FormEvent } from 'react';
import type { Product, ProductOrderMode } from '@/types/models/product';
import type { CategoryMode } from '../_utils/product-onboarding.types';
import { resolveImageUrl } from '../_utils/product-onboarding.logic';
import CategoryFields from './CategoryFields';
import OrderModeFields from './OrderModeFields';

type EditProductModalProps = {
  editingProduct: Product | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isEditPending: boolean;
  editName: string;
  onEditNameChange: (value: string) => void;
  editPrice: string;
  onEditPriceChange: (value: string) => void;
  editIsAvailable: boolean;
  onEditIsAvailableChange: (value: boolean) => void;
  editOrderMode: ProductOrderMode;
  onEditOrderModeChange: (mode: ProductOrderMode) => void;
  editUnitLabel: string;
  onEditUnitLabelChange: (value: string) => void;
  editSecondaryUnitLabel: string;
  onEditSecondaryUnitLabelChange: (value: string) => void;
  editSecondaryUnitMultiplier: string;
  onEditSecondaryUnitMultiplierChange: (value: string) => void;
  editWeightPresets: string;
  onEditWeightPresetsChange: (value: string) => void;
  editPricePresets: string;
  onEditPricePresetsChange: (value: string) => void;
  editCategoryMode: CategoryMode;
  onEditCategoryModeChange: (mode: CategoryMode) => void;
  editCategorySelect: string;
  onEditCategorySelectChange: (value: string) => void;
  editCategoryCustom: string;
  onEditCategoryCustomChange: (value: string) => void;
  availableProductCategories: string[];
  editImagePreview: string | null;
  onEditImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function EditProductModal({
  editingProduct,
  onClose,
  onSubmit,
  isEditPending,
  editName,
  onEditNameChange,
  editPrice,
  onEditPriceChange,
  editIsAvailable,
  onEditIsAvailableChange,
  editOrderMode,
  onEditOrderModeChange,
  editUnitLabel,
  onEditUnitLabelChange,
  editSecondaryUnitLabel,
  onEditSecondaryUnitLabelChange,
  editSecondaryUnitMultiplier,
  onEditSecondaryUnitMultiplierChange,
  editWeightPresets,
  onEditWeightPresetsChange,
  editPricePresets,
  onEditPricePresetsChange,
  editCategoryMode,
  onEditCategoryModeChange,
  editCategorySelect,
  onEditCategorySelectChange,
  editCategoryCustom,
  onEditCategoryCustomChange,
  availableProductCategories,
  editImagePreview,
  onEditImageChange,
}: EditProductModalProps) {
  if (!editingProduct) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">تعديل المنتج</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            إغلاق
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">اسم المنتج</span>
            <input
              value={editName}
              onChange={(event) => onEditNameChange(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">صورة المنتج</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              onChange={onEditImageChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">السعر (اختياري)</span>
            <input
              value={editPrice}
              onChange={(event) => onEditPriceChange(event.target.value)}
              inputMode="decimal"
              placeholder="مثال: 45.50"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
            <div>
              <span className="block text-sm font-semibold text-gray-800">متاح للبيع</span>
              <span className="block text-xs text-gray-500">
                المنتج غير المتاح سيبقى ظاهرًا لك للإدارة.
              </span>
            </div>
            <input
              type="checkbox"
              checked={editIsAvailable}
              onChange={(event) => onEditIsAvailableChange(event.target.checked)}
              className="h-5 w-5 accent-indigo-600"
            />
          </label>

          <OrderModeFields
            orderMode={editOrderMode}
            onOrderModeChange={onEditOrderModeChange}
            unitLabel={editUnitLabel}
            onUnitLabelChange={onEditUnitLabelChange}
            secondaryUnitLabel={editSecondaryUnitLabel}
            onSecondaryUnitLabelChange={onEditSecondaryUnitLabelChange}
            secondaryUnitMultiplier={editSecondaryUnitMultiplier}
            onSecondaryUnitMultiplierChange={onEditSecondaryUnitMultiplierChange}
            weightPresets={editWeightPresets}
            onWeightPresetsChange={onEditWeightPresetsChange}
            pricePresets={editPricePresets}
            onPricePresetsChange={onEditPricePresetsChange}
          />

          <CategoryFields
            categoryMode={editCategoryMode}
            onCategoryModeChange={onEditCategoryModeChange}
            categorySelect={editCategorySelect}
            onCategorySelectChange={onEditCategorySelectChange}
            categoryCustom={editCategoryCustom}
            onCategoryCustomChange={onEditCategoryCustomChange}
            availableCategories={availableProductCategories}
          />

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
  );
}
