import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
	label: string;
	htmlFor: string;
	error?: string;
	children: ReactNode;
	className?: string;
};

export const Field = ({
	label,
	htmlFor,
	error,
	children,
	className,
}: FieldProps) => (
	<div className={className}>
		<label htmlFor={htmlFor} className="block text-sm font-semibold text-(--brand-text)">
			{label}
		</label>
		<div className="mt-1.5">{children}</div>
		{error ? <FieldError>{error}</FieldError> : null}
	</div>
);

export const FieldError = ({ children }: { children: ReactNode }) => (
	<p className="mt-2 text-sm font-medium text-(--status-error)" role="alert">
		{children}
	</p>
);

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
	<input
		className={cn(
			"block min-h-11 w-full rounded-md border border-(--brand-border) bg-white px-4 py-3 text-base text-(--brand-text) shadow-sm transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-(--brand-accent) focus:outline-none focus:ring-4 focus:ring-(--brand-accent)/15 disabled:cursor-not-allowed disabled:opacity-60",
			className,
		)}
		{...props}
	/>
);

export const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
	<textarea
		className={cn(
			"block min-h-28 w-full rounded-md border border-(--brand-border) bg-white px-4 py-3 text-base leading-7 text-(--brand-text) shadow-sm transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-(--brand-accent) focus:outline-none focus:ring-4 focus:ring-(--brand-accent)/15 disabled:cursor-not-allowed disabled:opacity-60",
			className,
		)}
		{...props}
	/>
);

export const Select = ({ className, ...props }: ComponentProps<"select">) => (
	<select
		className={cn(
			"block min-h-11 w-full rounded-md border border-(--brand-border) bg-white px-4 py-3 text-base text-(--brand-text) shadow-sm transition-[background-color,border-color,box-shadow] duration-200 focus:border-(--brand-accent) focus:outline-none focus:ring-4 focus:ring-(--brand-accent)/15 disabled:cursor-not-allowed disabled:opacity-60",
			className,
		)}
		{...props}
	/>
);
