import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf'; // <-- ADDED jsPDF IMPORT

import { normalizeAnalysis } from './utils/normalizeAnalysis';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import UploadView from './components/UploadView';
import ReportView from './components/ReportView';
import HistoryView from './components/HistoryView';
import ComparisonView from './components/ComparisonView';

const API_URL = 'http://127.0.0.1:8000/api/v1/analyze';

function App() {
  // Input States
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  
  // App State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // History & Compare States
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [compareList, setCompareList] = useState([]); // Holds up to 2 items
  const [isComparing, setIsComparing] = useState(false); // Router for Compare View

  // Initialize dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // 1. Handle Initial Form Submit
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      setError("Please provide both a PDF and a Job Description.");
      return;
    }

    setLoading(true);
    setError(null);
    setShowHistory(false);
    setIsComparing(false);
    setCompareList([]);

    const fileUrl = URL.createObjectURL(file);
    setPdfUrl(fileUrl);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await axios.post(`${API_URL}/`, formData);
      setAnalysisData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during analysis.");
      setPdfUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setShowHistory(true);
    setIsComparing(false);
    setCompareList([]);
    setLoadingHistory(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/history`);
      setHistoryList(response.data.data || []);
    } catch (err) {
      setError("Failed to load history. Make sure your backend is running.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this scan permanently?')) return;
    try {
      await axios.delete(`${API_URL}/history/${id}`);
      
      // Remove it from the UI immediately without refreshing
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      
      // Also remove it from the compare list if it was checked
      setCompareList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to delete the record. Please try again.");
    }
  };

  // 4. Load a specific History Item into the UI
  const loadHistoryItem = (item) => {
    setAnalysisData(item);
    setPdfUrl(null); 
    setShowHistory(false);
    setIsComparing(false);
  };

  const handleStartOver = () => {
    setFile(null);
    setJobDescription('');
    setAnalysisData(null);
    setPdfUrl(null);
    setError(null);
    setShowHistory(false);
    setIsComparing(false);
    setCompareList([]);
  };

  // Copy Tool
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // --- COMPARISON HELPERS ---

  const toggleCompareSelection = (item, e) => {
    e.stopPropagation(); 
    const isAlreadySelected = compareList.some((c) => c.id === item.id);
    
    if (isAlreadySelected) {
      setCompareList(compareList.filter((c) => c.id !== item.id));
    } else {
      if (compareList.length < 2) {
        setCompareList([...compareList, item]);
      } else {
        alert("You can only compare exactly 2 resumes at a time.");
      }
    }
  };

  const startComparison = () => {
    setCompareList([...compareList].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    setIsComparing(true);
  };

  // Render the Side-by-Side Comparison Dashboard
  const renderComparison = () => {
    const v1 = compareList[0];
    const v2 = compareList[1];
    const scoreDiff = v2.match_score - v1.match_score;

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            ⚖️ Before & After Comparison
          </h2>
          <button onClick={() => setIsComparing(false)} className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to History
          </button>
        </div>

        {/* The Big Score Jump Banner */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700 text-center flex flex-col items-center justify-center">
          <h3 className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-2">ATS Score Progress</h3>
          <div className="flex items-center gap-6">
            <span className="text-4xl font-black text-gray-700 dark:text-gray-300">{v1.match_score}%</span>
            <span className="text-2xl text-gray-400">➡️</span>
            <span className="text-5xl font-black text-green-600 dark:text-green-400">{v2.match_score}%</span>
          </div>
          {scoreDiff > 0 && (
            <span className="mt-3 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-bold">
              +{scoreDiff}% Improvement! 🎉
            </span>
          )}
        </div>

        {/* Side-by-Side Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[v1, v2].map((item, idx) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-transparent dark:border-gray-700 flex flex-col gap-6">
              <div className="border-b dark:border-gray-700 pb-4">
                <h3 className="text-xl font-bold mb-1">
                  {idx === 0 ? "Version 1 (Older)" : "Version 2 (Newer)"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={item.filename}>
                  {item.filename || "Uploaded Resume"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>

              {/* Matched */}
              <div>
                <h4 className="font-bold text-md mb-2">✅ Matched Keywords ({item.matched_skills?.length || 0})</h4>
                <div className="flex flex-wrap gap-2">
                  {item.matched_skills && item.matched_skills.map((skill, i) => (
                    <span key={i} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded border border-green-200 dark:border-green-800 font-medium">
                      {skill}
                    </span>
                  ))}
                  {(!item.matched_skills || item.matched_skills.length === 0) && (
                    <span className="text-sm text-gray-500">None found</span>
                  )}
                </div>
              </div>

              {/* Missing */}
              <div>
                <h4 className="font-bold text-md mb-2">🚨 Missing Keywords ({item.missing_skills?.length || 0})</h4>
                <div className="flex flex-wrap gap-2">
                  {item.missing_skills && item.missing_skills.map((skillItem, i) => {
                    const skillName = typeof skillItem === 'object' && skillItem !== null ? skillItem.skill : skillItem;
                    return (
                      <span key={i} className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded border border-red-200 dark:border-red-800 font-medium">
                        {skillName}
                      </span>
                    )
                  })}
                  {(!item.missing_skills || item.missing_skills.length === 0) && (
                    <span className="text-sm text-gray-500">None missing!</span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render History Dashboard
  const renderHistory = () => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-transparent dark:border-gray-700 max-w-5xl mx-auto relative">
      <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold">Your Past Scans</h2>
        <button onClick={handleStartOver} className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Scanner
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Click a card to view the full report, or select exactly two checkboxes to compare your progress side-by-side.
      </p>

      {loadingHistory ? (
        <div className="text-center py-10 text-gray-500">Loading your history...</div>
      ) : historyList.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No past scans found. Run your first analysis!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {historyList.map((item) => {
            const isSelected = compareList.some((c) => c.id === item.id);
            return (
              <div 
                key={item.id} 
                onClick={() => loadHistoryItem(item)}
                className={`border rounded-lg p-5 cursor-pointer transition flex flex-col gap-3 group relative ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20 shadow-md' 
                    : 'dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-400'
                }`}
              >
                {/* Delete Button */}
                <button 
                  onClick={(e) => handleDeleteHistory(item.id, e)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all z-10 bg-white dark:bg-gray-800 rounded-full p-1"
                  title="Delete this scan"
                >
                  🗑️
                </button>

                <div className="flex justify-between items-start mt-1">
                  <div className="flex items-center gap-3 w-3/4">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => toggleCompareSelection(item, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer accent-blue-600"
                    />
                    <span className="font-semibold truncate text-gray-900 dark:text-gray-100" title={item.filename}>
                      {item.filename || "Uploaded Resume"}
                    </span>
                  </div>
                  <span className={`font-bold ${item.match_score >= 80 ? 'text-green-600 dark:text-green-400' : item.match_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.match_score}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 pl-7">
                  {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                </div>
                <div className="text-sm mt-auto text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity pl-7">
                  View Report →
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Compare Button */}
      {compareList.length === 2 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-bounce z-20">
          <span className="font-medium">2 Resumes Selected</span>
          <button 
            onClick={startComparison}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold hover:bg-blue-500 transition"
          >
            Compare Now
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-8 font-sans text-gray-800 dark:text-gray-100">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 cursor-pointer" onClick={handleStartOver}>
            AI Resume Auditor
          </h1>
          <div className="flex gap-4 items-center">
            <button 
              onClick={fetchHistory}
              className="p-2 font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              🕒 History
            </button>

            {analysisData && !showHistory && !isComparing && (
              <button 
                onClick={handleStartOver}
                className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition font-medium"
              >
                + New Scan
              </button>
            )}
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6 shadow">{error}</div>}

        {/* View Router */}
        {isComparing ? (
          renderComparison()
        ) : showHistory ? (
          renderHistory()
        ) : !analysisData ? (
          /* INITIAL UPLOAD SCREEN */
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-transparent dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-center">Upload Resume for ATS Scanning</h2>
            <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Upload Resume (PDF only)</label>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-3 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Job Description</label>
                <textarea 
                  rows="8" 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the requirements and responsibilities of the job you are applying for..."
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 p-3 rounded resize-y focus:ring-2 focus:ring-blue-500 outline-none"
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 transition-colors shadow-md"
              >
                {loading ? 'Running AI Analysis...' : 'Analyze Resume'}
              </button>
            </form>
          </div>
        ) : (
          /* SIDE-BY-SIDE ANALYSIS SCREEN */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[85vh]">
            
            {/* LEFT COLUMN: Visual PDF or Placeholder */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col h-full border border-transparent dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Your Document</h2>
              <div className="flex-grow rounded border dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                {pdfUrl ? (
                  <iframe src={pdfUrl} title="Resume PDF Viewer" className="w-full h-full" />
                ) : (
                  <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                    <p className="text-4xl mb-4">📄</p>
                    <p>Visual PDF preview is not available for historical scans.</p>
                    <p className="text-sm mt-2">Your complete AI Audit Report is available on the right.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: AI Analysis Dashboard */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full overflow-y-auto border border-transparent dark:border-gray-700 custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2 dark:border-gray-700">ATS Audit Report</h2>
              
              <div className="space-y-8">
                
                {/* Match Score Card with ATS Progress Bar */}
                <div className="flex flex-col p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600 shadow-inner gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Overall Match</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">Against Job Description</span>
                    </div>
                    <span className={`text-4xl font-black ${analysisData.match_score >= 80 ? 'text-green-600 dark:text-green-400' : analysisData.match_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {analysisData.match_score}%
                    </span>
                  </div>
                  
                  {/* Visual ATS Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2 overflow-hidden shadow-inner">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                        analysisData.match_score >= 80 ? 'bg-green-600 dark:bg-green-400' : 
                        analysisData.match_score >= 50 ? 'bg-yellow-500 dark:bg-yellow-400' : 
                        'bg-red-600 dark:bg-red-400'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, analysisData.match_score))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Matched Skills (Green Badges) */}
                {analysisData.matched_skills && analysisData.matched_skills.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">✅ Matched Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.matched_skills.map((skill, i) => (
                        <span key={i} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm px-3 py-1.5 rounded-md border border-green-200 dark:border-green-800 font-medium shadow-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills with AI Placement Guide */}
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">🚨 Missing Keywords</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {analysisData.missing_skills.map((item, i) => {
                      const isObject = typeof item === 'object' && item !== null;
                      const skillName = isObject ? item.skill : item;
                      const location = isObject ? item.recommended_location : null;

                      return (
                        <div key={i} className="flex flex-col gap-1 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm">
                          <span className="font-bold text-red-700 dark:text-red-400 text-sm uppercase tracking-wide">
                            {skillName}
                          </span>
                          {location ? (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              <strong className="text-gray-900 dark:text-gray-100 text-xs">📍 Where to add:</strong> {location}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Add this to a relevant experience section.</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* General Feedback */}
                <div className="bg-blue-50 dark:bg-slate-800/50 p-5 rounded-lg border border-blue-100 dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">💡 Expert Feedback</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                    {analysisData.ats_feedback.map((fb, i) => (
                      <li key={i}>{fb}</li>
                    ))}
                  </ul>
                </div>

                {/* Rewritten Bullets with Copy Buttons */}
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">✨ Suggested Improvements</h3>
                  <div className="space-y-5">
                    {analysisData.rewritten_bullets.map((bullet, i) => (
                      <div key={i} className="border dark:border-gray-600 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
                        
                        <div className="mb-3">
                          <span className="text-xs font-bold text-red-500 uppercase tracking-wider block mb-1">Original (Weak)</span>
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-through bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700">
                            {bullet.original}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-green-600 uppercase tracking-wider block mb-1">AI Rewritten (Strong)</span>
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800/50">
                            {bullet.rewritten}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <button 
                            onClick={() => copyToClipboard(bullet.rewritten, i)}
                            className="text-xs font-bold bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 px-4 py-2 rounded shadow hover:bg-gray-700 dark:hover:bg-white transition flex items-center gap-2"
                          >
                            {copiedIndex === i ? '✅ Copied!' : '📋 Copy Text'}
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;