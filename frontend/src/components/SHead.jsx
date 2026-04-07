export default function SHead({ icon, title, count }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm text-blue-500 dark:text-blue-400 text-sm">
        {icon}
      </div>
      <h3 className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200">{title}</h3>
      {count !== undefined && (
        <span className="ml-auto text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}
