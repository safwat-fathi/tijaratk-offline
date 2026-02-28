"use client";

import { Product } from "@/types/models/product";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import SafeImage from "@/components/ui/SafeImage";
import { getImageUrl } from "@/lib/utils/image";
import { formatCurrency } from "@/lib/utils/currency";
import { formatArabicInteger } from "@/lib/utils/number";
import { useMemo, useState } from "react";

type SelectionMode = "quantity" | "weight" | "price";

export type ProductCartSelection = {
	selection_mode: SelectionMode;
	selection_quantity?: number;
	selection_grams?: number;
	selection_amount_egp?: number;
	unit_option_id?: string;
	item_note?: string;
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

const resolveModeLabel = (mode: SelectionMode) => {
	if (mode === "quantity") {
		return "بالعدد";
	}

	if (mode === "weight") {
		return "بالوزن";
	}

	return "بالمبلغ";
};

const resolveQuantityUnitLabel = (product: Product) =>
	product.order_config?.quantity?.unit_label || "قطعة";

export type QuantityOption = {
	id: string;
	label: string;
	multiplier: number | string;
};

const resolveQuantityOptions = (product: Product): QuantityOption[] => {
	const options = product.order_config?.quantity?.unit_options;
	if (!Array.isArray(options) || options.length === 0) {
		return [];
	}

	return options.filter((option: unknown): option is QuantityOption => {
		if (!option || typeof option !== "object") return false;
		const record = option as Record<string, unknown>;
		return (
			typeof record.id === "string" &&
			typeof record.label === "string" &&
			Number(record.multiplier) > 0
		);
	});
};

type ProductListCardProps = {
	product: Product;
	selection?: ProductCartSelection;
	preferredQuantityUnitId?: string;
	loadMoreRef?: (node: HTMLDivElement | null) => void;
	onQuantityDelta: (product: Product, delta: number) => void;
	onQuantityUnitChange: (product: Product, unitOptionId: string) => void;
	onPresetSelection: (product: Product, mode: "weight" | "price", value: number) => void;
	onUpdateSelection: (product: Product, selection: ProductCartSelection | null) => void;
	onOpenCustomSheet: (product: Product, mode: "weight" | "price") => void;
	onOpenAvailabilitySheet: (product: Product) => void;
};

const resolveSelectionMetrics = ({
	product,
	selection,
	preferredQuantityUnitId,
}: {
	product: Product;
	selection?: ProductCartSelection;
	preferredQuantityUnitId?: string;
}) => {
	const quantityOptions = resolveQuantityOptions(product);
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
		preferredQuantityUnitId ||
		(selection?.selection_mode === "quantity"
			? selection.unit_option_id
			: undefined) ||
		quantityOptions[0]?.id;

	return {
		quantityOptions,
		selectedQty,
		selectedGrams,
		selectedAmount,
		weightPresets,
		pricePresets,
		selectedUnitId,
		isCustomWeightSelection:
			selectedGrams > 0 && !weightPresets.includes(selectedGrams),
	};
};

type QuantitySelectionControlsProps = {
	product: Product;
	quantityOptions: ReturnType<typeof resolveQuantityOptions>;
	selectedUnitId?: string;
	selectedQty: number;
	onQuantityDelta: (product: Product, delta: number) => void;
	onQuantityUnitChange: (product: Product, unitOptionId: string) => void;
};

const QuantitySelectionControls = ({
	product,
	quantityOptions,
	selectedUnitId,
	selectedQty,
	onQuantityDelta,
	onQuantityUnitChange,
}: QuantitySelectionControlsProps) => (
	<div className="space-y-2">
		{quantityOptions.length > 0 && (
			<div className="flex flex-wrap gap-2">
				{quantityOptions.map((option) => (
					<button
						key={option.id}
						type="button"
						onClick={() => onQuantityUnitChange(product, option.id)}
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
						onClick={() => onQuantityDelta(product, -1)}
						className="h-10 w-10 rounded-full border border-gray-300 text-lg text-gray-700 active:scale-[0.97]"
					>
						-
					</button>
					<span className="min-w-8 text-center text-sm font-bold text-gray-900">
						{formatArabicInteger(selectedQty) || selectedQty}
					</span>
				</>
			)}
			<button
				type="button"
				onClick={() => onQuantityDelta(product, 1)}
				className="h-10 w-10 rounded-full bg-indigo-600 text-lg text-white active:scale-[0.97]"
			>
				+
			</button>
			<span className="text-xs text-gray-500">{resolveQuantityUnitLabel(product)}</span>
		</div>
	</div>
);

type WeightSelectionControlsProps = {
	product: Product;
	weightPresets: number[];
	selectedGrams: number;
	isCustomWeightSelection: boolean;
	onPresetSelection: (product: Product, mode: "weight" | "price", value: number) => void;
	onUpdateSelection: (product: Product, selection: ProductCartSelection | null) => void;
	onOpenCustomSheet: (product: Product, mode: "weight" | "price") => void;
};

const WeightSelectionControls = ({
	product,
	weightPresets,
	selectedGrams,
	isCustomWeightSelection,
	onPresetSelection,
	onUpdateSelection,
	onOpenCustomSheet,
}: WeightSelectionControlsProps) => (
	<div className="space-y-2">
		<p className="text-xs font-semibold text-gray-700">اختار الكمية:</p>
		<div className="flex flex-wrap gap-2">
			{weightPresets.map((grams) => (
				<button
					key={grams}
					type="button"
					onClick={() => onPresetSelection(product, "weight", grams)}
					aria-pressed={selectedGrams === grams}
					className={`rounded-full border px-3 py-1 text-xs font-medium active:scale-[0.97] ${
						selectedGrams === grams
							? "border-indigo-600 bg-indigo-50 text-indigo-700"
							: "border-gray-300 bg-white text-gray-700"
					}`}
				>
					{formatArabicInteger(grams) || grams} جم
				</button>
			))}
			<button
				type="button"
				onClick={() => {
					if (isCustomWeightSelection) {
						onUpdateSelection(product, null);
						return;
					}

					onOpenCustomSheet(product, "weight");
				}}
				aria-pressed={isCustomWeightSelection}
				className={`rounded-full border border-dashed px-3 py-1 text-xs font-medium active:scale-[0.97] ${
					isCustomWeightSelection
						? "border-indigo-600 bg-indigo-50 text-indigo-700"
						: "border-gray-400 text-gray-700"
				}`}
				>
				{isCustomWeightSelection
					? `كمية مخصصة (${formatArabicInteger(selectedGrams) || selectedGrams} جم)`
					: "كمية مخصصة"}
			</button>
		</div>
	</div>
);

type PriceSelectionControlsProps = {
	product: Product;
	pricePresets: number[];
	selectedAmount: number;
	onPresetSelection: (product: Product, mode: "weight" | "price", value: number) => void;
	onOpenCustomSheet: (product: Product, mode: "weight" | "price") => void;
};

const PriceSelectionControls = ({
	product,
	pricePresets,
	selectedAmount,
	onPresetSelection,
	onOpenCustomSheet,
}: PriceSelectionControlsProps) => (
	<div className="space-y-2">
		<p className="text-xs font-semibold text-gray-700">اختار المبلغ:</p>
		<div className="flex flex-wrap gap-2">
			{pricePresets.map((amount) => (
				<button
					key={amount}
					type="button"
					onClick={() => onPresetSelection(product, "price", amount)}
					className={`rounded-full border px-3 py-1 text-xs font-medium active:scale-[0.97] ${
						selectedAmount === amount
							? "border-indigo-600 bg-indigo-50 text-indigo-700"
							: "border-gray-300 bg-white text-gray-700"
					}`}
				>
					{formatArabicInteger(amount) || amount} جنيه
				</button>
			))}
			<button
				type="button"
				onClick={() => onOpenCustomSheet(product, "price")}
				className="rounded-full border border-dashed border-gray-400 px-3 py-1 text-xs font-medium text-gray-700 active:scale-[0.97]"
			>
				مبلغ مخصص
			</button>
		</div>
	</div>
);

type ProductSelectionControlsProps = {
	product: Product;
	mode: SelectionMode;
	isUnavailable: boolean;
	quantityOptions: ReturnType<typeof resolveQuantityOptions>;
	selectedUnitId?: string;
	selectedQty: number;
	selectedGrams: number;
	selectedAmount: number;
	weightPresets: number[];
	pricePresets: number[];
	isCustomWeightSelection: boolean;
	onQuantityDelta: (product: Product, delta: number) => void;
	onQuantityUnitChange: (product: Product, unitOptionId: string) => void;
	onPresetSelection: (product: Product, mode: "weight" | "price", value: number) => void;
	onUpdateSelection: (product: Product, selection: ProductCartSelection | null) => void;
	onOpenCustomSheet: (product: Product, mode: "weight" | "price") => void;
	onOpenAvailabilitySheet: (product: Product) => void;
};

const ProductSelectionControls = ({
	product,
	mode,
	isUnavailable,
	quantityOptions,
	selectedUnitId,
	selectedQty,
	selectedGrams,
	selectedAmount,
	weightPresets,
	pricePresets,
	isCustomWeightSelection,
	onQuantityDelta,
	onQuantityUnitChange,
	onPresetSelection,
	onUpdateSelection,
	onOpenCustomSheet,
	onOpenAvailabilitySheet,
}: ProductSelectionControlsProps) => {
	if (isUnavailable) {
		return (
			<button
				type="button"
				onClick={() => onOpenAvailabilitySheet(product)}
				className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800"
			>
				اطلب توفير المنتج
			</button>
		);
	}

	if (mode === "quantity") {
		return (
			<QuantitySelectionControls
				product={product}
				quantityOptions={quantityOptions}
				selectedUnitId={selectedUnitId}
				selectedQty={selectedQty}
				onQuantityDelta={onQuantityDelta}
				onQuantityUnitChange={onQuantityUnitChange}
			/>
		);
	}

	if (mode === "weight") {
		return (
			<WeightSelectionControls
				product={product}
				weightPresets={weightPresets}
				selectedGrams={selectedGrams}
				isCustomWeightSelection={isCustomWeightSelection}
				onPresetSelection={onPresetSelection}
				onUpdateSelection={onUpdateSelection}
				onOpenCustomSheet={onOpenCustomSheet}
			/>
		);
	}

	return (
		<PriceSelectionControls
			product={product}
			pricePresets={pricePresets}
			selectedAmount={selectedAmount}
			onPresetSelection={onPresetSelection}
			onOpenCustomSheet={onOpenCustomSheet}
		/>
	);
};

const ProductListCard = ({
	product,
	selection,
	preferredQuantityUnitId,
	loadMoreRef,
	onQuantityDelta,
	onQuantityUnitChange,
	onPresetSelection,
	onUpdateSelection,
	onOpenCustomSheet,
	onOpenAvailabilitySheet,
}: ProductListCardProps) => {
	const mode = resolveProductMode(product);
	const isUnavailable = product.is_available === false;
	const priceValue = parseProductPrice(product);
	const priceText = priceValue ? formatCurrency(priceValue) : null;
	const {
		quantityOptions,
		selectedQty,
		selectedGrams,
		selectedAmount,
		weightPresets,
		pricePresets,
		selectedUnitId,
		isCustomWeightSelection,
	} = resolveSelectionMetrics({
		product,
		selection,
		preferredQuantityUnitId,
	});

	return (
		<div
			ref={loadMoreRef}
			className={`rounded-2xl border p-4 shadow-sm ${
				isUnavailable ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
			}`}
		>
			<div className="flex items-center gap-3">
				<div
					className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ${
						isUnavailable ? "bg-gray-100 ring-gray-200" : "bg-gray-100 ring-gray-100"
					}`}
				>
					{product.image_url ? (
						<SafeImage
							src={getImageUrl(product.image_url)}
							alt={product.name}
							width={56}
							height={56}
							loading="lazy"
							unoptimized
							imageClassName={`h-full w-full object-cover ${isUnavailable ? "grayscale" : ""}`}
							fallback={
								<div className="flex h-full w-full items-center justify-center text-base">
									🛒
								</div>
							}
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
							{resolveModeLabel(mode)}
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
				<ProductSelectionControls
					product={product}
					mode={mode}
					isUnavailable={isUnavailable}
					quantityOptions={quantityOptions}
					selectedUnitId={selectedUnitId}
					selectedQty={selectedQty}
					selectedGrams={selectedGrams}
					selectedAmount={selectedAmount}
					weightPresets={weightPresets}
					pricePresets={pricePresets}
					isCustomWeightSelection={isCustomWeightSelection}
					onQuantityDelta={onQuantityDelta}
					onQuantityUnitChange={onQuantityUnitChange}
					onPresetSelection={onPresetSelection}
					onUpdateSelection={onUpdateSelection}
					onOpenCustomSheet={onOpenCustomSheet}
					onOpenAvailabilitySheet={onOpenAvailabilitySheet}
				/>
			</div>
		</div>
	);
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
	useBodyScrollLock(Boolean(customSheet || availabilitySheet));

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

	const handleQuantityDelta = (product: Product, delta: number) => {
		if (!product.is_available) {
			return;
		}

		const selection = selections[product.id];
		const itemNote =
			selection?.item_note !== undefined ? selection.item_note : undefined;
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
			item_note: itemNote,
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
			const itemNote =
				currentSelection?.item_note !== undefined
					? currentSelection.item_note
					: undefined;
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
				item_note: itemNote,
			});
		} else {
			const currentSelection = selections[product.id];
			const itemNote =
				currentSelection?.item_note !== undefined
					? currentSelection.item_note
					: undefined;
			onUpdateSelection(product, {
				selection_mode: "price",
				selection_amount_egp: Number(value.toFixed(2)),
				item_note: itemNote,
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
			const currentSelection = selections[selectedProduct.id];
			const itemNote =
				currentSelection?.item_note !== undefined
					? currentSelection.item_note
					: undefined;
			onUpdateSelection(selectedProduct, {
				selection_mode: "weight",
				selection_grams: Math.round(parsed),
				item_note: itemNote,
			});
		} else {
			const currentSelection = selections[selectedProduct.id];
			const itemNote =
				currentSelection?.item_note !== undefined
					? currentSelection.item_note
					: undefined;
			onUpdateSelection(selectedProduct, {
				selection_mode: "price",
				selection_amount_egp: Number(parsed.toFixed(2)),
				item_note: itemNote,
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
						const selection = selections[product.id];
						const shouldAttachLoadMoreRef =
							typeof loadMoreTriggerIndex === "number" &&
							loadMoreTriggerIndex >= 0 &&
							index === loadMoreTriggerIndex;

						return (
							<ProductListCard
								key={product.id}
								product={product}
								selection={selection}
								preferredQuantityUnitId={preferredQuantityUnitByProduct[product.id]}
								loadMoreRef={
									shouldAttachLoadMoreRef ? setLoadMoreTarget : undefined
								}
								onQuantityDelta={handleQuantityDelta}
								onQuantityUnitChange={handleQuantityUnitChange}
								onPresetSelection={handlePresetSelection}
								onUpdateSelection={onUpdateSelection}
								onOpenCustomSheet={(selectedProduct, mode) =>
									setCustomSheet({ product: selectedProduct, mode })
								}
								onOpenAvailabilitySheet={(selectedProduct) =>
									setAvailabilitySheet({ product: selectedProduct })
								}
							/>
						);
					})}
				</div>

			{customSheet && selectedProduct && (
				<div
					className="fixed inset-0 z-70 flex items-end bg-black/35"
					role="dialog"
					aria-modal="true"
				>
					<div
						className="max-h-[85dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-4 shadow-2xl"
						style={{ WebkitOverflowScrolling: "touch" }}
					>
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
				<div
					className="fixed inset-0 z-75 flex items-end bg-black/40"
					role="dialog"
					aria-modal="true"
				>
					<button
						type="button"
						onClick={() => closeAvailabilitySheet()}
						className="absolute inset-0"
						aria-label="إغلاق"
					/>
					<div
						className="relative max-h-[85dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-4 shadow-2xl"
						style={{ WebkitOverflowScrolling: "touch" }}
					>
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
