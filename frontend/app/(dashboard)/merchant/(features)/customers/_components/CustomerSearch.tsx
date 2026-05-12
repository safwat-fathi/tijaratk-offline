import { useRef } from "react";
import { Input } from "@/components/ui/Field";

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
    <div className="border-b border-brand-border bg-white px-4 py-2">
      <div className="relative">
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="text"
          className="ps-10 pe-10 text-sm"
          placeholder="مثال: أحمد أو 010…"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="مسح البحث"
            className="absolute inset-y-0 end-0 pe-3 text-muted-foreground transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/20"
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
