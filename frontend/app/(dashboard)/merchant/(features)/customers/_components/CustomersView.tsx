"use client";

import { getCustomersPageAction } from "@/actions/customer-actions";
import { Customer } from "@/types/models/customer";
import { useCallback, useEffect, useRef, useState } from "react";
import CustomerHeader from "./CustomerHeader";
import CustomerSearch from "./CustomerSearch";
import CustomerCard from "./CustomerCard";
import CustomerDetailsSheet from "./CustomerDetailsSheet";
import { useDebouncedCallback } from "use-debounce";

interface CustomersViewProps {
	initialCustomers: Customer[];
	initialPage: number;
	initialLastPage: number;
	initialSearch?: string;
}

const DEFAULT_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 500;

export default function CustomersView({
	initialCustomers,
	initialPage,
	initialLastPage,
	initialSearch = "",
}: CustomersViewProps) {
	const safeInitialPage = Math.max(1, initialPage || 1);
	const safeInitialLastPage = Math.max(
		safeInitialPage,
		initialLastPage || safeInitialPage,
	);

	const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
	const [searchQuery, setSearchQuery] = useState(initialSearch);
	const [activeSearch, setActiveSearch] = useState(initialSearch);
	const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
		null,
	);

	const [page, setPage] = useState(safeInitialPage);
	const [hasMore, setHasMore] = useState(safeInitialPage < safeInitialLastPage);
	const [isLoading, setIsLoading] = useState(false);
	const [listError, setListError] = useState<string | null>(null);

	const observerTarget = useRef<HTMLDivElement | null>(null);
	const requestIdRef = useRef(0);

	const loadCustomers = useCallback(
		async ({
			pageNumber,
			search,
			reset,
		}: {
			pageNumber: number;
			search: string;
			reset: boolean;
		}) => {
			const requestId = ++requestIdRef.current;
			setIsLoading(true);
			setListError(null);

			const response = await getCustomersPageAction({
				search: search.trim() || undefined,
				page: pageNumber,
				limit: DEFAULT_LIMIT,
			});

			if (requestId !== requestIdRef.current) {
				return;
			}

			if (!response.success) {
				if (reset) {
					setCustomers([]);
					setPage(1);
				}

				setHasMore(false);
				setListError(response.message || "تعذر تحميل العملاء");
				setIsLoading(false);
				return;
			}

			const nextPage = Math.max(1, response.meta.page || pageNumber);
			const nextLastPage = Math.max(nextPage, response.meta.last_page || nextPage);

			setCustomers(previous =>
				reset ? response.data : [...previous, ...response.data],
			);
			setPage(nextPage);
			setHasMore(nextPage < nextLastPage);
			setIsLoading(false);
		},
		[],
	);

	const debouncedSearch = useDebouncedCallback((value: string) => {
		setActiveSearch(value);
		void loadCustomers({
			pageNumber: 1,
			search: value,
			reset: true,
		});
	}, SEARCH_DEBOUNCE_MS);

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		debouncedSearch(value);
	};

	useEffect(() => {
		return () => debouncedSearch.cancel();
	}, [debouncedSearch]);

	useEffect(() => {
		const target = observerTarget.current;
		if (!target || !hasMore) {
			return;
		}

		const observer = new IntersectionObserver(
			entries => {
				const entry = entries[0];
				if (!entry?.isIntersecting || isLoading || !hasMore) {
					return;
				}

				void loadCustomers({
					pageNumber: page + 1,
					search: activeSearch,
					reset: false,
				});
			},
			{ threshold: 1.0 },
		);

		observer.observe(target);
		return () => observer.disconnect();
	}, [activeSearch, hasMore, isLoading, loadCustomers, page]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CustomerHeader count={customers.length} />
      
      <div className="sticky top-[57px] z-10 bg-white shadow-sm pb-1">
        <CustomerSearch value={searchQuery} onChange={handleSearchChange} />
      </div>

			{listError && (
				<div className="bg-white px-4 py-2 text-sm text-red-600">{listError}</div>
			)}

      <div className="bg-gray-50 min-h-[calc(100vh-200px)]">
        {customers.length > 0 ? (
           <>
               {customers.map(customer => (
                 <div key={`${customer.id}-${customer.phone}`} onClick={() => setSelectedCustomerId(customer.id)} className="cursor-pointer">
                    <CustomerCard customer={customer} />
                 </div>
               ))}
               
               {/* Loader for infinite scroll */}
               {hasMore && (
                   <div ref={observerTarget} className="py-6 flex justify-center">
                        <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                   </div>
               )}
           </>
        ) : (
           !isLoading && (
               <div className="text-center py-12 px-4">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                 </div>
                 <p className="text-gray-900 font-medium">لا يوجد عملاء</p>
                 <p className="text-sm text-gray-500 mt-1">
										{listError ? "حدث خطأ أثناء تحميل البيانات." : "حاول تعديل البحث."}
									</p>
               </div>
           )
        )}
        
        {isLoading && customers.length === 0 && (
             <div className="py-12 flex justify-center">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             </div>
        )}
      </div>

      <CustomerDetailsSheet 
        key={selectedCustomerId ?? "customer-sheet"}
        customerId={selectedCustomerId} 
        onClose={() => setSelectedCustomerId(null)} 
      />
    </div>
  );
}
