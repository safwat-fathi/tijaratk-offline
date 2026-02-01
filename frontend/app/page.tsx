import Link from "next/link";

export default function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-white">
			<div className="text-center">
				<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
					Tijaratk
				</h1>
				<p className="mt-6 text-lg leading-8 text-gray-600">
					Your offline store, online.
				</p>
				<div className="mt-10 flex items-center justify-center gap-x-6">
					<Link
						href="/merchant/login"
						className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
					>
						Get started
					</Link>
					<Link
						href="/about"
						className="text-sm font-semibold leading-6 text-gray-900"
					>
						Learn more <span aria-hidden="true">→</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
