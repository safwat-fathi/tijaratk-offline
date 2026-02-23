import { useRef } from "react";

interface CustomerSearchProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

export default function CustomerSearch({
  value,
  onChange,
  onClear,
}: CustomerSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white px-4 py-2 border-b border-gray-100">
      <div className="relative">
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="text"
          className="block w-full ps-10 pe-10 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          placeholder="بحث بالاسم، الهاتف، أو الكود"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="مسح البحث"
            className="absolute inset-y-0 end-0 pe-3 text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
