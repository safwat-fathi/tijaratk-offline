import LoginForm from "@/app/(dashboard)/merchant/(auth)/_components/auth/login-form";

export const metadata = {
	title: "تسجيل دخول التاجر",
	description: "قم بتسجيل الدخول إلى حساب التاجر الخاص بك لإدارة متجرك والبدء في تلقي الطلبات.",
};

export default function LoginPage() {
  return <LoginForm />;
}
