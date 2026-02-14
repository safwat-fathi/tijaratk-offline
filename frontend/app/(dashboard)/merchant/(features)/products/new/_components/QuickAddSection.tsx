import type { FormEvent } from 'react';
import type { ProductOrderMode } from '@/types/models/product';
import type { CategoryMode } from '../_utils/product-onboarding.types';
import { SECTION_QUICK_ADD } from '../_utils/product-onboarding.constants';
import CategoryFields from './CategoryFields';
import OrderModeFields from './OrderModeFields';

type QuickAddSectionProps = {
  active: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onShowMyProducts: () => void;
  isPending: boolean;
  manualName: string;
  onManualNameChange: (value: string) => void;
  manualPrice: string;
  onManualPriceChange: (value: string) => void;
  manualOrderMode: ProductOrderMode;
  onManualOrderModeChange: (mode: ProductOrderMode) => void;
  manualUnitLabel: string;
  onManualUnitLabelChange: (value: string) => void;
  manualSecondaryUnitLabel: string;
  onManualSecondaryUnitLabelChange: (value: string) => void;
  manualSecondaryUnitMultiplier: string;
  onManualSecondaryUnitMultiplierChange: (value: string) => void;
  manualWeightPresets: string;
  onManualWeightPresetsChange: (value: string) => void;
  manualPricePresets: string;
  onManualPricePresetsChange: (value: string) => void;
  manualCategoryMode: CategoryMode;
  onManualCategoryModeChange: (mode: CategoryMode) => void;
  manualCategorySelect: string;
  onManualCategorySelectChange: (value: string) => void;
  manualCategoryCustom: string;
  onManualCategoryCustomChange: (value: string) => void;
  availableCatalogCategories: string[];
};

export default function QuickAddSection({
  active,
  onSubmit,
  onShowMyProducts,
  isPending,
  manualName,
  onManualNameChange,
  manualPrice,
  onManualPriceChange,
  manualOrderMode,
  onManualOrderModeChange,
  manualUnitLabel,
  onManualUnitLabelChange,
  manualSecondaryUnitLabel,
  onManualSecondaryUnitLabelChange,
  manualSecondaryUnitMultiplier,
  onManualSecondaryUnitMultiplierChange,
  manualWeightPresets,
  onManualWeightPresetsChange,
  manualPricePresets,
  onManualPricePresetsChange,
  manualCategoryMode,
  onManualCategoryModeChange,
  manualCategorySelect,
  onManualCategorySelectChange,
  manualCategoryCustom,
  onManualCategoryCustomChange,
  availableCatalogCategories,
}: QuickAddSectionProps) {
  return (
    <section
      id={`section-panel-${SECTION_QUICK_ADD}`}
      role="tabpanel"
      aria-labelledby={`section-tab-${SECTION_QUICK_ADD}`}
      className={active ? 'block' : 'hidden'}
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
            onClick={onShowMyProducts}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            عرض منتجاتك
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            value={manualName}
            onChange={(event) => onManualNameChange(event.target.value)}
            placeholder="مثال: زيت عباد الشمس"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500"
          />
          <input
            value={manualPrice}
            onChange={(event) => onManualPriceChange(event.target.value)}
            placeholder="السعر (اختياري)"
            inputMode="decimal"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500"
          />

          <OrderModeFields
            orderMode={manualOrderMode}
            onOrderModeChange={onManualOrderModeChange}
            unitLabel={manualUnitLabel}
            onUnitLabelChange={onManualUnitLabelChange}
            secondaryUnitLabel={manualSecondaryUnitLabel}
            onSecondaryUnitLabelChange={onManualSecondaryUnitLabelChange}
            secondaryUnitMultiplier={manualSecondaryUnitMultiplier}
            onSecondaryUnitMultiplierChange={onManualSecondaryUnitMultiplierChange}
            weightPresets={manualWeightPresets}
            onWeightPresetsChange={onManualWeightPresetsChange}
            pricePresets={manualPricePresets}
            onPricePresetsChange={onManualPricePresetsChange}
          />

          <CategoryFields
            categoryMode={manualCategoryMode}
            onCategoryModeChange={onManualCategoryModeChange}
            categorySelect={manualCategorySelect}
            onCategorySelectChange={onManualCategorySelectChange}
            categoryCustom={manualCategoryCustom}
            onCategoryCustomChange={onManualCategoryCustomChange}
            availableCategories={availableCatalogCategories}
          />

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
  );
}
