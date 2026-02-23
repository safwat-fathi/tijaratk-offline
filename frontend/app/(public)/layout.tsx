import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
		<>
			<div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-8">
				<div className="w-full max-w-3xl space-y-8">{children}</div>
			</div>
			<footer className="w-full border-t border-gray-200 bg-white flex items-center justify-center">
				<div className="flex items-center justify mx-auto max-w-7xl px-4 py-6 sm:px-6 gap-2 lg:px-8">
					<Image src="/logo.png" alt="Tijaratk" width={32} height={32} />
					<div className="flex justify-center md:order-2">
						<a href="#" className="text-gray-400 hover:text-gray-500">
							<span className="sr-only">فيسبوك</span>
							{/* SVG Icon */}
						</a>
					</div>

					<p className="text-center text-xs leading-5 text-gray-500">
						&copy; {new Date().getFullYear()} تجارتك. جميع الحقوق محفوظة.
					</p>
				</div>
			</footer>
		</>
	);
}
