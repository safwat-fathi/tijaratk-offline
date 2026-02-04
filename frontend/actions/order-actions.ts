"use server";

import { ordersService } from "@/services/api/orders.service";
import { OrderStatus, OrderType } from "@/types/enums";
import { revalidatePath } from "next/cache";
import { createOrderSchema } from "@/lib/validations/order";

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
	try {
		const response = await ordersService.updateOrder(orderId, { status });

		// Revalidate both the list and the details page
		revalidatePath("/merchant/orders");
		revalidatePath(`/merchant/orders/${orderId}`);

		return { success: true, data: response.data };
	} catch (error) {
		console.error("Failed to update order status:", error);
		return { success: false, error: "Failed to update order status" };
	}
}

export type CreateOrderState = {
	success: boolean;
	message: string;
	errors?: Record<string, string[]>;
	data?: any;
};

export async function createOrderAction(
	tenantSlug: string,
	prevState: CreateOrderState,
	formData: FormData,
): Promise<CreateOrderState> {
	const rawData = Object.fromEntries(formData.entries());

	// Validate fields
	const validatedFields = createOrderSchema.safeParse(rawData);

	if (!validatedFields.success) {
		return {
			success: false,
			message: "Validation failed, please check inputs.",
			errors: validatedFields.error.flatten().fieldErrors,
		};
	}

	const { cart, order_request, ...customerData } = validatedFields.data;

	// Parse cart items
	let items = [];
	if (cart) {
		try {
			items = JSON.parse(cart);
		} catch (e) {
			console.error("Failed to parse cart items:", e);
		}
	}

	// Construct payload
	// Adjust based on what backend expects. Usually needs items, customer info, etc.
	// Based on OrderForm, we have name, phone, address, notes, order_request
	// Determine order type
	const orderType = items.length > 0 ? OrderType.CATALOG : OrderType.FREE_TEXT;

	const payload = {
		customer: {
			name: customerData.name,
			phone: customerData.phone,
			address: customerData.address,
		},
		items: items,
		notes: customerData.notes,
		free_text_payload: order_request ? { text: order_request } : undefined,
		order_type: orderType,
	};

	try {
		const response = await ordersService.createPublicOrder(tenantSlug, payload);

		if (response.success) {
			return {
				success: true,
				message: "Order created successfully",
				data: response.data,
			};
		} else {
			return {
				success: false,
				message: response.message || "Failed to create order",
				errors: response.errors as Record<string, string[]> | undefined,
			};
		}
	} catch (error: any) {
		console.error("Failed to create order:", error);
		return {
			success: false,
			message: error.message || "Failed to create order. Please try again.",
		};
	}
}
