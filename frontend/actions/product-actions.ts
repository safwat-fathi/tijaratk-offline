'use server';

import { revalidatePath } from 'next/cache';
import { productsService } from '@/services/api/products.service';
import { isNextRedirectError } from '@/lib/auth/navigation-errors';
import { Product } from '@/types/models/product';

export async function createProductAction(name: string, imageUrl?: string) {
  try {
    const response = await productsService.createProduct({
      name,
      image_url: imageUrl,
    });

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'تعذر إضافة المنتج',
      };
    }

    revalidatePath('/merchant/products/new');

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

    revalidatePath('/merchant/products/new');

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
    const file = formData.get('file');

    if (typeof rawName === 'string') {
      const trimmed = rawName.trim();
      if (trimmed) {
        normalizedPayload.set('name', trimmed);
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

    revalidatePath('/merchant/products/new');

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
