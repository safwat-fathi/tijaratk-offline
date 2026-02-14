import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import type { CategoryTab } from "../_utils/order-form.logic";

type CategoryEntryGridProps = {
	categoryCards: CategoryTab[];
	onSelectCategory: (categoryKey: string) => void;
	onShowAll: () => void;
};

export default function CategoryEntryGrid({
	categoryCards,
	onSelectCategory,
	onShowAll,
}: CategoryEntryGridProps) {
	return (
		<div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
			<h2 className="text-lg font-bold text-gray-900">اختار القسم</h2>
			<p className="mt-1 text-sm text-gray-500">
				اختيار القسم أسرع من تصفح قائمة طويلة.
			</p>
			<div className="mt-4 grid grid-cols-2 gap-3">
				{categoryCards.length > 0 ? (
					categoryCards.map(category => (
						<button
							key={category.key}
							type="button"
							onClick={() => onSelectCategory(category.key)}
							className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 px-2 py-3 text-center shadow-sm active:scale-[0.97]"
						>
							{category.image_url ? (
								<Image
									src={getImageUrl(category.image_url)}
									alt={category.label}
									width={54}
									height={54}
									className="h-14 w-14 rounded-xl object-cover ring-1 ring-gray-200"
									unoptimized
								/>
							) : (
								<span className="text-2xl">🛒</span>
							)}
							<span className="mt-2 text-sm font-semibold text-gray-800">
								{category.label}
							</span>
						</button>
					))
				) : (
					<div className="col-span-2 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
						لا توجد أقسام حالياً.
					</div>
				)}
			</div>
			<button
				type="button"
				onClick={onShowAll}
				className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
			>
				عرض كل المنتجات
			</button>
		</div>
	);
}
