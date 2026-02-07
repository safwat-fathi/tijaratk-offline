export type ProductSource = 'manual' | 'catalog' | 'order_note';
export type ProductStatus = 'active' | 'archived';

export interface Product {
  id: number;
  name: string;
  image_url?: string | null;
  source: ProductSource;
  status: ProductStatus;
  tenant_id?: number;
}

export interface CatalogItem {
  id: number;
  name: string;
  image_url?: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}
