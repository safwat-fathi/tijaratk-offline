import HttpService from '@/services/base/http.service';
import {
  CreateAvailabilityRequestPayload,
  CreateAvailabilityRequestResponse,
  MerchantAvailabilitySummaryResponse,
} from '@/types/services/availability-requests';

class AvailabilityRequestsService extends HttpService {
  constructor() {
    super('/availability-requests');
  }

  public async createPublicRequest(
    slug: string,
    payload: CreateAvailabilityRequestPayload,
  ) {
    return this.post<CreateAvailabilityRequestResponse>(
      `public/${slug}`,
      payload,
    );
  }

  public async getMerchantSummary(params?: { days?: number; limit?: number }) {
    return this.get<MerchantAvailabilitySummaryResponse>('merchant/summary', params, {
      cache: 'no-store',
      authRequired: true,
    });
  }
}

export const availabilityRequestsService = new AvailabilityRequestsService();
