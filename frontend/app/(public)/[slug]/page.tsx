import { notFound } from "next/navigation";
import StoreHeader from "./_components/StoreHeader";
import OrderForm from "./_components/OrderForm";

import { tenantsService } from "@/services/api/tenants.service";
import { productsService } from "@/services/api/products.service";

// Types
import { Tenant } from "@/types/models/tenant";
import { Product } from "@/types/models/product";

// Fetch data
async function getTenant(slug: string): Promise<Tenant | null> {
  const response = await tenantsService.getPublicTenant(slug);
  
  if (!response.success || !response.data) return null;
  return response.data;
}

async function getProducts(slug: string): Promise<Product[]> {
  const response = await productsService.getPublicProducts(slug);
  
  if (!response.success || !response.data) return [];
  return response.data;
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenant(slug);
  const products = await getProducts(slug);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-gray-50 pb-24">
      <StoreHeader tenant={tenant} />
      
      <div className="p-4 space-y-6">
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No products available at the moment.</p>
            <p className="text-sm">You can manually write your order below.</p>
          </div>
        )}
        
        <OrderForm tenantSlug={tenant.slug} products={products} />
      </div>
    </div>
  );
}
