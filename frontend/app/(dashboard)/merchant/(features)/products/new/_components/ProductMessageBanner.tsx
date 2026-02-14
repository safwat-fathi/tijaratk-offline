type ProductMessageBannerProps = {
  message: string;
  isDuplicateWarning: boolean;
};

export default function ProductMessageBanner({
  message,
  isDuplicateWarning,
}: ProductMessageBannerProps) {
  return (
    <p
      aria-live="polite"
      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
        isDuplicateWarning
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-indigo-200 bg-indigo-50 text-indigo-700'
      }`}
    >
      {message}
    </p>
  );
}
