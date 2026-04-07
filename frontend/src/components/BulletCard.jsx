export default function BulletCard({ bullet, idx, copiedIndex, onCopy }) {
  const copied = copiedIndex === idx;

  return (
    <div className="group relative rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-blue-900/10 transition-all duration-300">
      {/* Original */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span> Original
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-through leading-relaxed">
          {bullet.original}
        </p>
      </div>

      {/* Rewrite */}
      <div className="p-5 bg-blue-50/30 dark:bg-blue-900/10">
        <span className="text-[10px] font-bold tracking-widest text-blue-500 uppercase mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> AI Rewrite
        </span>
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
          {bullet.rewritten}
        </p>

        <button
          onClick={() => onCopy(bullet.rewritten, idx)}
          className={`absolute bottom-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-200 shadow-sm ${
            copied
              ? 'bg-blue-500 text-white shadow-blue-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 focus:opacity-100'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
