const ARABIC_NUMBER_LOCALE = "ar-EG-u-nu-arab";

type NumericInput = number | string | null | undefined;

const parseNumericValue = (value: NumericInput): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalizedValue = value.trim().replace(/,/g, "");
  if (!normalizedValue) {
    return null;
  }

  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : null;
};

export function formatArabicNumber(
  value: NumericInput,
  options?: Intl.NumberFormatOptions,
): string | undefined {
  const parsedValue = parseNumericValue(value);
  if (parsedValue === null) {
    return undefined;
  }

  try {
    return new Intl.NumberFormat(ARABIC_NUMBER_LOCALE, options).format(parsedValue);
  } catch {
    return undefined;
  }
}

export function formatArabicInteger(value: NumericInput): string | undefined {
  return formatArabicNumber(value, {
    maximumFractionDigits: 0,
  });
}

export function formatArabicQuantity(value: NumericInput): string | undefined {
  return formatArabicNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function formatRtlQuantityLabel(name: string, quantity: NumericInput): string {
  const formattedQuantity = formatArabicQuantity(quantity);
  const fallbackQuantity =
    typeof quantity === "string" ? quantity.trim() : quantity?.toString() || "";
  const resolvedQuantity = formattedQuantity || fallbackQuantity;

  if (!resolvedQuantity) {
    return name;
  }

  return `${name} × ${resolvedQuantity}`;
}
