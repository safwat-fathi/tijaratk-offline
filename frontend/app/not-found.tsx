import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - الصفحة غير موجودة</h1>
      <p className="text-gray-600 mb-6">عفواً، الصفحة التي تبحث عنها غير موجودة.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        العودة للصفحة الرئيسية
      </Link>
    </div>
  );
}
