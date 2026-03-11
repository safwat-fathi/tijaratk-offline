import RegisterForm from "@/app/(dashboard)/merchant/(auth)/_components/auth/register-form";

export const metadata = {
	title: "إنشاء حساب تاجر",
	description: "ابدأ رحلتك مع تجارتك وقم بإنشاء حساب لمتجرك بكل سهولة لتصل لعملائك بشكل أفضل.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
