export default function UploadView({ file, jobDescription, loading, onAnalyze, onFileChange, onRemoveFile, onJobDescChange }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="w-full max-w-xl">

        {/* Hero Text */}
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
            Upload your file and paste the job description to get instant keyword matching and AI-powered rewrites.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-8">
          <form onSubmit={onAnalyze} className="flex flex-col gap-7">

            {/* File Upload */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase mb-2">
                <span>Resume Document</span>
                <span className="text-slate-400 normal-case font-medium">PDF and TXT only</span>
              </label>

              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-10 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition-all duration-200 group">
                <div className={`w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${file ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                  {file ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                </div>

                <div className="text-sm text-center px-4 flex flex-col items-center">
                  {file ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[200px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={onRemoveFile}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        title="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 block mt-1">
                      Click to browse <span className="font-medium text-slate-700 dark:text-slate-300">or drag & drop</span>
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onClick={(e) => { if (file) e.preventDefault(); }}
                  onChange={(e) => onFileChange(e.target.files[0])}
                />
              </label>
            </div>

            {/* Job Description */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase mb-2">
                <span>Job Description</span>
              </label>
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => onJobDescChange(e.target.value)}
                placeholder="Paste the job requirements and responsibilities here..."
                className="w-full text-sm bg-white/50 dark:bg-slate-950/30 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Running Analysis...
                </>
              ) : 'Analyze Match Score'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
