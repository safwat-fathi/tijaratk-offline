import HttpService from '@/services/base/http.service';
import { CatalogItem, Product } from '@/types/models/product';

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

  public async getPublicProducts(slug: string) {
    return this.get<Product[]>(`public/${slug}`, undefined, {
      cache: 'no-store',
    });
  }

  public async createProduct(payload: { name: string; image_url?: string }) {
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
