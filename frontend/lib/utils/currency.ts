export function formatCurrency(
	amount?: number | null,
	currency = "EGP",
	locale = "en"
) {
	if (typeof amount !== "number" || Number.isNaN(amount)) {
		return undefined;
	}

	try {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency,
			maximumFractionDigits: 2,
		}).format(amount);
	} catch {
		return amount.toFixed(2);
	}
}
