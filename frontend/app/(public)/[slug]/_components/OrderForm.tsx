"use client";

import Link from "next/link";

import { useState, useActionState, useEffect } from "react";
import { Product } from "@/types/models/product";
import ProductList from "./ProductList";
import { createOrderAction } from "@/actions/order-actions";

const initialState = {
  success: false,
  message: "",
  errors: undefined,
  data: undefined, // Add data to initial state to hold public_token
};

export default function OrderForm({ tenantSlug, products }: { tenantSlug: string, products: Product[] }) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");
  const [orderToken, setOrderToken] = useState<string | null>(null); // New state for orderToken
  const [state, formAction, isPending] = useActionState(createOrderAction.bind(null, tenantSlug), initialState);

  // Effect to handle success state and capture orderToken
  useEffect(() => {
		if (state.success && state.data?.public_token) {
			console.log("🚀 ~ :25 ~ OrderForm ~ state.data:", state.data)
      setOrderToken(state.data.public_token);
    }
  }, [state]);

  const handleUpdateCart = (pid: number, qty: number) => {
    setCart(prev => {
        if (qty === 0) {
            const { [pid]: _, ...rest } = prev;
            return rest;
        }
        return { ...prev, [pid]: qty };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [pid, qty]) => {
      const product = products.find(p => p.id === Number(pid));
      return sum + (product ? Number(product.price) * qty : 0);
  }, 0);

  // Prepare cart items data for hidden input
  const cartItems = Object.entries(cart).map(([pid, qty]) => {
      const product = products.find(p => p.id === Number(pid));
      return {
          product_id: Number(pid),
          title: product?.name || "Unknown",
          unit_price: Number(product?.price || 0),
          quantity: qty
      };
  });

  const copyToken = () => {
    if (orderToken) {
        const url = `${window.location.origin}/track-order/${orderToken}`;
        navigator.clipboard.writeText(url);
        // Simple feedback
        const btn = document.getElementById("copy-btn");
        if(btn) btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-green-600"><path d="M20 6 9 17l-5-5"/></svg>`;
        setTimeout(() => {
            if(btn) btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        }, 2000);
    }
  };

  if (state.success && orderToken) { 
      return (
          <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">Order Sent!</h2>
              <p className="text-gray-500 mb-8 max-w-sm">
                  The store owner will contact you to confirm. <br/>
                  Save your tracking link to check status.
              </p>

              {orderToken && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 w-full max-w-sm mb-8">
                     <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tracking Link</span>
                        <div className="flex items-center gap-1 w-full text-gray-800">
                            <span className="text-sm font-mono truncate w-full text-gray-500">{typeof window !== 'undefined' ? window.location.origin : ''}/track-order/</span>
                            <span className="text-sm font-mono font-bold">{orderToken.slice(0, 8)}...</span>
                        </div>
                     </div>
                     <button 
                        id="copy-btn"
                        type="button"
                        onClick={copyToken}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-primary transition-all active:scale-95"
                        title="Copy Link"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                     </button>
                  </div>
              )}
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                {orderToken && (
                    <Link href={`/track-order/${orderToken}`} prefetch={true} className="w-full">
                        <button className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            <span>Track Order</span>
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                    </Link>
                )}
                
                <button onClick={() => window.location.reload()} className="w-full py-3.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 transition-colors">
                    Make a new order
                </button>
              </div>
          </div>
      )
  }

  return (
    <>
      {products.length > 0 && (
        <ProductList products={products} onUpdateCart={handleUpdateCart} />
      )}

      <form action={formAction}>
        <input type="hidden" name="cart" value={JSON.stringify(cartItems)} />

        {/* Manual Order Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 mt-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Special Request?</h2>
            </div>
            <textarea 
            name="notes"
            placeholder="e.g. 1kg tomatoes, 2 packs of sugar..."
            className="w-full p-4 border border-gray-200 rounded-xl h-32 text-base resize-none focus:ring-2 ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400 bg-gray-50/50"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            />
            {state.errors?.notes && <p className="text-sm text-red-600 mt-1">{state.errors.notes[0]}</p>}
            <p className="text-sm text-gray-500 ml-1">The store owner will confirm price and availability with you.</p>
        </div>

        {/* Delivery Details */}
        {(totalItems > 0 || true) && ( // Always show logic or dependent on cart - keeping consistent with previous logic if needed, but 'true' makes it always visible if that was intent, checking original code: (totalItems > 0 || formData.notes.length > 0). With form actions, we don't easily track notes length without onChange. Let's start with always visible or simple visibility toggle if items > 0. For now, let's allow it to be visible so user can type phone/address anytime.
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 mt-6 pb-32 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Delivery Details</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                            <input 
                                name="phone"
                                type="tel" 
                                dir="ltr"
                                placeholder="01xxxxxxxxx"
                                className="w-full pl-12 p-3.5 border border-gray-200 rounded-xl text-lg outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-colors bg-gray-50/30"
                                required
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                        </div>
                        {state.errors?.phone && <p className="text-sm text-red-600 mt-1">{state.errors.phone[0]}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address</label>
                        <div className="relative">
                            <input 
                                name="address"
                                type="text" 
                                placeholder="Building, Street, Floor..."
                                className="w-full pl-12 p-3.5 border border-gray-200 rounded-xl text-lg outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-colors bg-gray-50/30"
                                required
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            </div>
                        </div>
                        {state.errors?.address && <p className="text-sm text-red-600 mt-1">{state.errors.address[0]}</p>}
                    </div>
                </div>

                {state.message && !state.success && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                        {state.message}
                    </div>
                )}
            </div>
        )}

        {/* Sticky Footer Action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-full duration-300">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-end mb-4 px-2">
                    <div className="text-sm font-medium text-gray-500">Total Estimated</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900">{totalPrice.toFixed(2)}</span>
                        <span className="text-sm font-semibold text-gray-500">EGP</span>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={isPending || (totalItems === 0 && !notes.trim())} 
                    className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                >
                    {isPending ? (
                        <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="animate-spin"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <span>Sending Order...</span>
                        </>
                    ) : (
                        <>
                            <span>Confirm Order</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </>
                    )}
                </button>
            </div>
        </div>
      </form>
    </>
  );
}
