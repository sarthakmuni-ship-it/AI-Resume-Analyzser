export default function Badge({ label, variant }) {
  let cls = '';

  if (variant === 'green') {
    cls = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20';
  } else if (variant === 'red') {
    cls = 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20';
  } else if (variant === 'blue') {
    cls = 'bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-500/20';
  } else {
    cls = 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/50';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border transition-colors ${cls}`}>
      {label}
    </span>
  );
}
