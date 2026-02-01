"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";

type Parser<T> = {
  parse: (value: string | null) => T;
  serialize: (value: T) => string;
  default: T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Options<TSchema> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	defaultValues: Partial<Record<keyof TSchema, any>>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	schema: Record<keyof TSchema, Parser<any>>;
	pushMode?: "push" | "replace";
	refreshOnChange?: boolean;
	debounce?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useQueryParams<TSchema extends Record<string, any>>(
	keys: (keyof TSchema)[],
	{
		defaultValues,
		schema,
		pushMode = "replace",
		refreshOnChange = true,
		debounce = 0,
	}: Options<TSchema>
) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// parse current params
	const params = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const parsed: any = {};

		keys.forEach(key => {
			const parser = schema[key];
			const raw = searchParams?.get(key as string) ?? null;

			parsed[key] = raw
				? parser.parse(raw)
				: defaultValues[key] ?? parser.default;
		});

		return parsed as TSchema;
	}, [searchParams, keys, schema, defaultValues]);

	// debounce timer ref
	const timer = useRef<NodeJS.Timeout | null>(null);

	const updateParams = useCallback(
		(newParams: Partial<TSchema>) => {
			const sp = new URLSearchParams(searchParams?.toString());

			// merge updates
			Object.entries(newParams).forEach(([k, v]) => {
				if (v == null || v === "" || v === (schema[k]?.default ?? "")) {
					sp.delete(k);
				} else {
					sp.set(k, schema[k].serialize(v));
				}
			});

			const url = `${pathname}?${sp.toString()}`;
			const action = pushMode === "push" ? router.push : router.replace;

			if (debounce > 0) {
				if (timer.current) clearTimeout(timer.current);
				timer.current = setTimeout(() => {
					action(url);
					if (refreshOnChange) router.refresh();
				}, debounce);
			} else {
				action(url);
				if (refreshOnChange) router.refresh();
			}
		},
		[
			router,
			pathname,
			searchParams,
			pushMode,
			refreshOnChange,
			debounce,
			schema,
		]
	);

	const setParam = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(key: keyof TSchema, value: any) => {
			updateParams({ [key]: value } as Partial<TSchema>);
		},
		[updateParams]
	);

	const setParams = useCallback(
		(newParams: Partial<TSchema>) => {
			updateParams(newParams);
		},
		[updateParams]
	);

	return { params, setParam, setParams };
}
