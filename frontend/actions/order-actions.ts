"use server";

import { z } from "zod";
import { ordersService } from "@/services/api/orders.service";
import { createOrderSchema } from "@/lib/validations/order";

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  timestamp?: number;
  data?: any;
};

export async function createOrderAction(
  tenantSlug: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries());

  // Validate Fields
  const validated = createOrderSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      errors: validated.error.flatten().fieldErrors,
      timestamp: Date.now(),
    };
  }

  // Construct items from cart JSON
  let items: any[] = [];
  if (validated.data.cart) {
    try {
      items = JSON.parse(validated.data.cart);
    } catch (e) {
      console.error("Failed to parse cart JSON", e);
    }
  }

  const payload = {
    customer: {
      name: "Guest", // Optional or could be added to form
      phone: validated.data.phone.startsWith("+20") 
        ? validated.data.phone 
        : `+20${validated.data.phone.replace(/^0+/, '')}`,
      address: validated.data.address,
    },
    order_type: items.length > 0 ? "catalog" : "free_text",
    items: items.length > 0 ? items : undefined,
    notes: validated.data.notes,
    free_text_payload: items.length === 0 ? { text: validated.data.notes } : undefined,
  };

  try {
    const res = await ordersService.createPublicOrder(tenantSlug, payload);

    if (res.success) {
      return {
        success: true,
        message: "Order placed successfully!",
        timestamp: Date.now(),
        data: res.data,
      };
    } else {
      return {
        success: false,
        message: res.message || "Failed to place order.",
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      timestamp: Date.now(),
    };
  }
}
