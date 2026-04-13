import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import { normalizeAnalysis } from './utils/normalizeAnalysis';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import UploadView from './components/UploadView';
import ReportView from './components/ReportView';
import HistoryView from './components/HistoryView';
import ComparisonView from './components/ComparisonView';

const API_URL = 'http://127.0.0.1:8000/api/v1/analyze';

export default function App() {
  /* ── State ── */
  const [file, setFile]                     = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading]               = useState(false);
  const [toast, setToast]                   = useState(null);
  const [analysisData, setAnalysisData]     = useState(null);
  const [pdfUrl, setPdfUrl]                 = useState(null);

  const [showHistory, setShowHistory]       = useState(false);
  const [historyList, setHistoryList]       = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [compareList, setCompareList]       = useState([]);
  const [isComparing, setIsComparing]       = useState(false);

  const abortControllerRef = useRef(null);

  /* ── Dark Mode ── */
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  /* ── Auto-dismiss success toast ── */
  useEffect(() => {
    if (toast) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (toast.type === 'success') {
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [toast]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  /* ════════════════════════════════════════════════════
     HANDLERS
  ════════════════════════════════════════════════════ */

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      setToast({ message: 'Please provide both a resume file and a job description.', type: 'error' });
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setToast(null);
    setShowHistory(false);
    setIsComparing(false);
    setCompareList([]);
    setPdfUrl(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append('file', file);
    fd.append('job_description', jobDescription);

    try {
      const res = await axios.post(`${API_URL}/`, fd, {
        signal: abortControllerRef.current.signal,
      });
      setAnalysisData(normalizeAnalysis(res.data.data));
      setToast({ message: 'Analysis completed successfully!', type: 'success' });
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Analysis cleanly aborted by user.');
      } else {
        setToast({
          message: err.response?.data?.detail || 'Analysis failed. Please check your connection to the server.',
          type: 'error',
        });
        setPdfUrl(null);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const fetchHistory = async () => {
    setShowHistory(true);
    setIsComparing(false);
    setCompareList([]);
    setLoadingHistory(true);
    setToast(null);
    try {
      const res = await axios.get(`${API_URL}/history`);
      setHistoryList(res.data.data || []);
    } catch {
      setToast({ message: 'Could not load history.', type: 'error' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this scan permanently?')) return;
    try {
      await axios.delete(`${API_URL}/history/${id}`);
      setHistoryList(prev => prev.filter(i => i.id !== id));
      setCompareList(prev => prev.filter(i => i.id !== id));
      setToast({ message: 'Scan deleted permanently.', type: 'success' });
    } catch {
      setToast({ message: 'Delete failed. Please try again.', type: 'error' });
    }
  };

  const loadHistoryItem = (item) => {
    setAnalysisData(normalizeAnalysis(item));
    setPdfUrl(null);
    setShowHistory(false);
    setIsComparing(false);
    setToast(null);
  };

  const handleStartOver = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setFile(null);
    setJobDescription('');
    setAnalysisData(null);
    setPdfUrl(null);
    setToast(null);
    setShowHistory(false);
    setIsComparing(false);
    setCompareList([]);
    setLoading(false);
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setPdfUrl(null);
  };

  const toggleCompare = (item, e) => {
    e.stopPropagation();
    if (compareList.some(c => c.id === item.id)) {
      setCompareList(compareList.filter(c => c.id !== item.id));
      setToast(null);
    } else if (compareList.length < 2) {
      setCompareList([...compareList, item]);
      setToast(null);
    } else {
      setToast({ message: 'You can only select exactly 2 resumes to compare.', type: 'error' });
    }
  };

  const startComparison = () => {
    setCompareList([...compareList].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    setIsComparing(true);
    setToast({ message: 'Comparison generated successfully!', type: 'success' });
  };

  const handleDownloadReport = () => {
    if (!analysisData) return;

    const reportContent = `RÉSUMÉ ATS AUDIT REPORT
=======================
Date Generated: ${new Date().toLocaleString()}
Match Score: ${analysisData.match_score}% / 100

MATCHED KEYWORDS
----------------
${analysisData.matched_skills?.length ? analysisData.matched_skills.join(', ') : 'None found'}

MISSING KEYWORDS
----------------
${analysisData.missing_skills?.length
  ? analysisData.missing_skills.map(s => {
      const name = typeof s === 'object' ? s.skill : s;
      const loc = typeof s === 'object' ? s.recommended_location : 'Experience Section';
      return `- ${name} (Recommend adding to: ${loc})`;
    }).join('\n')
  : 'None missing! Your resume covers all key terms.'}

EXPERT FEEDBACK
---------------
${analysisData.ats_feedback?.length ? analysisData.ats_feedback.map(f => `- ${f}`).join('\n') : 'No feedback provided.'}

AI SUGGESTED REWRITES
---------------------
${analysisData.rewritten_bullets?.length
  ? analysisData.rewritten_bullets.map((b, i) => `[Suggestion ${i + 1}]\nBefore: ${b.original}\nAfter:  ${b.rewritten}\n`).join('\n')
  : 'No rewrites suggested.'}`;

    const blob = new Blob([reportContent.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATS_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-900/50 dark:selection:text-blue-100 relative">

      {/* Background decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />
      </div>

      {/* Navbar */}
      <Navbar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        onStartOver={handleStartOver}
        onFetchHistory={fetchHistory}
      />

      {/* Main */}
      <main className="pt-20 px-4 sm:px-6 pb-12 relative z-10">

        <Toast toast={toast} onDismiss={() => setToast(null)} />

        <div className="mt-4">
          {isComparing ? (
            <ComparisonView
              compareList={compareList}
              onBack={() => setIsComparing(false)}
            />
          ) : showHistory ? (
            <HistoryView
              historyList={historyList}
              loading={loadingHistory}
              compareList={compareList}
              onLoadItem={loadHistoryItem}
              onDelete={handleDeleteHistory}
              onToggleCompare={toggleCompare}
              onStartComparison={startComparison}
            />
          ) : !analysisData ? (
            <UploadView
              file={file}
              jobDescription={jobDescription}
              loading={loading}
              onAnalyze={handleAnalyze}
              onFileChange={setFile}
              onRemoveFile={handleRemoveFile}
              onJobDescChange={setJobDescription}
            />
          ) : (
            <ReportView
              analysisData={analysisData}
              pdfUrl={pdfUrl}
              onDownload={handleDownloadReport}
            />
          )}
        </div>
      </main>
    </div>
  );
}
