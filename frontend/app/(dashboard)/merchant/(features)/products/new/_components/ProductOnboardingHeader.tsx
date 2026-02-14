type ProductOnboardingHeaderProps = {
  activeSectionLabel: string;
  productsCount: number;
};

export default function ProductOnboardingHeader({
  activeSectionLabel,
  productsCount,
}: ProductOnboardingHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">الإدارة السريعة للمنتجات</p>
        <p className="text-xs text-gray-500">القسم الحالي: {activeSectionLabel}</p>
      </div>
      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        {productsCount} منتج في متجرك
      </div>
    </div>
  );
}
