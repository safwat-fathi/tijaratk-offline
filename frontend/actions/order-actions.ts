'use server';

import { ordersService } from '@/services/api/orders.service';
import { OrderStatus, OrderType } from '@/types/enums';
import { CloseDayResponse, CreateOrderRequest } from '@/types/services/orders';
import { revalidatePath } from 'next/cache';
import { createOrderSchema } from '@/lib/validations/order';
import { isNextRedirectError } from '@/lib/auth/navigation-errors';
import {
  appendTrackedOrderToCookie,
  upsertCustomerProfileBySlugInCookie,
} from '@/lib/tracking/customer-tracking-cookie';

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  try {
    const response = await ordersService.updateOrder(orderId, { status });

    revalidatePath('/merchant/orders');
    revalidatePath(`/merchant/orders/${orderId}`);

    return { success: true, data: response.data };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Failed to update order status:', error);
    return { success: false, error: 'Failed to update order status' };
  }
}

export async function replaceOrderItemAction(
  orderId: number,
  itemId: number,
  replacedByProductId: number | null,
) {
  try {
    const response = await ordersService.replaceOrderItem(itemId, {
      replaced_by_product_id: replacedByProductId,
    });

    revalidatePath(`/merchant/orders/${orderId}`);
    revalidatePath('/merchant/orders');

    return { success: true, data: response.data };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Failed to replace order item:', error);
    return { success: false, error: 'Failed to replace order item' };
  }
}

export async function resetOrderItemReplacementAction(
  orderId: number,
  itemId: number,
) {
  try {
    const response = await ordersService.resetOrderItemReplacement(itemId);

    revalidatePath(`/merchant/orders/${orderId}`);
    revalidatePath('/merchant/orders');

    return { success: true, data: response.data };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Failed to reset order item replacement:', error);
    return { success: false, error: 'Failed to reset order item replacement' };
  }
}

export async function updateOrderItemPriceAction(
  orderId: number,
  itemId: number,
  totalPrice: number,
) {
  try {
    const response = await ordersService.updateOrderItemPrice(itemId, {
      total_price: totalPrice,
    });

    revalidatePath(`/merchant/orders/${orderId}`);
    revalidatePath('/merchant/orders');

    return { success: true, data: response.data };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Failed to update order item price:', error);
    return { success: false, error: 'Failed to update order item price' };
  }
}

export async function closeDayAction(): Promise<{
  success: boolean;
  message?: string;
  data?: CloseDayResponse;
}> {
  try {
    const response = await ordersService.closeDay();

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'Failed to close day',
      };
    }

    revalidatePath('/merchant');

    return {
      success: true,
      message: response.message,
      data: response.data,
    };
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Failed to close day:', error);
    return {
      success: false,
      message: 'Failed to close day',
    };
  }
}

export type CreateOrderState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: unknown;
};

export async function createOrderAction(
  tenantSlug: string,
  _prevState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const rawData = Object.fromEntries(formData.entries());

  const validatedFields = createOrderSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed, please check inputs.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { cart, order_request, ...customerData } = validatedFields.data;

  let items: Array<{
    product_id: number;
    quantity: string;
    name?: string;
    total_price?: number;
    selection_mode?: 'quantity' | 'weight' | 'price';
    selection_quantity?: number;
    selection_grams?: number;
    selection_amount_egp?: number;
    unit_option_id?: string;
  }> = [];
  if (cart) {
    try {
      const parsed = JSON.parse(cart) as Array<{
        product_id: number;
        quantity: string;
        name?: string;
        total_price?: number;
        selection_mode?: 'quantity' | 'weight' | 'price';
        selection_quantity?: number;
        selection_grams?: number;
        selection_amount_egp?: number;
        unit_option_id?: string;
      }>;

      items = parsed.filter(
        (item) => item.product_id && String(item.quantity || '').trim().length > 0,
      );
    } catch (e) {
      console.error('Failed to parse cart items:', e);
    }
  }

  const orderType = items.length > 0 ? OrderType.CATALOG : OrderType.FREE_TEXT;

  const payload: CreateOrderRequest = {
    customer: {
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
    },
    items,
    notes: customerData.notes,
    free_text_payload: order_request ? { text: order_request } : undefined,
    order_type: orderType,
  };

  try {
    const response = await ordersService.createPublicOrder(tenantSlug, payload);

    if (response.success) {
      if (response.data) {
        const createdOrder = response.data as {
          public_token?: unknown;
          created_at?: unknown;
        };
        const publicToken =
          typeof createdOrder.public_token === 'string'
            ? createdOrder.public_token.trim()
            : '';

        if (publicToken) {
          try {
            await appendTrackedOrderToCookie({
              token: publicToken,
              slug: tenantSlug,
              created_at:
                typeof createdOrder.created_at === 'string'
                  ? createdOrder.created_at
                  : new Date().toISOString(),
            });
          } catch (cookieError) {
            console.error('Failed to persist tracked order cookie:', cookieError);
          }
        }
      }

      try {
        await upsertCustomerProfileBySlugInCookie(tenantSlug, {
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          notes: customerData.notes,
        });
      } catch (cookieError) {
        console.error('Failed to persist customer profile cookie:', cookieError);
      }

      return {
        success: true,
        message: 'Order created successfully',
        data: response.data,
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to create order',
      errors: response.errors as Record<string, string[]> | undefined,
    };
  } catch (error: unknown) {
    console.error('Failed to create order:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create order. Please try again.',
    };
  }
}
