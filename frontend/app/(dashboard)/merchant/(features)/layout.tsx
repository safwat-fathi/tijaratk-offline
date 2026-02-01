"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { logoutAction } from "@/actions/auth-server";

const navigation = [
	{
		name: "Dashboard",
		href: "/merchant",
		icon: (
			<svg
				className="mr-3 h-6 w-6 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth="1.5"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
				/>
			</svg>
		),
	},
	{
		name: "Orders",
		href: "/merchant/orders",
		icon: (
			<svg
				className="mr-3 h-6 w-6 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth="1.5"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
				/>
			</svg>
		),
	},
	{
		name: "Customers",
		href: "/merchant/customers",
		icon: (
			<svg
				className="mr-3 h-6 w-6 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth="1.5"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
				/>
			</svg>
		),
	},
	{
		name: "Logout",
		href: "/logout",
		icon: (
			<svg
				className="mr-3 h-6 w-6 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth="1.5"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
				/>
			</svg>
		),
	},
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  

  return (
    <div>
      {/* Mobile sidebar placeholder/trigger */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Dashboard</div>
        <Link href="#">
          <span className="sr-only">Your profile</span>
          <Image
            className="h-8 w-8 rounded-full bg-gray-50"
            src="/logo-no-bg.png"
            alt=""
            width={32}
            height={32}
          />
        </Link>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
             <Image
                className="h-8 w-auto"
                src="/logo-no-bg.png"
                alt="Tijaratk"
                width={150}
                height={40}
              />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {item.href === '/logout' ? (
                        <form action={logoutAction}>
                          <button
                            type="submit"
                            className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                          >
                            {item.icon}
                            {item.name}
                          </button>
                        </form>
                      ) : (
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                            ${(item.href !== '/logout' && pathname.startsWith(item.href) && item.href !== '/merchant' && pathname !== '/merchant') || (item.href === '/merchant' && pathname === '/merchant')
                              ? 'bg-gray-50 text-indigo-600'
                              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                            }
                          `}
                        >
                          {/* Icon implementation */}
                          {item.icon}
                          {item.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">
            {children}
        </div>
      </main>
      
       {/* Mobile Sidebar Overlay (Simple implementation) */}
       {sidebarOpen && (
        <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-0 flex">
                <div className="relative mr-16 flex w-full max-w-xs flex-1">
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                        <button type="button" className="-m-2.5 p-2.5 text-white" onClick={() => setSidebarOpen(false)}>
                            <span className="sr-only">Close sidebar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                         <div className="flex h-16 shrink-0 items-center">
                            <Image
                                className="h-8 w-auto"
                                src="/logo-no-bg.png"
                                alt="Tijaratk"
                                width={120}
                                height={32}
                            />
                        </div>
                        <nav className="flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {navigation.map((item) => (
                                            <li key={item.name}>
                                                {item.href === '/logout' ? (
                                                  <form action={logoutAction}>
                                                    <button
                                                      type="submit"
                                                      className="group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                                                    >
                                                      {item.icon}
                                                      {item.name}
                                                    </button>
                                                  </form>
                                                ) : (
                                                  <Link
                                                      href={item.href}
                                                      onClick={() => setSidebarOpen(false)}
                                                      className={`
                                                        group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                                        ${(item.href === '/merchant' && pathname === '/merchant') 
                                                          ? 'bg-gray-50 text-indigo-600' 
                                                          : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                                                        }
                                                      `}
                                                  >
                                                       {item.icon}
                                                      {item.name}
                                                  </Link>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
       )}

    </div>
  );
}
