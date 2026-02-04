import { clsx } from 'clsx';

type FilterType = 'all' | 'frequent' | 'new' | 'inactive';

interface CustomerFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
}

export default function CustomerFilters({ activeFilter, onFilterChange, counts }: CustomerFiltersProps) {
  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'frequent', label: 'Frequent' },
    { id: 'new', label: 'New' },
    { id: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm overflow-x-auto no-scrollbar pb-1">
       <div className="flex gap-2 px-4 py-2 min-w-max">
         {filters.map((filter) => (
           <button
             key={filter.id}
             onClick={() => onFilterChange(filter.id)}
             className={clsx(
               "px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border",
               activeFilter === filter.id
                 ? "bg-gray-900 text-white border-gray-900 shadow-sm scale-105"
                 : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
             )}
           >
             {filter.label} <span className={clsx("ml-1 opacity-80", activeFilter === filter.id ? "text-gray-300" : "text-gray-400")}>{counts[filter.id]}</span>
           </button>
         ))}
       </div>
    </div>
  );
}
