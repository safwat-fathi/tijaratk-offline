import { TENANT_CATEGORIES, type TenantCategory } from "@/constants";
import { Tenant } from "@/types/models/tenant";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";

type TenantCategoryMeta =
	(typeof TENANT_CATEGORIES)[keyof typeof TENANT_CATEGORIES];

export const resolveTenantCategoryMeta = (
	category: TenantCategory | null | undefined,
): TenantCategoryMeta => {
	switch (category) {
		case TENANT_CATEGORIES.GROCERY.value:
			return TENANT_CATEGORIES.GROCERY;
		case TENANT_CATEGORIES.GREENGROCER.value:
			return TENANT_CATEGORIES.GREENGROCER;
		case TENANT_CATEGORIES.BUTCHER.value:
			return TENANT_CATEGORIES.BUTCHER;
		case TENANT_CATEGORIES.BAKERY.value:
			return TENANT_CATEGORIES.BAKERY;
		case TENANT_CATEGORIES.PHARMACY.value:
			return TENANT_CATEGORIES.PHARMACY;
		default:
			return TENANT_CATEGORIES.OTHER;
	}
};

export default function StoreHeader({ tenant }: { tenant: Tenant }) {
	const categoryMeta = resolveTenantCategoryMeta(tenant.category);

	return (
		<div
			data-store-header
			className="sticky top-0 z-40 bg-linear-to-br from-indigo-600/80 to-violet-700/80 backdrop-blur-md border-b border-white/10 text-white shadow-md transition-all duration-300 rounded-bl-2xl rounded-br-2xl"
		>
			<div className="px-4 py-3 flex items-center justify-between">
				{/* Left: Branding */}
				<div className="flex items-center gap-3">
					<div className="bg-white/20 backdrop-blur-sm p-1 rounded-xl shadow-inner border border-white/10 shrink-0">
						<SafeImage
							src="/logo.png"
							alt={tenant.name}
							width={40}
							height={40}
							imageClassName="rounded-lg"
							fallback={<div className="h-10 w-10 rounded-lg bg-white/20" />}
						/>
					</div>
					<div className="flex flex-col min-w-0">
						<h1 className="text-lg font-bold tracking-tight leading-tight line-clamp-1">
							{tenant.name}
						</h1>
						<p className="text-xs text-white/80">{categoryMeta.labels.ar}</p>
					</div>
				</div>

				{/* Right: Actions */}
				<Link
					href="/track-orders"
					className="flex items-center justify-center p-2.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur transition active:scale-95"
					aria-label="تتبع طلباتي"
				>
					تتبع طلباتي
				</Link>
			</div>
		</div>
	);
}
