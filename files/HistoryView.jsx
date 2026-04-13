function scoreColor(s) {
  if (s >= 80) return 'text-blue-600 dark:text-blue-400';
  if (s >= 50) return 'text-sky-500 dark:text-sky-400';
  return 'text-slate-500 dark:text-slate-400';
}
function scoreBg(s) {
  if (s >= 80) return 'bg-gradient-to-r from-blue-600 to-blue-400';
  if (s >= 50) return 'bg-gradient-to-r from-sky-500 to-sky-400';
  return 'bg-gradient-to-r from-slate-400 to-slate-300';
}

export default function HistoryView({ historyList, loading, compareList, onLoadItem, onDelete, onToggleCompare, onStartComparison }) {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analysis History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select exactly two documents to compare progression.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse">Loading history...</div>
      ) : historyList.length === 0 ? (
        <div className="text-center py-32 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-500">No scans available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
          {historyList.map(item => {
            const selected = compareList.some(c => c.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => onLoadItem(item)}
                className={`group relative rounded-2xl border p-5 cursor-pointer flex flex-col transition-all duration-200 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md ${
                  selected
                    ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={selected}
                    className="mt-1 w-4 h-4 cursor-pointer accent-blue-600 rounded border-slate-300"
                    onChange={(e) => onToggleCompare(item, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate" title={item.filename}>
                      {item.filename || 'Document'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-auto">
                  <span className={`text-2xl font-black tracking-tight ${scoreColor(item.match_score)}`}>
                    {item.match_score}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                  <div className={`h-1 rounded-full ${scoreBg(item.match_score)}`} style={{ width: `${item.match_score}%` }} />
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => onDelete(item.id, e)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Compare Floating Bar */}
      {compareList.length === 2 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 pl-6 pr-2 py-2 rounded-full shadow-2xl border border-slate-800 dark:border-slate-200">
          <span className="text-sm font-medium">2 items selected</span>
          <button
            onClick={onStartComparison}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2 rounded-full transition-colors"
          >
            Compare Output
          </button>
        </div>
      )}
    </div>
  );
}
