import Badge from './Badge';
import { normalizeAnalysis } from '../utils/normalizeAnalysis';

function scoreColor(s) {
  if (s >= 80) return 'text-blue-600 dark:text-blue-400';
  if (s >= 50) return 'text-sky-500 dark:text-sky-400';
  return 'text-slate-500 dark:text-slate-400';
}

export default function ComparisonView({ compareList, onBack }) {
  const [v1, v2] = compareList.map(normalizeAnalysis);
  const diff = v2.match_score - v1.match_score;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-6 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Complete Comparison</h2>
        <button
          onClick={onBack}
          className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          ← Back to History
        </button>
      </div>

      {/* Score Diff Banner */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-3xl p-8 mb-6 text-center shadow-sm">
        <p className="text-xs font-semibold tracking-[0.1em] text-slate-400 uppercase mb-4">Score Difference</p>
        <div className="flex items-center justify-center gap-8">
          <span className="text-5xl font-black text-slate-300 dark:text-slate-700">{v1.match_score}%</span>
          <div className="flex flex-col items-center">
            <span className="text-slate-400 mb-1">→</span>
            {diff !== 0 && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${diff > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                {diff > 0 ? '+' : ''}{diff}%
              </span>
            )}
          </div>
          <span className={`text-5xl font-black ${scoreColor(v2.match_score)}`}>{v2.match_score}%</span>
        </div>
      </div>

      {/* Side-by-Side Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[v1, v2].map((item, idx) => (
          <div key={item.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col gap-6">

            {/* Card Header */}
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <Badge label={idx === 0 ? 'Older Version' : 'Newer Version'} variant={idx === 0 ? 'slate' : 'blue'} />
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3 truncate">{item.filename}</p>
              </div>
              <p className={`text-2xl font-black ${scoreColor(item.match_score)}`}>{item.match_score}%</p>
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Matched ({item.matched_skills?.length || 0})</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.matched_skills?.map((s, i) => <Badge key={`m-${i}`} label={s} variant="green" />)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Missing ({item.missing_skills?.length || 0})</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.missing_skills?.map((s, i) => {
                    const n = typeof s === 'object' ? s.skill : s;
                    return <Badge key={`u-${i}`} label={n} variant="red" />;
                  })}
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">Expert Feedback</p>
              <ul className="space-y-2">
                {item.ats_feedback?.length > 0
                  ? item.ats_feedback.map((fb, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                        <span className="text-blue-500 shrink-0">•</span>
                        <span>{fb}</span>
                      </li>
                    ))
                  : <li className="text-xs text-slate-400">No specific feedback recorded.</li>}
              </ul>
            </div>

            {/* Rewrites */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">Suggested Rewrites</p>
              <div className="flex flex-col gap-3">
                {item.rewritten_bullets?.length > 0
                  ? item.rewritten_bullets.map((b, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Original</p>
                        <p className="text-xs text-slate-500 line-through mb-3">{b.original}</p>
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Rewrite</p>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{b.rewritten}</p>
                      </div>
                    ))
                  : <p className="text-xs text-slate-400">No rewrites generated for this scan.</p>}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
