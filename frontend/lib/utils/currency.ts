const CURRENCY_LOCALE = "ar-EG";
const CURRENCY_CODE = "EGP";

export function formatCurrency(amount?: number | string | null) {
	if (amount === null || amount === undefined || amount === "") {
		return undefined;
	}

	const normalizedAmount =
		typeof amount === "number"
			? amount
			: typeof amount === "string"
				? Number(amount.trim())
				: NaN;

	if (!Number.isFinite(normalizedAmount)) {
		return undefined;
	}

	try {
		return new Intl.NumberFormat(CURRENCY_LOCALE, {
			style: "currency",
			currency: CURRENCY_CODE,
			maximumFractionDigits: 2,
		}).format(normalizedAmount);
	} catch {
		return normalizedAmount.toFixed(2);
	}
}

export function formatCurrencyOrFallback(
	amount: number | string | null | undefined,
	fallback = "غير محدد",
) {
	return formatCurrency(amount) ?? fallback;
}
