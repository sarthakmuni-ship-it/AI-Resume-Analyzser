import { useState } from 'react';
import ScoreRing from './ScoreRing';
import Badge from './Badge';
import SHead from './SHead';
import BulletCard from './BulletCard';

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
function scoreLabel(s) {
  if (s >= 80) return 'Strong match — you are in great shape!';
  if (s >= 50) return 'Moderate match — a few gaps to close.';
  return 'Needs work — key keywords are missing.';
}

export default function ReportView({ analysisData, pdfUrl, onDownload }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={`grid grid-cols-1 ${pdfUrl ? 'lg:grid-cols-2 max-w-[1400px]' : 'max-w-4xl'} gap-6 h-[calc(100vh-110px)] mx-auto mt-2`}>

      {/* PDF Preview — only if we have a URL */}
      {pdfUrl && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-sm flex flex-col overflow-hidden hidden lg:flex">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Original Document
            </span>
          </div>
          <div className="flex-1 bg-slate-100/30 dark:bg-slate-950/50 relative">
            <iframe src={pdfUrl} title="Résumé" className="w-full h-full border-0 absolute inset-0 mix-blend-multiply dark:mix-blend-normal" />
          </div>
        </div>
      )}

      {/* Analysis Report Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col overflow-hidden">

        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 shrink-0 flex justify-between items-center z-10">
          <span className="text-xs font-bold tracking-wide text-slate-800 dark:text-slate-200">Analysis Report</span>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* Score Block */}
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
            <ScoreRing score={analysisData.match_score} />
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">ATS Compatibility</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Based on job description parsing</p>
              <div className="w-full bg-slate-200/60 dark:bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${scoreBg(analysisData.match_score)}`}
                  style={{ width: `${Math.min(100, Math.max(0, analysisData.match_score))}%` }}
                />
              </div>
              <p className={`text-xs font-semibold ${scoreColor(analysisData.match_score)}`}>
                {scoreLabel(analysisData.match_score)}
              </p>
            </div>
          </div>

          {/* Keywords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Matched */}
            <div>
              <SHead
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                title="Matched Keywords"
                count={analysisData.matched_skills?.length || 0}
              />
              <div className="flex flex-wrap gap-2">
                {analysisData.matched_skills?.length > 0
                  ? analysisData.matched_skills.map((s, i) => <Badge key={i} label={s} variant="green" />)
                  : <span className="text-sm text-slate-400">No matches found.</span>}
              </div>
            </div>

            {/* Missing */}
            <div>
              <SHead
                icon={<svg className="w-4 h-4 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                title="Missing Keywords"
                count={analysisData.missing_skills?.length || 0}
              />
              <div className="flex flex-col gap-2.5">
                {analysisData.missing_skills?.length > 0
                  ? analysisData.missing_skills.map((item, i) => {
                      const name = typeof item === 'object' ? item.skill : item;
                      const loc = typeof item === 'object' ? item.recommended_location : 'Experience Section';
                      return (
                        <div key={i} className="px-3 py-2.5 rounded-lg border border-rose-200/60 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/10 flex flex-col gap-1 text-sm">
                          <span className="font-semibold text-rose-700 dark:text-rose-400">{name}</span>
                          <span className="text-[10px] text-rose-500 dark:text-rose-500 uppercase tracking-wider">Add to: {loc}</span>
                        </div>
                      );
                    })
                  : <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Perfect match! No missing keywords.</span>}
              </div>
            </div>
          </div>

          {/* Expert Feedback */}
          <div>
            <SHead
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title="Expert Feedback"
            />
            <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 p-5">
              <ul className="space-y-3">
                {analysisData.ats_feedback?.map((fb, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                    <span>{fb}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bullet Rewrites */}
          <div className="pb-4">
            <SHead
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
              title="Bullet Point Enhancements"
            />
            <div className="flex flex-col gap-4">
              {analysisData.rewritten_bullets?.map((b, i) => (
                <BulletCard key={i} bullet={b} idx={i} copiedIndex={copiedIndex} onCopy={copyToClipboard} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
