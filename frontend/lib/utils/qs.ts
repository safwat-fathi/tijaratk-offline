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

	Object.entries(params).forEach(([key, value]) => {

		if (Array.isArray(value)) {
			value.forEach(v => searchParams.append(key + "[]", String(v)));
		} else if (value !== undefined && value !== null) {
			searchParams.set(key, String(value));
		}
	});

	return searchParams;
}

export function revertParamsToObj(params: ReadonlyURLSearchParams): IParams {
  const obj = Object.fromEntries(params.entries()) as Record<string, string>;

  return obj;
}
