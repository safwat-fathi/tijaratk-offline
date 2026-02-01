export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    image_url?: string;
    is_active: boolean;
    tenant_id?: number;
}
