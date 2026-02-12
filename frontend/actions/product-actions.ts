'use server';

import { productsService } from '@/services/api/products.service';
import { isNextRedirectError } from '@/lib/auth/navigation-errors';
import { Product } from '@/types/models/product';

export async function createProductAction(
  name: string,
  imageUrl?: string,
  currentPrice?: number,
) {
  try {
    const response = await productsService.createProduct({
      name,
      image_url: imageUrl,
      current_price: currentPrice,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'تعذر إضافة المنتج',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Create product failed:', error);
    return {
      success: false,
      message: 'تعذر إضافة المنتج',
    };
  }
}

export async function addProductFromCatalogAction(catalogItemId: number) {
  try {
    const response = await productsService.addProductFromCatalog(catalogItemId);

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'تعذر إضافة المنتج من الكتالوج',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Add product from catalog failed:', error);
    return {
      success: false,
      message: 'تعذر إضافة المنتج من الكتالوج',
    };
  }
}

export async function updateProductAction(productId: number, formData: FormData) {
  try {
    const normalizedPayload = new FormData();
    const rawName = formData.get('name');
    const rawCurrentPrice = formData.get('current_price');
    const file = formData.get('file');

    if (typeof rawName === 'string') {
      const trimmed = rawName.trim();
      if (trimmed) {
        normalizedPayload.set('name', trimmed);
      }
    }

    if (typeof rawCurrentPrice === 'string') {
      const trimmed = rawCurrentPrice.trim();
      if (trimmed) {
        normalizedPayload.set('current_price', trimmed);
      }
    }

    if (file instanceof File && file.size > 0) {
      normalizedPayload.set('file', file);
    }

    const response = await productsService.updateProduct(
      productId,
      normalizedPayload,
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'تعذر تعديل المنتج',
      };
    }

    return {
      success: true,
      data: response.data as Product,
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error('Update product failed:', error);
    return {
      success: false,
      message: 'تعذر تعديل المنتج',
    };
  }
}

export async function removeProductAction(productId: number) {
  try {
    const response = await productsService.removeProduct(productId);

    if (!response.success) {
      return {
        success: false,
        message: response.message || 'تعذر حذف المنتج',
      };
    }

    return {
      success: true,
      message: 'تم حذف المنتج',
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error('Remove product failed:', error);
    return {
      success: false,
      message: 'تعذر حذف المنتج',
    };
  }
}

export async function searchTenantProductsAction(
  search: string,
  page = 1,
  limit = 20,
  category?: string,
) {
  try {
    const normalizedSearch = search.trim();
    if (normalizedSearch.length < 2) {
      return {
        success: true,
        data: {
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit,
            last_page: 1,
            has_next: false,
          },
        },
      };
    }

    const response = await productsService.searchProducts({
      search: normalizedSearch,
      category: category?.trim() || undefined,
      page,
      limit,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'تعذر تحميل نتائج البحث',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error('Search tenant products failed:', error);
    return {
      success: false,
      message: 'تعذر تحميل نتائج البحث',
    };
  }
}
