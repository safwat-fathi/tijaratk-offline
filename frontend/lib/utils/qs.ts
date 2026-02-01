import { ReadonlyURLSearchParams } from "next/navigation";

import { IParams } from "@/types/services/base";

export const createQueryString = (
  name: string,
  value: string,
  searchParams: ReadonlyURLSearchParams,
) => {
  const params = new URLSearchParams(searchParams);

  params.set(name, value);

  return params.toString();
};

export function createParams(params: IParams): URLSearchParams {
	const searchParams = new URLSearchParams();

	if (!params) return searchParams;

	// Use Object.keys to avoid iterating over prototype properties
	Object.keys(params).forEach(key => {
		const value = params[key];

		if (Array.isArray(value)) {
			value.forEach(v => searchParams.append(key + "[]", String(v)));
		} else if (value !== undefined && value !== null) {
			searchParams.set(key, String(value));
		}
	});

	return searchParams;
}

export function revertParamsToObj(params: ReadonlyURLSearchParams): IParams {
  const obj = [...params?.entries()].reduce(
    (acc, [key, value]) => {
      acc[key] = value;

      return acc;
    },
    {} as Record<string, string>,
  );

  return obj;
}
