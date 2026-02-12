import HttpService from '@/services/base/http.service';
import {
  CatalogItem,
  Product,
  PublicProductCategory,
  PublicProductsResponse,
  TenantProductsSearchResponse,
} from '@/types/models/product';

class ProductsService extends HttpService {
  constructor() {
    super('/products');
  }

  public async getProducts() {
    return this.get<Product[]>('', undefined, {
      cache: 'no-store',
      authRequired: true,
    });
  }

  public async searchProducts(params: {
    search: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    return this.get<TenantProductsSearchResponse>('', params, {
      cache: 'no-store',
      authRequired: true,
    });
  }

  public async getPublicProducts(
    slug: string,
    params?: { search?: string; category?: string; page?: number; limit?: number },
  ) {
    return this.get<PublicProductsResponse>(`public/${slug}`, params, {
      cache: 'no-store',
    });
  }

  public async getPublicProductCategories(slug: string) {
    return this.get<PublicProductCategory[]>(`public/${slug}/categories`, undefined, {
      cache: 'no-store',
    });
  }

  public async createProduct(payload: {
    name: string;
    image_url?: string;
    current_price?: number;
  }) {
    return this.post<Product>('', payload, undefined, { authRequired: true });
  }

  public async addProductFromCatalog(catalogItemId: number) {
    return this.post<Product>(
      'from-catalog',
      { catalog_item_id: catalogItemId },
      undefined,
      { authRequired: true }
    );
  }

  public async updateProduct(productId: number, payload: FormData) {
    return this.patch<Product>(`${productId}`, payload, undefined, {
      authRequired: true,
    });
  }

  public async removeProduct(productId: number) {
    return this.delete<void>(`${productId}`, undefined, {
      authRequired: true,
    });
  }

  public async getCatalogCategories() {
    return this.get<string[]>('catalog/categories', undefined, {
      cache: 'no-store',
      authRequired: true,
    });
  }

  public async getCatalogItems(category?: string) {
    const route = category
      ? `catalog?category=${encodeURIComponent(category)}`
      : 'catalog';

    return this.get<CatalogItem[]>(route, undefined, {
      cache: 'no-store',
      authRequired: true,
    });
  }
}

export const productsService = new ProductsService();
