"use client";

import { Product } from "@/types/models/product";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { formatCurrency } from "@/lib/utils/currency";
import { useMemo, useState } from "react";

type SelectionMode = "quantity" | "weight" | "price";

export type ProductCartSelection = {
	selection_mode: SelectionMode;
	selection_quantity?: number;
	selection_grams?: number;
	selection_amount_egp?: number;
	unit_option_id?: string;
};

export type AvailabilityRequestOutcome =
	| "created"
	| "already_requested_today"
	| "failed";

type ProductListProps = {
	products: Product[];
	selections: Record<number, ProductCartSelection>;
	onUpdateSelection: (product: Product, selection: ProductCartSelection | null) => void;
	onAdded?: () => void;
	onRequestAvailability?: (product: Product) => Promise<AvailabilityRequestOutcome>;
	loadMoreTriggerIndex?: number;
	setLoadMoreTarget?: (node: HTMLDivElement | null) => void;
};

type CustomSheetState =
	| {
			product: Product;
			mode: "weight" | "price";
	  }
	| null;

type AvailabilitySheetState =
	| {
			product: Product;
	  }
	| null;

const DEFAULT_WEIGHT_PRESETS = [250, 500, 1000];
const DEFAULT_PRICE_PRESETS = [100, 200, 300];

const parseProductPrice = (product: Product): number | null => {
	if (
		product.current_price === null ||
		product.current_price === undefined ||
		product.current_price === ""
	) {
		return null;
	}

	const parsedPrice = Number(product.current_price);
	if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
		return null;
	}

	return parsedPrice;
};

const resolveProductMode = (product: Product): SelectionMode => {
	if (product.order_mode === "weight" || product.order_mode === "price") {
		return product.order_mode;
	}

	return "quantity";
};

