"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import {
  updateDeliverySettingsAction,
  type UpdateDeliverySettingsState,
} from "@/actions/tenant-actions";
import type { Tenant } from "@/types/models/tenant";

const initialState: UpdateDeliverySettingsState = {
  success: false,
  message: "",
};

const DELIVERY_FEE_PRESETS = [0, 10, 15, 20] as const;

type DeliverySettingsFormProps = {
  tenant: Tenant;
};

export default function DeliverySettingsForm({ tenant }: DeliverySettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateDeliverySettingsAction,
    initialState,
  );
  const deliveryFeeInputRef = useRef<HTMLInputElement | null>(null);

  const deliveryFee = Number(tenant.delivery_fee || 0);
  const deliveryAvailable = tenant.delivery_available !== false;

  return (
    <form action={formAction} className="space-y-5 pb-28 lg:pb-0">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-brand-border bg-brand-soft/60 px-5 py-4">
          <p className="text-sm font-semibold text-brand-primary">إعدادات التوصيل</p>
          <h1 className="mt-1 text-2xl font-bold text-brand-text text-pretty">
            تحكم في رسوم التوصيل وحالة استقبال الطلبات
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            سيتم تطبيق هذه الإعدادات تلقائياً على كل طلب جديد من متجرك.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <Field
            label="رسوم التوصيل"
            htmlFor="delivery_fee"
            error={state.errors?.delivery_fee?.[0]}
          >
            <div className="relative">
              <Input
                id="delivery_fee"
                name="delivery_fee"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                autoComplete="off"
                ref={deliveryFeeInputRef}
                defaultValue={Number.isFinite(deliveryFee) ? deliveryFee : 0}
                className="pe-16 text-lg font-bold tabular-nums"
                required
              />
              <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm font-semibold text-muted-foreground">
                جنيه
              </span>
            </div>
          </Field>

          <div className="grid grid-cols-4 gap-2" aria-label="اختيارات سريعة لرسوم التوصيل">
            {DELIVERY_FEE_PRESETS.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  if (deliveryFeeInputRef.current) {
                    deliveryFeeInputRef.current.value = String(value);
                  }
                }}
                className="min-h-11 rounded-md border border-brand-border bg-white px-3 py-2 text-sm font-bold text-brand-text transition-[background-color,border-color,color,box-shadow] hover:border-brand-accent hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
              >
                {value}
              </button>
            ))}
          </div>

          <fieldset className="rounded-lg border border-brand-border bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-brand-text">
              حالة التوصيل
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-brand-border px-3 text-sm font-bold text-brand-text transition-[background-color,border-color,box-shadow] focus-within:ring-4 focus-within:ring-brand-accent/20 has-[:checked]:border-brand-primary has-[:checked]:bg-brand-soft has-[:checked]:text-brand-primary">
                <input
                  type="radio"
                  name="delivery_available"
                  value="true"
                  defaultChecked={deliveryAvailable}
                  className="sr-only"
                />
                متاح
              </label>
              <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-brand-border px-3 text-sm font-bold text-brand-text transition-[background-color,border-color,box-shadow] focus-within:ring-4 focus-within:ring-brand-accent/20 has-[:checked]:border-status-error has-[:checked]:bg-status-error/10 has-[:checked]:text-status-error">
                <input
                  type="radio"
                  name="delivery_available"
                  value="false"
                  defaultChecked={!deliveryAvailable}
                  className="sr-only"
                />
                غير متاح
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              عند إيقاف التوصيل، لن يتمكن العملاء من إرسال طلبات جديدة من صفحة المتجر.
            </p>
          </fieldset>

          <Field
            label="الوقت المتاح للتوصيل"
            htmlFor="delivery_time_window"
            error={state.errors?.delivery_time_window?.[0]}
          >
            <Input
              id="delivery_time_window"
              name="delivery_time_window"
              type="text"
              maxLength={64}
              autoComplete="off"
              placeholder="مثال: 2-4 مساءً…"
              defaultValue={tenant.delivery_time_window || ""}
            />
          </Field>
        </div>
      </Card>

      {state.message ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
            state.success
              ? "border-status-success/20 bg-status-success/10 text-status-success"
              : "border-status-error/20 bg-status-error/10 text-status-error"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 shadow-float backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mx-auto flex max-w-md gap-2 lg:mx-0 lg:max-w-none lg:justify-end">
          <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={isPending}>
            {isPending ? "جاري الحفظ…" : "حفظ إعدادات التوصيل"}
          </Button>
        </div>
      </div>
    </form>
  );
}
