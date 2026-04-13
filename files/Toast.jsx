export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      className={`max-w-xl mx-auto mt-2 mb-4 px-4 py-3 rounded-xl backdrop-blur-md border text-sm font-medium flex items-center justify-between gap-3 shadow-sm transition-all duration-300 ${
        isError
          ? 'bg-rose-50/90 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
          : 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      }`}
    >
      <div className="flex items-center gap-3">
        {isError ? (
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {toast.message}
      </div>
      <button
        onClick={onDismiss}
        className={`hover:opacity-70 transition-colors ${
          isError
            ? 'text-rose-400 hover:text-rose-600 dark:hover:text-rose-300'
            : 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
