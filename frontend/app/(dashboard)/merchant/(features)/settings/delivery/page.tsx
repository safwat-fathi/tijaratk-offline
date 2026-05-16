import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { tenantsService } from "@/services/api/tenants.service";
import DeliverySettingsForm from "./_components/DeliverySettingsForm";

export const metadata = {
  title: "إعدادات التوصيل",
  description: "تحديث رسوم التوصيل وحالة استقبال طلبات التوصيل.",
};

export default async function DeliverySettingsPage() {
  const tenantResponse = await tenantsService.getMyTenant();

  if (!tenantResponse.success || !tenantResponse.data) {
    return (
      <div className="mx-auto max-w-2xl pb-8">
        <Card className="space-y-4 bg-white">
          <div>
            <p className="text-sm font-semibold text-status-error">
              تعذر تحميل إعدادات التوصيل
            </p>
            <h1 className="mt-1 text-2xl font-bold text-brand-text text-pretty">
              لم نتمكن من جلب بيانات المتجر حالياً
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {tenantResponse.message ||
                "تأكد من تشغيل الخادم وتطبيق تحديثات قاعدة البيانات ثم حاول مرة أخرى."}
            </p>
          </div>

          <Link
            href="/merchant"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand-border bg-white px-4 py-3 text-sm font-bold text-brand-text transition-[background-color,border-color,box-shadow] hover:border-brand-accent hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20 sm:w-auto"
          >
            العودة للوحة التحكم
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-8">
      <DeliverySettingsForm tenant={tenantResponse.data} />
    </div>
  );
}
