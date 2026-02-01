import HttpService from "@/services/base/http.service";
import { Product } from "@/types/models/product";

class ProductsService extends HttpService {
  constructor() {
    super("/products");
  }

  public async getPublicProducts(slug: string) {
    return this.get<Product[]>(`public/${slug}`, undefined, {
      cache: "no-store",
    });
  }
}

export const productsService = new ProductsService();
