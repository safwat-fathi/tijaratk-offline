import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-brand-text">404 - الصفحة غير موجودة</h1>
      <p className="mb-6 text-muted-foreground">عفواً، الصفحة التي تبحث عنها غير موجودة.</p>
      <Link href="/" className="text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20">
        العودة للصفحة الرئيسية
      </Link>
    </div>
  );
}
