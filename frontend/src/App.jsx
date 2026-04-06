import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = "http://127.0.0.1:8000/api/v1/analyze";

/* ── helpers ──────────────────────────────────────────── */
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

/* ── SVG Score Ring ───────────────────────────────────── */
function ScoreRing({ score }) {
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
        <circle cx="50" cy="50" r={r} fill="none"
          stroke="currentColor" strokeWidth="6"
          className="text-slate-100 dark:text-slate-800" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={`url(#${getGradientId(score)})`} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black tracking-tighter ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Score</span>
      </div>
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────── */
function Badge({ label, variant }) {
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

/* ── Section Heading ──────────────────────────────────── */
function SHead({ icon, title, count }) {
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

/* ── Bullet Card ──────────────────────────────────────── */
function BulletCard({ bullet, idx, copiedIndex, onCopy }) {
  const copied = copiedIndex === idx;
  return (
    <div className="group relative rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-blue-900/10 transition-all duration-300">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span> Original
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-through leading-relaxed">{bullet.original}</p>
      </div>
      <div className="p-5 bg-blue-50/30 dark:bg-blue-900/10">
        <span className="text-[10px] font-bold tracking-widest text-blue-500 uppercase mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> AI Rewrite
        </span>
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{bullet.rewritten}</p>
        
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

/* ═══════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const [file, setFile]                     = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [analysisData, setAnalysisData]     = useState(null);
  const [pdfUrl, setPdfUrl]                 = useState(null);
  const [copiedIndex, setCopiedIndex]       = useState(null);
  const [showHistory, setShowHistory]       = useState(false);
  const [historyList, setHistoryList]       = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [compareList, setCompareList]       = useState([]);
  const [isComparing, setIsComparing]       = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  /* ── handlers ── */
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription) { setError('Please provide both a resume PDF and a job description.'); return; }
    setLoading(true); setError(null); setShowHistory(false); setIsComparing(false); setCompareList([]);
    setPdfUrl(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('file', file); fd.append('job_description', jobDescription);
    try {
      const res = await axios.post(`${API_URL}/`, fd);
      setAnalysisData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please check your connection to the server.');
      setPdfUrl(null);
    } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setShowHistory(true); setIsComparing(false); setCompareList([]); setLoadingHistory(true); setError(null);
    try {
      const res = await axios.get(`${API_URL}/history`);
      setHistoryList(res.data.data || []);
    } catch { setError('Could not load history.'); }
    finally { setLoadingHistory(false); }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this scan permanently?')) return;
    try {
      await axios.delete(`${API_URL}/history/${id}`);
      setHistoryList(p => p.filter(i => i.id !== id));
      setCompareList(p => p.filter(i => i.id !== id));
    } catch { alert('Delete failed.'); }
  };

  const loadHistoryItem = (item) => { setAnalysisData(item); setPdfUrl(null); setShowHistory(false); setIsComparing(false); };

  const handleStartOver = () => {
    setFile(null); setJobDescription(''); setAnalysisData(null); setPdfUrl(null);
    setError(null); setShowHistory(false); setIsComparing(false); setCompareList([]);
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleCompare = (item, e) => {
    e.stopPropagation();
    if (compareList.some(c => c.id === item.id)) {
      setCompareList(compareList.filter(c => c.id !== item.id));
    } else if (compareList.length < 2) {
      setCompareList([...compareList, item]);
    } else {
      alert('You can only select exactly 2 resumes to compare.');
    }
  };

  const startComparison = () => {
    setCompareList([...compareList].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    setIsComparing(true);
  };

  const handleDownloadReport = () => {
    if (!analysisData) return;
    const reportContent = `RÉSUMÉ ATS AUDIT REPORT\n=======================\nDate Generated: ${new Date().toLocaleString()}\nMatch Score: ${analysisData.match_score}% / 100\n\nMATCHED KEYWORDS\n----------------\n${analysisData.matched_skills?.length ? analysisData.matched_skills.join(', ') : 'None found'}\n\nMISSING KEYWORDS\n----------------\n${analysisData.missing_skills?.length ? analysisData.missing_skills.map(s => {
      const name = typeof s === 'object' ? s.skill : s;
      const loc = typeof s === 'object' ? s.recommended_location : 'Experience Section';
      return `- ${name} (Recommend adding to: ${loc})`;
    }).join('\n') : 'None missing! Your resume covers all key terms.'}\n\nEXPERT FEEDBACK\n---------------\n${analysisData.ats_feedback?.length ? analysisData.ats_feedback.map(f => `- ${f}`).join('\n') : 'No feedback provided.'}\n\nAI SUGGESTED REWRITES\n---------------------\n${analysisData.rewritten_bullets?.length ? analysisData.rewritten_bullets.map((b, i) => `[Suggestion ${i + 1}]\nBefore: ${b.original}\nAfter:  ${b.rewritten}\n`).join('\n') : 'No rewrites suggested.'}`;
    
    const blob = new Blob([reportContent.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATS_Report_${new Date().getTime()}.txt`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ════════════════════════════════════════════════════
     VIEWS
  ════════════════════════════════════════════════════ */
  const renderUpload = () => (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="w-full max-w-xl">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 shadow-sm backdrop-blur-sm">
            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-600 dark:text-blue-400 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              AI ATS Scanner
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Optimize your <span className="text-blue-600 dark:text-blue-400">Resume.</span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Upload your PDF and paste the job description to get instant keyword matching and AI-powered rewrites.
          </p>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-8">
          <form onSubmit={handleAnalyze} className="flex flex-col gap-7">
            
            {/* File Upload Component */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase mb-2">
                <span>Resume Document</span>
                <span className="text-slate-400 normal-case font-medium">PDF only</span>
              </label>
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-10 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition-all duration-200 group">
                <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${file ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                  {file ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  )}
                </div>
                <span className="text-sm text-center px-4">
                  {file 
                    ? <span className="text-blue-600 dark:text-blue-400 font-medium block mt-1">{file.name}</span>
                    : <span className="text-slate-500 dark:text-slate-400 block mt-1">Click to browse <span className="font-medium text-slate-700 dark:text-slate-300">or drag & drop</span></span>
                  }
                </span>
                <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
              </label>
            </div>

            {/* Job Description Component */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase mb-2">
                <span>Job Description</span>
              </label>
              <textarea
                rows={5}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job requirements and responsibilities here..."
                className="w-full text-sm bg-white/50 dark:bg-slate-950/30 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  Running Analysis...
                </>
              ) : 'Analyze Match Score'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-110px)] max-w-[1400px] mx-auto mt-2">
      
      {/* Document View */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-sm flex flex-col overflow-hidden hidden lg:flex">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Original Document
          </span>
        </div>
        <div className="flex-1 bg-slate-100/30 dark:bg-slate-950/50 relative">
          {pdfUrl ? (
            <iframe src={pdfUrl} title="Résumé" className="w-full h-full border-0 absolute inset-0 mix-blend-multiply dark:mix-blend-normal" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
               <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               <p className="text-sm">Preview unavailable for historical scans.</p>
            </div>
          )}
        </div>
      </div>

      {/* Report View */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 shrink-0 flex justify-between items-center z-10">
          <span className="text-xs font-bold tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-2">
            Analysis Report
          </span>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* Score Header */}
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
            <ScoreRing score={analysisData.match_score} />
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">ATS Compatibility</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Based on job description parsing</p>
              
              <div className="w-full bg-slate-200/60 dark:bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${scoreBg(analysisData.match_score)}`} style={{ width: `${Math.min(100, Math.max(0, analysisData.match_score))}%` }} />
              </div>
              <p className={`text-xs font-semibold ${scoreColor(analysisData.match_score)}`}>
                {scoreLabel(analysisData.match_score)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched (Green) */}
            <div>
              <SHead icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>} title="Matched Keywords" count={analysisData.matched_skills?.length || 0} />
              <div className="flex flex-wrap gap-2">
                {analysisData.matched_skills?.length > 0 
                  ? analysisData.matched_skills.map((s, i) => <Badge key={i} label={s} variant="green" />)
                  : <span className="text-sm text-slate-400">No matches found.</span>}
              </div>
            </div>

            {/* Missing (Red) */}
            <div>
              <SHead icon={<svg className="w-4 h-4 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} title="Missing Keywords" count={analysisData.missing_skills?.length || 0} />
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

          {/* Feedback */}
          <div>
            <SHead icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} title="Expert Feedback" />
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

          {/* Rewrites */}
          <div className="pb-4">
            <SHead icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} title="Bullet Point Enhancements" />
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

  const renderHistory = () => (
    <div className="max-w-6xl mx-auto px-4 mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analysis History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select exactly two documents to compare progression.</p>
        </div>
        
        {/* Prominent New Scan Button in History */}
        <button 
          onClick={handleStartOver}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          New Scan
        </button>
      </div>

      {loadingHistory ? (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse">Loading history...</div>
      ) : historyList.length === 0 ? (
        <div className="text-center py-32 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-500">No scans available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
          {historyList.map(item => {
            const sel = compareList.some(c => c.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className={`group relative rounded-2xl border p-5 cursor-pointer flex flex-col transition-all duration-200 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md ${
                  sel ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox" checked={sel}
                    className="mt-1 w-4 h-4 cursor-pointer accent-blue-600 rounded border-slate-300"
                    onChange={e => toggleCompare(item, e)}
                    onClick={e => e.stopPropagation()}
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
                  <span className={`text-2xl font-black tracking-tight ${scoreColor(item.match_score)}`}>{item.match_score}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                  <div className={`h-1 rounded-full ${scoreBg(item.match_score)}`} style={{ width: `${item.match_score}%` }} />
                </div>

                <button
                  onClick={e => handleDeleteHistory(item.id, e)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {compareList.length === 2 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 pl-6 pr-2 py-2 rounded-full shadow-2xl border border-slate-800 dark:border-slate-200">
          <span className="text-sm font-medium">2 items selected</span>
          <button
            onClick={startComparison}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2 rounded-full transition-colors"
          >
            Compare Output
          </button>
        </div>
      )}
    </div>
  );

  const renderComparison = () => {
    const [v1, v2] = compareList;
    const diff = v2.match_score - v1.match_score;
    return (
      <div className="max-w-7xl mx-auto px-4 mt-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Complete Comparison</h2>
          <button onClick={() => setIsComparing(false)}
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            ← Back to History
          </button>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[v1, v2].map((item, idx) => (
            <div key={item.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <Badge label={idx === 0 ? 'Older Version' : 'Newer Version'} variant={idx === 0 ? 'slate' : 'blue'} />
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3 truncate">{item.filename}</p>
                </div>
                <div className="text-right">
                   <p className={`text-2xl font-black ${scoreColor(item.match_score)}`}>{item.match_score}%</p>
                </div>
              </div>
              
              {/* Keywords Comparison */}
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

              {/* Complete Analysis - Feedback */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">Expert Feedback</p>
                <ul className="space-y-2">
                  {item.ats_feedback?.length > 0 ? (
                    item.ats_feedback.map((fb, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                        <span className="text-blue-500 shrink-0">•</span> <span>{fb}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400">No specific feedback recorded.</li>
                  )}
                </ul>
              </div>

              {/* Complete Analysis - Rewrites */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">Suggested Rewrites</p>
                <div className="flex flex-col gap-3">
                  {item.rewritten_bullets?.length > 0 ? (
                    item.rewritten_bullets.map((b, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Original</p>
                        <p className="text-xs text-slate-500 line-through mb-3">{b.original}</p>
                        
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Rewrite</p>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{b.rewritten}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No rewrites generated for this scan.</p>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════
     ROOT
  ════════════════════════════════════════════════════ */
  return (
    // The background grid and subtle radial gradient for that perfect SaaS look
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-900/50 dark:selection:text-blue-100 relative">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6">
        <button
          onClick={handleStartOver}
          className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2 relative z-10"
        >
          <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-600 text-white shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-slate-900 dark:text-white">Resume Audit</span>
        </button>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={fetchHistory}
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-md transition-colors"
          >
            History
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 px-4 sm:px-6 pb-12 relative z-10">
        {error && (
          <div className="max-w-xl mx-auto mt-4 px-4 py-3 rounded-xl bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md border border-red-200 dark:border-red-800/30 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <div className="mt-4">
          {isComparing
            ? renderComparison()
            : showHistory
              ? renderHistory()
              : !analysisData
                ? renderUpload()
                : renderReport()
          }
        </div>
      </main>
    </div>
  );
}
