import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function LandingPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="flex max-w-xl flex-col items-center rounded-xl border border-brand-border/80 bg-white p-8 text-center shadow-soft">
				<Logo variant="icon" width={96} height={96} className="rounded-xl" />
				<h1 className="mt-5 text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">
					تجارتك
				</h1>
				<p className="mt-4 text-lg leading-8 text-muted-foreground">
					تجارتك أسهل. تجارتك أونلاين.
				</p>
				<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<Link
						href="/merchant/login"
						className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
					>
						ابدأ الآن
					</Link>
					<Link
						href="/about"
						className="inline-flex min-h-11 items-center justify-center rounded-md px-4 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
					>
						اعرف المزيد <span aria-hidden="true">←</span>
					</Link>
				</div>
			</div>
		</main>
	);
}
