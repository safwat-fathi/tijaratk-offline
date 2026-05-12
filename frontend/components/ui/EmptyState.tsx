import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
	title: string;
	description?: string;
	icon?: ReactNode;
	className?: string;
};

export const EmptyState = ({
	title,
	description,
	icon,
	className,
}: EmptyStateProps) => (
	<div className={cn("px-4 py-12 text-center", className)}>
		{icon ? (
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-(--brand-soft) text-(--brand-primary)">
				{icon}
			</div>
		) : null}
		<p className="font-semibold text-(--brand-text)">{title}</p>
		{description ? (
			<p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
		) : null}
	</div>
);
