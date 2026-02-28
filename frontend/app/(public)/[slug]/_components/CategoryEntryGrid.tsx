import { useCallback, useEffect, useRef } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { getImageUrl } from "@/lib/utils/image";
import type { CategoryTab } from "../_utils/order-form";

type CategoryEntryGridProps = {
	categoryCards: CategoryTab[];
	onSelectCategory: (categoryKey: string) => void;
	onShowAll: () => void;
	onCategoryInView?: (categoryKey: string) => void;
};

export default function CategoryEntryGrid({
	categoryCards,
	onSelectCategory,
	onShowAll,
	onCategoryInView,
}: CategoryEntryGridProps) {
	const categoryButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
	const seenInViewRef = useRef<Set<string>>(new Set());
	const observerRef = useRef<IntersectionObserver | null>(null);

	const setCategoryButtonRef = useCallback(
		(categoryKey: string, node: HTMLButtonElement | null) => {
			const previousNode = categoryButtonRefs.current.get(categoryKey);
			if (previousNode && observerRef.current) {
				observerRef.current.unobserve(previousNode);
			}

			if (!node) {
				categoryButtonRefs.current.delete(categoryKey);
				return;
			}

			categoryButtonRefs.current.set(categoryKey, node);
			if (observerRef.current && !seenInViewRef.current.has(categoryKey)) {
				observerRef.current.observe(node);
			}
		},
		[],
	);

	useEffect(() => {
		if (!onCategoryInView) {
			observerRef.current?.disconnect();
			observerRef.current = null;
			return;
		}

		const observer = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					if (!entry.isIntersecting) {
						continue;
					}

					const categoryKey = entry.target.getAttribute("data-category-key");
					if (!categoryKey || seenInViewRef.current.has(categoryKey)) {
						continue;
					}

					seenInViewRef.current.add(categoryKey);
					onCategoryInView(categoryKey);
					observer.unobserve(entry.target);
				}
			},
			{
				root: null,
				threshold: 0.15,
				rootMargin: "200px 0px 200px 0px",
			},
		);

		observerRef.current = observer;
		for (const [categoryKey, node] of categoryButtonRefs.current.entries()) {
			if (node && !seenInViewRef.current.has(categoryKey)) {
				observer.observe(node);
			}
		}

		return () => {
			observer.disconnect();
			observerRef.current = null;
		};
	}, [categoryCards, onCategoryInView]);

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
							ref={node => setCategoryButtonRef(category.key, node)}
							data-category-key={category.key}
							type="button"
							onClick={() => onSelectCategory(category.key)}
							className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 px-2 py-3 text-center shadow-sm active:scale-[0.97]"
						>
							<SafeImage
								src={category.image_url ? getImageUrl(category.image_url) : null}
								alt={category.label}
								width={54}
								height={54}
								unoptimized
								imageClassName="h-14 w-14 rounded-xl object-cover ring-1 ring-gray-200"
								fallback={<span className="text-2xl">🛒</span>}
							/>
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
