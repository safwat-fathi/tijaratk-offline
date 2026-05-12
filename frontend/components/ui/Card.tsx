import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CardProps = ComponentProps<"div">;

export const Card = ({ className, ...props }: CardProps) => (
	<div
		className={cn(
			"rounded-lg border border-(--brand-border) bg-card p-5 text-card-foreground shadow-soft",
			className,
		)}
		{...props}
	/>
);
