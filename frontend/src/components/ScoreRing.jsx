function scoreColor(s) {
  if (s >= 80) return 'text-blue-600 dark:text-blue-400';
  if (s >= 50) return 'text-sky-500 dark:text-sky-400';
  return 'text-slate-500 dark:text-slate-400';
}

export default function ScoreRing({ score }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const getGradientId = (s) => {
    if (s >= 80) return 'grad-high';
    if (s >= 50) return 'grad-med';
    return 'grad-low';
  };

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-sm">
        <defs>
          <linearGradient id="grad-high" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="grad-med" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="grad-low" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="currentColor" strokeWidth="6"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={`url(#${getGradientId(score)})`}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black tracking-tighter ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Score</span>
      </div>
    </div>
  );
}
