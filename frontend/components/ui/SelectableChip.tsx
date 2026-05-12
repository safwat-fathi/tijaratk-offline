import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SelectableChipProps = ComponentProps<"button"> & {
	isSelected?: boolean;
};

export const SelectableChip = ({
	isSelected = false,
	className,
	type = "button",
	...props
}: SelectableChipProps) => (
	<button
		type={type}
		className={cn(
			"inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--brand-accent)/20",
			isSelected
				? "border-(--brand-primary) bg-(--brand-soft) text-(--brand-primary)"
				: "border-(--brand-border) bg-white text-(--brand-text) hover:border-(--brand-accent) hover:bg-(--brand-soft)/50",
			className,
		)}
		{...props}
	/>
);