export default function ProductList({
	products,
	selections,
	onUpdateSelection,
	onAdded,
	onRequestAvailability,
	loadMoreTriggerIndex,
	setLoadMoreTarget,
}: ProductListProps) {
	const [preferredQuantityUnitByProduct, setPreferredQuantityUnitByProduct] =
		useState<Record<number, string>>({});
	const [customSheet, setCustomSheet] = useState<CustomSheetState>(null);
	const [customValue, setCustomValue] = useState("");
	const [availabilitySheet, setAvailabilitySheet] =
		useState<AvailabilitySheetState>(null);
	const [isAvailabilitySubmitting, setIsAvailabilitySubmitting] = useState(false);

	const selectedProduct = customSheet?.product ?? null;
	const selectedAvailabilityProduct = availabilitySheet?.product ?? null;

	const currentCustomPlaceholder = useMemo(() => {
		if (!customSheet) {
			return "";
		}

		return customSheet.mode === "weight" ? "مثال: 750" : "مثال: 150";
	}, [customSheet]);

	const closeCustomSheet = () => {
		setCustomSheet(null);
		setCustomValue("");
	};

	const closeAvailabilitySheet = (force = false) => {
		if (!force && isAvailabilitySubmitting) {
			return;
		}

		setAvailabilitySheet(null);
	};

	const resolveQuantityOptions = (product: Product) => {
		const options = product.order_config?.quantity?.unit_options;
		if (!Array.isArray(options) || options.length === 0) {
			return [];
		}

		return options.filter(
			option =>
				typeof option.id === "string" &&
				typeof option.label === "string" &&
				Number(option.multiplier) > 0,
		);
	};

	const resolveQuantityUnitLabel = (product: Product) =>
		product.order_config?.quantity?.unit_label || "قطعة";

	const handleQuantityDelta = (product: Product, delta: number) => {
		if (!product.is_available) {
			return;
		}

		const selection = selections[product.id];
		const currentQty =
			selection?.selection_mode === "quantity"
				? Number(selection.selection_quantity || 0)
				: 0;
		const nextQty = Math.max(0, currentQty + delta);
		const quantityOptions = resolveQuantityOptions(product);
		const preferredOptionId = preferredQuantityUnitByProduct[product.id];
		const unitOptionId =
			preferredOptionId ||
			(selection?.selection_mode === "quantity"
				? selection.unit_option_id
				: undefined) ||
			quantityOptions[0]?.id;

		if (nextQty === 0) {
			onUpdateSelection(product, null);
			return;
		}

		onUpdateSelection(product, {
			selection_mode: "quantity",
			selection_quantity: nextQty,
			unit_option_id: unitOptionId,
		});

		if (delta > 0) {
			onAdded?.();
		}
	};

	const handleQuantityUnitChange = (product: Product, unitOptionId: string) => {
		if (!product.is_available) {
			return;
		}

		setPreferredQuantityUnitByProduct(prev => ({
			...prev,
			[product.id]: unitOptionId,
		}));

		const current = selections[product.id];
		if (current?.selection_mode !== "quantity") {
			return;
		}

		onUpdateSelection(product, {
			...current,
			unit_option_id: unitOptionId,
		});
	};

	const handlePresetSelection = (
		product: Product,
		mode: "weight" | "price",
		value: number,
	) => {
		if (!product.is_available) {
			return;
		}

		if (mode === "weight") {
			const nextGrams = Math.round(value);
			const currentSelection = selections[product.id];
			const currentGrams =
				currentSelection?.selection_mode === "weight"
					? Number(currentSelection.selection_grams || 0)
					: 0;

			if (currentGrams === nextGrams) {
				onUpdateSelection(product, null);
				return;
			}

			onUpdateSelection(product, {
				selection_mode: "weight",
				selection_grams: nextGrams,
			});
		} else {
			onUpdateSelection(product, {
				selection_mode: "price",
				selection_amount_egp: Number(value.toFixed(2)),
			});
		}

		onAdded?.();
	};

	const submitCustomSelection = () => {
		if (!selectedProduct || !customSheet || !selectedProduct.is_available) {
			return;
		}

		const parsed = Number(customValue.trim().replace(",", "."));
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return;
		}

		if (customSheet.mode === "weight") {
			onUpdateSelection(selectedProduct, {
				selection_mode: "weight",
				selection_grams: Math.round(parsed),
			});
		} else {
			onUpdateSelection(selectedProduct, {
				selection_mode: "price",
				selection_amount_egp: Number(parsed.toFixed(2)),
			});
		}

		onAdded?.();
		closeCustomSheet();
	};

	const submitAvailabilityRequest = async () => {
		if (!selectedAvailabilityProduct || !onRequestAvailability) {
			return;
		}

		setIsAvailabilitySubmitting(true);
		try {
			const result = await onRequestAvailability(selectedAvailabilityProduct);
			if (result === "created" || result === "already_requested_today") {
				closeAvailabilitySheet(true);
			}
		} finally {
			setIsAvailabilitySubmitting(false);
		}
	};

	return (
		<>
			<div className="space-y-4">
				{products.map((product, index) => {
					const mode = resolveProductMode(product);
					const isUnavailable = product.is_available === false;
					const priceValue = parseProductPrice(product);
					const priceText = priceValue ? formatCurrency(priceValue) : null;
					const selection = selections[product.id];
					const quantityOptions = resolveQuantityOptions(product);
					const shouldAttachLoadMoreRef =
						typeof loadMoreTriggerIndex === "number" &&
						loadMoreTriggerIndex >= 0 &&
						index === loadMoreTriggerIndex;

					const selectedQty =
						selection?.selection_mode === "quantity"
							? Number(selection.selection_quantity || 0)
							: 0;
					const selectedGrams =
						selection?.selection_mode === "weight"
							? Number(selection.selection_grams || 0)
							: 0;
					const selectedAmount =
						selection?.selection_mode === "price"
							? Number(selection.selection_amount_egp || 0)
							: 0;

					const weightPresets =
						product.order_config?.weight?.preset_grams?.length
							? product.order_config.weight.preset_grams
							: DEFAULT_WEIGHT_PRESETS;
					const pricePresets =
						product.order_config?.price?.preset_amounts_egp?.length
							? product.order_config.price.preset_amounts_egp
							: DEFAULT_PRICE_PRESETS;

					const selectedUnitId =
						preferredQuantityUnitByProduct[product.id] ||
						(selection?.selection_mode === "quantity"
							? selection.unit_option_id
							: undefined) ||
						quantityOptions[0]?.id;
					const isCustomWeightSelection =
						selectedGrams > 0 && !weightPresets.includes(selectedGrams);

					return (
						<div
							key={product.id}
							ref={shouldAttachLoadMoreRef ? setLoadMoreTarget : undefined}
							className={`rounded-2xl border p-4 shadow-sm ${
								isUnavailable
									? "border-gray-200 bg-gray-50"
									: "border-gray-200 bg-white"
							}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ${
										isUnavailable
											? "bg-gray-100 ring-gray-200"
											: "bg-gray-100 ring-gray-100"
									}`}
								>
									{product.image_url ? (
										<Image
											src={getImageUrl(product.image_url)}
											alt={product.name}
											className={`h-full w-full object-cover ${
												isUnavailable ? "grayscale" : ""
											}`}
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
									<h3
										className={`text-base font-semibold ${
											isUnavailable ? "text-gray-600" : "text-gray-900"
										}`}
									>
										{product.name}
									</h3>
									<p
										className={`text-xs ${
											isUnavailable ? "text-gray-400" : "text-gray-500"
										}`}
									>
										{priceText ? `السعر: ${priceText}` : "السعر يتم تأكيده بعد الطلب"}
									</p>
									<div className="mt-1 flex items-center gap-2">
										<p
											className={`text-[11px] font-semibold ${
												isUnavailable ? "text-gray-500" : "text-indigo-700"
											}`}
										>
											{mode === "quantity"
												? "بالعدد"
												: mode === "weight"
													? "بالوزن"
													: "بالمبلغ"}
										</p>
										{isUnavailable && (
											<span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
												غير متاح حالياً
											</span>
										)}
									</div>
								</div>
							</div>

							<div className="mt-3">
								{isUnavailable ? (
									<button
										type="button"
										onClick={() => setAvailabilitySheet({ product })}
										className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800"
									>
										اطلب توفير المنتج
									</button>
								) : (
									<>
										{mode === "quantity" && (
											<div className="space-y-2">
												{quantityOptions.length > 0 && (
													<div className="flex flex-wrap gap-2">
														{quantityOptions.map(option => (
															<button
																key={option.id}
																type="button"
																onClick={() =>
																	handleQuantityUnitChange(product, option.id)
																}
																className={`rounded-full border px-3 py-1 text-xs font-medium ${
																	selectedUnitId === option.id
																		? "border-indigo-600 bg-indigo-50 text-indigo-700"
																		: "border-gray-300 bg-white text-gray-700"
																}`}
															>
																{option.label}
															</button>
														))}
													</div>
												)}

												<div className="flex items-center gap-2">
													{selectedQty > 0 && (
														<>
															<button
																type="button"
																onClick={() => handleQuantityDelta(product, -1)}
																className="h-10 w-10 rounded-full border border-gray-300 text-lg text-gray-700 active:scale-[0.97]"
															>
																-
															</button>
															<span className="min-w-8 text-center text-sm font-bold text-gray-900">
																{selectedQty}
															</span>
														</>
													)}
													<button
														type="button"
														onClick={() => handleQuantityDelta(product, 1)}
														className="h-10 w-10 rounded-full bg-indigo-600 text-lg text-white active:scale-[0.97]"
													>
														+
													</button>
													<span className="text-xs text-gray-500">
														{resolveQuantityUnitLabel(product)}
													</span>
												</div>
											</div>
										)}

										{mode === "weight" && (
											<div className="space-y-2">
												<p className="text-xs font-semibold text-gray-700">اختار الكمية:</p>
												<div className="flex flex-wrap gap-2">
													{weightPresets.map(grams => (
														<button
															key={grams}
															type="button"
															onClick={() =>
																handlePresetSelection(product, "weight", grams)
															}
															aria-pressed={selectedGrams === grams}
															className={`rounded-full border px-3 py-1 text-xs font-medium active:scale-[0.97] ${
																selectedGrams === grams
																	? "border-indigo-600 bg-indigo-50 text-indigo-700"
																	: "border-gray-300 bg-white text-gray-700"
															}`}
														>
															{grams} جم
														</button>
													))}
														<button
															type="button"
															onClick={() => {
																if (isCustomWeightSelection) {
																	onUpdateSelection(product, null);
																	return;
																}

																setCustomSheet({ product, mode: "weight" });
															}}
															aria-pressed={isCustomWeightSelection}
															className={`rounded-full border border-dashed px-3 py-1 text-xs font-medium active:scale-[0.97] ${
																isCustomWeightSelection
																	? "border-indigo-600 bg-indigo-50 text-indigo-700"
																	: "border-gray-400 text-gray-700"
														}`}
													>
															{isCustomWeightSelection
																? `كمية مخصصة (${selectedGrams} جم)`
																: "كمية مخصصة"}
														</button>
													</div>
												</div>
											)}

										{mode === "price" && (
											<div className="space-y-2">
												<p className="text-xs font-semibold text-gray-700">اختار المبلغ:</p>
												<div className="flex flex-wrap gap-2">
													{pricePresets.map(amount => (
														<button
															key={amount}
															type="button"
															onClick={() =>
																handlePresetSelection(product, "price", amount)
															}
															className={`rounded-full border px-3 py-1 text-xs font-medium active:scale-[0.97] ${
																selectedAmount === amount
																	? "border-indigo-600 bg-indigo-50 text-indigo-700"
																	: "border-gray-300 bg-white text-gray-700"
															}`}
														>
															{amount} جنيه
														</button>
													))}
													<button
														type="button"
														onClick={() => setCustomSheet({ product, mode: "price" })}
														className="rounded-full border border-dashed border-gray-400 px-3 py-1 text-xs font-medium text-gray-700 active:scale-[0.97]"
													>
														مبلغ مخصص
													</button>
												</div>
											</div>
										)}
									</>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{customSheet && selectedProduct && (
				<div className="fixed inset-0 z-[70] flex items-end bg-black/35">
					<div className="w-full rounded-t-3xl bg-white p-4 shadow-2xl">
						<p className="text-sm font-semibold text-gray-900">
							{customSheet.mode === "weight" ? "أدخل الكمية بالجرام" : "أدخل المبلغ بالجنيه"}
						</p>
						<input
							type="text"
							inputMode="decimal"
							value={customValue}
							onChange={event => setCustomValue(event.target.value)}
							placeholder={currentCustomPlaceholder}
							className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500"
						/>
						<div className="mt-4 grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={closeCustomSheet}
								className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"
							>
								إلغاء
							</button>
							<button
								type="button"
								onClick={submitCustomSelection}
								className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
							>
								تأكيد
							</button>
						</div>
					</div>
				</div>
			)}

			{availabilitySheet && selectedAvailabilityProduct && (
				<div className="fixed inset-0 z-[75] flex items-end bg-black/40">
					<button
						type="button"
						onClick={() => closeAvailabilitySheet()}
						className="absolute inset-0"
						aria-label="إغلاق"
					/>
					<div className="relative w-full rounded-t-3xl bg-white p-4 shadow-2xl">
						<p className="text-base font-bold text-gray-900">العنصر غير متاح حالياً</p>
						<p className="mt-1 text-sm text-gray-600">
							تحب نبلغ التاجر إنك محتاجه؟
						</p>
						<div className="mt-4 grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={submitAvailabilityRequest}
								disabled={isAvailabilitySubmitting}
								className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
							>
								{isAvailabilitySubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}
							</button>
							<button
								type="button"
								onClick={() => closeAvailabilitySheet()}
								disabled={isAvailabilitySubmitting}
								className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 disabled:opacity-60"
							>
								إلغاء
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
