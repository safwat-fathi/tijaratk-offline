"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, ActionState } from "@/actions/auth-server";

const initialState: ActionState = {
  success: false,
  message: "",
  errors: undefined,
};

export default function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-10">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Sign in
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Access your Tijaratk dashboard
        </p>
      </div>

      <form action={action} className="space-y-6">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <div className="mt-1">
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
            {state?.errors?.phone && (
              <p className="mt-2 text-sm text-red-600">{state.errors.phone[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
            {state?.errors?.password && (
              <p className="mt-2 text-sm text-red-600">{state.errors.password[0]}</p>
            )}
          </div>
        </div>

        {state?.message && !state.success && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{state.message}</h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              Don't have an account?{" "}
              <Link
                href="/merchant/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Register
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
