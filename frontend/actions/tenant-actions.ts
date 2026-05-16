"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tenantsService } from "@/services/api/tenants.service";

export type UpdateDeliverySettingsState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

const updateDeliverySettingsSchema = z.object({
  delivery_fee: z.coerce
    .number({ error: "أدخل قيمة رقمية صحيحة" })
    .min(0, "رسوم التوصيل لا يمكن أن تكون أقل من صفر"),
  delivery_available: z.enum(["true", "false"]).transform(value => value === "true"),
  delivery_time_window: z
    .string()
    .trim()
    .max(64, "نافذة التوصيل يجب ألا تزيد عن 64 حرف")
    .optional()
    .transform(value => value || undefined),
});

export async function updateDeliverySettingsAction(
  _prevState: UpdateDeliverySettingsState,
  formData: FormData,
): Promise<UpdateDeliverySettingsState> {
  const validatedFields = updateDeliverySettingsSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!validatedFields.success) {
    return {
      success: false,
      message: "راجع بيانات التوصيل قبل الحفظ.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const response = await tenantsService.updateMyDeliverySettings(validatedFields.data);

  if (!response.success) {
    return {
      success: false,
      message: response.message || "تعذر حفظ إعدادات التوصيل. حاول مرة أخرى.",
    };
  }

  const tenantSlug = response.data?.slug;
  revalidatePath("/merchant");
  revalidatePath("/merchant/settings/delivery");
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}`);
  }

  return {
    success: true,
    message: "تم حفظ إعدادات التوصيل بنجاح.",
  };
}
