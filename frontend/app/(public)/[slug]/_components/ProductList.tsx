"use client";

import { useState } from "react";
import { Product } from "@/types/models/product";

// Design says "One column only". 
// Design says "One column only". 

// Let's create a simpler version where ProductList takes an onUpdate callback or uses a store.
// Given time constraints, let's use a simple Zustand store or Context. 
// Or better, just pass props if hierarchy is shallow.
// `page.tsx` renders `ProductList` and `OrderForm`. They need to share state? 
// No, the design implies "Select items" then "Order Summary". 
// To make it clean, let's create a client-side wrapper or Context.

// Let's do `ProductList` inside a Client Wrapper component that handles state.

export default function ProductList({ products, onUpdateCart }: { products: Product[], onUpdateCart: (productId: number, qty: number) => void }) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const handleUpdate = (pid: number, delta: number) => {
    const current = quantities[pid] || 0;
    const next = Math.max(0, current + delta);
    setQuantities(prev => ({ ...prev, [pid]: next }));
    onUpdateCart(pid, next);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold px-2 text-gray-800">Menu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
          const qty = quantities[product.id] || 0;
          return (
            <div key={product.id} className={`bg-white p-4 rounded-xl border transition-all duration-200 ${qty > 0 ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
               <div className="flex gap-4">
                 {/* Image Placeholder or Actual Image */}
                 <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl">🥦</span> // Generic placeholder
                    )}
                 </div>

                 <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{product.description || "Fresh and high quality"}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-lg text-primary">{product.price} <span className="text-xs font-medium text-gray-500">EGP</span></span>
                        
                        <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100">
                             {qty > 0 && (
                               <>
                                 <button 
                                   onClick={() => handleUpdate(product.id, -1)}
                                   className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-700 shadow-sm border border-gray-200 active:scale-90 transition-transform"
                                 >
                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                                 </button>
                                 <span className="w-4 text-center font-bold text-gray-900 select-none">{qty}</span>
                               </>
                             )}
                             <button 
                               onClick={() => handleUpdate(product.id, 1)}
                               className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white shadow-sm active:scale-90 transition-transform"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                             </button>
                        </div>
                    </div>
                 </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
