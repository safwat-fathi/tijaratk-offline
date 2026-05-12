import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
	label: string;
	children: ReactNode;
	variant?: "primary" | "secondary" | "ghost" | "outline";
};

const iconButtonVariants = {
	primary: "bg-(--brand-primary) text-white hover:bg-(--brand-primary-hover)",
	secondary: "bg-(--brand-soft) text-(--brand-primary) hover:bg-(--brand-soft)/80",
	ghost: "bg-transparent text-(--brand-primary) hover:bg-(--brand-soft)",
	outline: "border border-(--brand-border) bg-white text-(--brand-text) hover:bg-(--brand-soft)/60",
} as const;

export const IconButton = ({
	label,
	children,
	className,
	variant = "ghost",
	type = "button",
	...props
}: IconButtonProps) => (
	<button
		type={type}
		aria-label={label}
		className={cn(
			"inline-flex h-11 w-11 items-center justify-center rounded-md transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--brand-accent)/20",
			iconButtonVariants[variant],
			className,
		)}
		{...props}
	>
		{children}
	</button>
);
