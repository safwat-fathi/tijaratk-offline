import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/currency";
import type { Tenant } from "@/types/models/tenant";

type DeliverySettingsCardProps = {
  tenant?: Tenant;
};

export default function DeliverySettingsCard({ tenant }: DeliverySettingsCardProps) {
  const deliveryAvailable = tenant?.delivery_available !== false;
  const deliveryFee = formatCurrency(tenant?.delivery_fee ?? 0) ?? "غير محدد";
  const deliveryTimeWindow = tenant?.delivery_time_window?.trim() || "لم يتم تحديد موعد";

  return (
    <Card className="relative overflow-hidden bg-white p-0">
      <div className="pointer-events-none absolute -top-10 end-0 h-28 w-28 rounded-full bg-brand-primary/10 blur-2xl" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-primary">التوصيل</p>
            <h2 className="mt-1 text-xl font-bold text-brand-text text-pretty">
              رسوم التوصيل الحالية
            </h2>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              deliveryAvailable
                ? "bg-status-success/10 text-status-success"
                : "bg-status-error/10 text-status-error"
            }`}
          >
            {deliveryAvailable ? "متاح" : "متوقف"}
          </span>
        </div>

        <div className="rounded-lg border border-brand-border bg-brand-soft/40 p-4">
          <p className="text-3xl font-black tabular-nums text-brand-text">
            {deliveryFee}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            تُضاف تلقائياً على كل طلب جديد. الموعد المتوقع: {deliveryTimeWindow}
          </p>
        </div>

        <Link
          href="/merchant/settings/delivery"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-primary px-4 py-3 text-sm font-bold text-white transition-[background-color,box-shadow,transform] hover:bg-brand-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20 sm:w-auto"
        >
          تعديل إعدادات التوصيل
        </Link>
      </div>
    </Card>
  );
}
