import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
	primary:
		"border-transparent bg-(--brand-primary) text-white shadow-soft hover:bg-(--brand-primary-hover) focus-visible:ring-(--brand-accent)/20",
	secondary:
		"border-transparent bg-(--brand-soft) text-(--brand-primary) hover:bg-(--brand-soft)/80 focus-visible:ring-(--brand-accent)/20",
	ghost:
		"border-transparent bg-transparent text-(--brand-primary) hover:bg-(--brand-soft) focus-visible:ring-(--brand-accent)/20",
	destructive:
		"border-transparent bg-(--status-error) text-white hover:bg-(--status-error)/90 focus-visible:ring-(--status-error)/20",
	outline:
		"border-(--brand-border) bg-white text-(--brand-text) hover:border-(--brand-accent) hover:bg-(--brand-soft)/60 focus-visible:ring-(--brand-accent)/20",
} as const;

const buttonSizes = {
	sm: "min-h-10 rounded-md px-3 py-2 text-sm",
	md: "min-h-11 rounded-md px-5 py-3 text-sm",
	lg: "min-h-12 rounded-md px-6 py-3.5 text-base",
	icon: "h-11 w-11 rounded-md p-0",
} as const;

type ButtonProps = ComponentProps<"button"> & {
	variant?: keyof typeof buttonVariants;
	size?: keyof typeof buttonSizes;
};

export const Button = ({
	className,
	variant = "primary",
	size = "md",
	type = "button",
	...props
}: ButtonProps) => (
	<button
		type={type}
		className={cn(
			"inline-flex items-center justify-center gap-2 border font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4",
			buttonVariants[variant],
			buttonSizes[size],
			className,
		)}
		{...props}
	/>
);
