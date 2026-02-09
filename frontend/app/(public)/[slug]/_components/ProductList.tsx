"use client";

import { Product } from "@/types/models/product";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";

type ProductListProps = {
	products: Product[];
	quantities: Record<number, number>;
	onUpdateCart: (productId: number, qty: number) => void;
	loadMoreTriggerIndex?: number;
	setLoadMoreTarget?: (node: HTMLDivElement | null) => void;
};

export default function ProductList({
	products,
	quantities,
	onUpdateCart,
	loadMoreTriggerIndex,
	setLoadMoreTarget,
}: ProductListProps) {
	const handleUpdate = (productId: number, delta: number) => {
		const current = quantities[productId] || 0;
		const next = Math.max(0, current + delta);

		onUpdateCart(productId, next);
	};

	return (
		<div className="space-y-4">
			{products.map((product, index) => {
				const qty = quantities[product.id] || 0;
				const shouldAttachLoadMoreRef =
					typeof loadMoreTriggerIndex === "number" &&
					loadMoreTriggerIndex >= 0 &&
					index === loadMoreTriggerIndex;

				return (
					<div
						key={product.id}
						ref={shouldAttachLoadMoreRef ? setLoadMoreTarget : undefined}
						className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
					>
						<div className="flex items-center gap-3">
							<div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-100">
								{product.image_url ? (
									<Image
										src={getImageUrl(product.image_url)}
										alt={product.name}
										className="h-full w-full object-cover"
										width={56}
										height={56}
										loading="lazy"
										unoptimized
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-base">
										🛒
									</div>
								)}
							</div>

							<div className="flex-1">
								<h3 className="text-base font-semibold text-gray-900">
									{product.name}
								</h3>
								<p className="text-xs text-gray-500">
									السعر يتم تأكيده بعد الطلب
								</p>
							</div>

							<div className="flex items-center gap-2">
								{qty > 0 && (
									<>
										<button
											type="button"
											onClick={() => handleUpdate(product.id, -1)}
											className="h-9 w-9 rounded-full border border-gray-300 text-lg text-gray-700"
										>
											-
										</button>
										<span className="min-w-5 text-center text-sm font-bold text-gray-900">
											{qty}
										</span>
									</>
								)}
								<button
									type="button"
									onClick={() => handleUpdate(product.id, 1)}
									className="h-9 w-9 rounded-full bg-indigo-600 text-lg text-white"
								>
									+
								</button>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
