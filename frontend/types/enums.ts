export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderType {
  CATALOG = 'catalog',
  FREE_TEXT = 'free_text',
}

export enum PricingMode {
  AUTO = 'auto',
  MANUAL = 'manual',
}
