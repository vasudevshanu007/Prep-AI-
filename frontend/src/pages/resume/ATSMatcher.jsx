import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { analyzeATS, clearATSAnalysis } from '../../redux/slices/atsSlice';

const ScoreBadge = ({ score, label }) => {
  const color =
    score >= 75 ? 'text-green-400 border-green-400' :
    score >= 50 ? 'text-yellow-400 border-yellow-400' :
                  'text-red-400 border-red-400';
  return (
    <div className={`flex flex-col items-center border-2 rounded-xl p-4 ${color}`}>
      <span className="text-3xl font-bold">{score}%</span>
      <span className="text-xs mt-1 text-gray-400">{label}</span>
    </div>
  );
};

const KeywordPill = ({ word, matched }) => (
  <span className={`inline-block text-xs px-2 py-1 rounded-full mr-1 mb-1 font-medium ${
    matched ? 'bg-green-900 text-green-300 border border-green-600' : 'bg-red-900 text-red-300 border border-red-600'
  }`}>
    {matched ? '✓' : '✗'} {word}
  </span>
);

export default function ATSMatcher() {
  const dispatch = useDispatch();
  const { currentAnalysis, loading, error } = useSelector((s) => s.ats);

  const [mode, setMode]       = useState('text'); // 'text' | 'file'
  const [resumeText, setResumeText]   = useState('');
  const [jobDesc, setJobDesc]         = useState('');
  const [jobTitle, setJobTitle]       = useState('');
  const [file, setFile]               = useState(null);
  const fileRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (mode === 'file' && file) {
      formData.append('resume', file);
    } else {
      formData.append('resumeText', resumeText);
    }
    formData.append('jobDescription', jobDesc);
    formData.append('jobTitle', jobTitle);
    dispatch(analyzeATS(formData));
  };

  const handleReset = () => {
    dispatch(clearATSAnalysis());
    setResumeText(''); setJobDesc(''); setJobTitle(''); setFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">ATS Resume Matcher</h1>
          <p className="text-gray-400 mt-1">Check how well your resume matches a job description</p>
        </div>

        {!currentAnalysis ? (
          /* ── Input Form ── */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Info */}
            <div className="bg-gray-900 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-indigo-400">Job Details</h2>
              <input
                type="text"
                placeholder="Job Title (e.g. Senior Frontend Engineer)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                placeholder="Paste the full job description here..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                required
                rows={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Resume Input */}
            <div className="bg-gray-900 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-indigo-400">Your Resume</h2>
                <div className="flex rounded-lg overflow-hidden border border-gray-700">
                  {['text', 'file'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                        mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {m === 'text' ? 'Paste Text' : 'Upload PDF'}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'text' ? (
                <textarea
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  required
                  rows={10}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                />
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  {file ? (
                    <p className="text-green-400 font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-gray-400">Click to upload PDF resume</p>
                      <p className="text-gray-600 text-sm mt-1">Maximum 5 MB</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {error && <p className="text-red-400 text-sm bg-red-900/30 border border-red-700 rounded-lg px-4 py-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Analyzing with AI...' : 'Analyze Resume'}
            </button>
          </form>
        ) : (
          /* ── Results ── */
          <div className="space-y-6 animate-fade-in">
            {/* Score Cards */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Match Scores</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreBadge score={currentAnalysis.atsScore}        label="ATS Score" />
                <ScoreBadge score={currentAnalysis.matchPercentage} label="Match %" />
                <ScoreBadge score={currentAnalysis.sectionScores?.skills ?? 0}      label="Skills" />
                <ScoreBadge score={currentAnalysis.sectionScores?.experience ?? 0}  label="Experience" />
              </div>
            </div>

            {/* Keywords */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="font-semibold text-green-400 mb-3">Matched Keywords ({currentAnalysis.matchedKeywords?.length || 0})</h3>
                <div>{currentAnalysis.matchedKeywords?.map((w) => <KeywordPill key={w} word={w} matched />)}</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="font-semibold text-red-400 mb-3">Missing Keywords ({currentAnalysis.missingKeywords?.length || 0})</h3>
                <div>{currentAnalysis.missingKeywords?.map((w) => <KeywordPill key={w} word={w} matched={false} />)}</div>
              </div>
            </div>

            {/* Skill Gaps */}
            {currentAnalysis.skillGaps?.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-400 mb-3">Skill Gaps to Address</h3>
                <ul className="space-y-1">
                  {currentAnalysis.skillGaps.map((g) => (
                    <li key={g} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">▸</span>{g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {currentAnalysis.suggestions?.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h3 className="font-semibold text-indigo-400 mb-3">AI Suggestions</h3>
                <ul className="space-y-2">
                  {currentAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">{i + 1}.</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improved Summary */}
            {currentAnalysis.improvedSummary && (
              <div className="bg-indigo-950 border border-indigo-700 rounded-xl p-6">
                <h3 className="font-semibold text-indigo-300 mb-3">✨ AI-Suggested Summary</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{currentAnalysis.improvedSummary}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full border border-gray-700 hover:border-indigo-500 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors"
            >
              Analyze Another Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
