"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth-server";
import { TENANT_CATEGORIES, TENANT_CATEGORY_VALUES } from "@/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";

const initialState = {
  success: false,
  message: "",
  errors: undefined,
};

const CATEGORY_OPTIONS = TENANT_CATEGORY_VALUES.map(value => {
	const label =
		Object.values(TENANT_CATEGORIES).find(item => item.value === value)?.labels
			.ar || value;

	return { value, label };
});

export default function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState);

	return (
		<Card className="w-full max-w-md px-6 py-8 sm:px-10">
			<div className="mb-6 flex flex-col items-center text-center">
				<Logo variant="icon" width={72} height={72} className="mb-4 rounded-xl" />
				<h2 className="text-3xl font-bold tracking-tight text-brand-text">
					إنشاء حساب
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">ابدأ متجرك مع تجارتك</p>
			</div>

			<form action={action} className="space-y-6">
				<Field label="اسم المتجر" htmlFor="storeName" error={state?.errors?.storeName?.[0]}>
					<Input id="storeName" name="storeName" type="text" autoComplete="organization" required />
				</Field>

				<Field label="نشاط المتجر" htmlFor="category" error={state?.errors?.category?.[0]}>
						<Select
							id="category"
							name="category"
							defaultValue={TENANT_CATEGORIES.OTHER.value}
						>
							{CATEGORY_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
				</Field>

				<Field label="الاسم" htmlFor="name" error={state?.errors?.name?.[0]}>
					<Input id="name" name="name" type="text" autoComplete="name" required />
				</Field>

				<Field label="رقم الهاتف" htmlFor="phone" error={state?.errors?.phone?.[0]}>
					<Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
				</Field>

				<Field label="كلمة المرور" htmlFor="password" error={state?.errors?.password?.[0]}>
					<Input id="password" name="password" type="password" autoComplete="new-password" required />
				</Field>

				<Field label="تأكيد كلمة المرور" htmlFor="confirmPassword" error={state?.errors?.confirmPassword?.[0]}>
					<Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
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
					{isPending ? "جاري الإنشاء…" : "إنشاء حساب"}
				</Button>
			</form>

			<div className="mt-6">
				<div className="relative">
					<div className="relative flex justify-center text-sm">
						<span className="bg-white px-2 text-muted-foreground">
							لديك حساب بالفعل؟{" "}
							<Link
								href="/merchant/login"
								className="font-medium text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
							>
								تسجيل الدخول
							</Link>
						</span>
					</div>
				</div>
			</div>
		</Card>
	);
}
