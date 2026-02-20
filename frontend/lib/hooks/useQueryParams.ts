"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";

type Parser<T> = {
  parse: (value: string | null) => T;
  serialize: (value: T) => string;
  default: T;
};

type Schema<TSchema extends Record<string, unknown>> = {
	[K in keyof TSchema]: Parser<TSchema[K]>;
};

type Options<TSchema extends Record<string, unknown>> = {
	defaultValues: Partial<TSchema>;
	schema: Schema<TSchema>;
	pushMode?: "push" | "replace";
	refreshOnChange?: boolean;
	debounce?: number;
};

export function useQueryParams<TSchema extends Record<string, unknown>>(
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
	const parserByKey = useMemo(() => {
		const entries = Object.entries(schema) as Array<[keyof TSchema, Parser<unknown>]>;
		return new Map<keyof TSchema, Parser<unknown>>(entries);
	}, [schema]);
	const defaultValuesByKey = useMemo(() => {
		const entries = Object.entries(defaultValues) as Array<[keyof TSchema, unknown]>;
		return new Map<keyof TSchema, unknown>(entries);
	}, [defaultValues]);

	const params = useMemo(() => {
		const parsedEntries: Array<[keyof TSchema, unknown]> = [];

		keys.forEach(key => {
			const parser = parserByKey.get(key);
			if (!parser) {
				return;
			}

			const raw = searchParams?.get(key as string) ?? null;
			const fallbackValue = defaultValuesByKey.has(key)
				? defaultValuesByKey.get(key)
				: parser.default;

			const parsedValue = raw ? parser.parse(raw) : fallbackValue;
			parsedEntries.push([key, parsedValue]);
		});

		return Object.fromEntries(parsedEntries) as TSchema;
	}, [searchParams, keys, parserByKey, defaultValuesByKey]);

	const timer = useRef<NodeJS.Timeout | null>(null);

	const updateParams = useCallback(
		(newParams: Partial<TSchema>) => {
			const sp = new URLSearchParams(searchParams?.toString());

			Object.entries(newParams).forEach(([rawKey, value]) => {
				const key = rawKey as keyof TSchema;
				const parser = parserByKey.get(key);
				if (!parser) {
					return;
				}

				if (
					value == null ||
					value === "" ||
					value === (parser.default as TSchema[keyof TSchema])
				) {
					sp.delete(rawKey);
					return;
				}

				sp.set(rawKey, parser.serialize(value));
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
			parserByKey,
		]
	);

	const setParam = useCallback(
		(key: keyof TSchema, value: TSchema[keyof TSchema]) => {
			const partialParams = Object.fromEntries([
				[key as string, value],
			]) as Partial<TSchema>;
			updateParams(partialParams);
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
