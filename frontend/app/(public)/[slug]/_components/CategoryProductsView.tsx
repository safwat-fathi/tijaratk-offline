import SafeImage from "@/components/ui/SafeImage";
import { getImageUrl } from "@/lib/utils/image";
import { formatArabicInteger } from "@/lib/utils/number";
import type { Product } from "@/types/models/product";
import ProductList, {
	type AvailabilityRequestOutcome,
	type ProductCartSelection,
} from "./ProductList";
import type { CategoryTab, PaginationState } from "../_utils/order-form";

type CategoryProductsViewProps = {
	categoryTabs: CategoryTab[];
	activeCategory: string;
	activeProducts: Product[];
	activePagination: PaginationState;
	hasMoreInActiveCategory: boolean;
	activeLoadMoreIndex: number;
	cartSelections: Record<number, ProductCartSelection>;
	onBack: () => void;
	onCategoryChange: (categoryKey: string) => void;
	setCategoryPillRef: (
		categoryKey: string,
		node: HTMLButtonElement | null,
	) => void;
	onUpdateSelection: (product: Product, selection: ProductCartSelection | null) => void;
	onProductAdded: () => void;
	onRequestAvailability: (product: Product) => Promise<AvailabilityRequestOutcome>;
	setLoadMoreTarget: (node: HTMLDivElement | null) => void;
};

export default function CategoryProductsView({
	categoryTabs,
	activeCategory,
	activeProducts,
	activePagination,
	hasMoreInActiveCategory,
	activeLoadMoreIndex,
	cartSelections,
	onBack,
	onCategoryChange,
	setCategoryPillRef,
	onUpdateSelection,
	onProductAdded,
	onRequestAvailability,
	setLoadMoreTarget,
}: CategoryProductsViewProps) {
	const activeLabel =
		categoryTabs.find(item => item.key === activeCategory)?.label || "المنتجات";
	const hasProducts = activeProducts.length > 0;
	const isInitialCategoryLoading = activePagination.isLoading && !hasProducts;
	const shouldShowEmptyState =
		!activePagination.isLoading && !activePagination.error && !hasProducts;

	return (
		<div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<button
					type="button"
					onClick={onBack}
					className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
				>
					رجوع
				</button>
				<p className="text-sm font-semibold text-gray-900">{activeLabel}</p>
				<div className="w-16"></div>
			</div>

			<div className="mb-4 flex gap-2 overflow-x-auto pb-2">
				{categoryTabs.map(category => (
					<button
						key={category.key}
						ref={node => setCategoryPillRef(category.key, node)}
						type="button"
						onClick={() => onCategoryChange(category.key)}
						className={`h-14 shrink-0 rounded-2xl border px-3 py-1.5 ${
							activeCategory === category.key
								? "border-indigo-600 bg-indigo-50 text-indigo-700"
								: "border-gray-300 bg-white text-gray-700"
						}`}
					>
						<span className="flex items-center gap-2">
							<SafeImage
								src={category.image_url ? getImageUrl(category.image_url) : null}
								alt={category.label}
								width={40}
								height={40}
								unoptimized
								imageClassName="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
								fallback={
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">
										🛒
									</span>
								}
							/>
							<span className="whitespace-nowrap text-sm font-medium">
								{category.label}
							</span>
							<span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
								{formatArabicInteger(category.count) || category.count}
							</span>
						</span>
					</button>
				))}
			</div>

			{hasProducts && (
				<ProductList
					products={activeProducts}
					selections={cartSelections}
					onUpdateSelection={onUpdateSelection}
					onAdded={onProductAdded}
					onRequestAvailability={onRequestAvailability}
					loadMoreTriggerIndex={
						hasMoreInActiveCategory ? activeLoadMoreIndex : undefined
					}
					setLoadMoreTarget={setLoadMoreTarget}
				/>
			)}

			{isInitialCategoryLoading && (
				<div className="flex justify-center py-6">
					<svg
						className="h-6 w-6 animate-spin text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						></path>
					</svg>
				</div>
			)}

			{shouldShowEmptyState && (
				<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
					لا توجد منتجات في هذا القسم حالياً.
				</div>
			)}

			{activePagination.error && (
				<div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
					{activePagination.error}
				</div>
			)}

			{activePagination.isLoading && hasProducts && (
				<div className="mt-4 flex justify-center">
					<svg
						className="h-6 w-6 animate-spin text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						></path>
					</svg>
				</div>
			)}
		</div>
	);
}
