interface CustomerSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export default function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  return (
    <div className="bg-white px-4 py-2 border-b border-gray-100">
      <div className="relative">
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric" // Helps on mobile to bring up numeric keyboard first if needed, but 'text' is safer for general search. The doc said "Must support numeric keypad". Maybe inputMode="text" is fine as usually phones show numbers on top. Or inputMode="tel" but that suppresses letters sometimes. Let's use text.
          className="block w-full ps-10 pe-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          placeholder="بحث بالاسم، الهاتف، أو الكود"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
