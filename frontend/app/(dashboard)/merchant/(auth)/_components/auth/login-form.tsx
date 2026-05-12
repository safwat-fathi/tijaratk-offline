"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, ActionState } from "@/actions/auth-server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";

const initialState: ActionState = {
  success: false,
  message: "",
  errors: undefined,
};

export default function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initialState);

	return (
		<Card className="w-full max-w-md px-6 py-8 sm:px-10">
			<div className="mb-6 flex flex-col items-center text-center">
				<Logo variant="icon" width={72} height={72} className="mb-4 rounded-xl" />
				<h2 className="text-3xl font-bold tracking-tight text-brand-text">
					تسجيل الدخول
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">الدخول إلى لوحة التحكم</p>
			</div>

			<form action={action} className="space-y-6">
				<Field
					label="رقم الهاتف"
					htmlFor="phone"
					error={state?.errors?.phone?.[0]}
				>
					<Input
						id="phone"
						name="phone"
						type="tel"
						inputMode="tel"
						autoComplete="tel"
						required
					/>
				</Field>

				<Field
					label="كلمة المرور"
					htmlFor="password"
					error={state?.errors?.password?.[0]}
				>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
					/>
				</Field>

				{state?.message && !state.success && (
					<div className="rounded-md border border-status-error/20 bg-status-error/10 p-4">
						<div className="flex">
							<div className="ml-3">
								<h3 className="text-sm font-medium text-status-error">
									{state.message}
								</h3>
							</div>
						</div>
					</div>
				)}

				<Button type="submit" disabled={isPending} className="w-full">
					{isPending ? "جاري الدخول…" : "دخول"}
				</Button>
			</form>

			<div className="mt-6">
				<div className="relative">
					<div className="relative flex justify-center text-sm">
						<span className="bg-white px-2 text-muted-foreground">
							ليس لديك حساب؟{" "}
							<Link
								href="/merchant/register"
								className="font-medium text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
							>
								إنشاء حساب
							</Link>
						</span>
					</div>
				</div>
			</div>
		</Card>
	);
}
