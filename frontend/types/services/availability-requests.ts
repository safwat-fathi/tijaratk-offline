export interface CreateAvailabilityRequestPayload {
  product_id: number;
  visitor_key: string;
}

export interface CreateAvailabilityRequestResponse {
  status: 'created' | 'already_requested_today';
  requested_at: string;
  product_id: number;
}

export interface MerchantAvailabilityTopProduct {
  product_id: number;
  product_name: string;
  requests_count: number;
  last_requested_at: string;
}

export interface MerchantAvailabilitySummaryResponse {
  today_total_requests: number;
  top_products: MerchantAvailabilityTopProduct[];
}
