import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { codingAPI, dsaAPI } from '../../services/api';
import {
  RiPlayLine, RiUploadLine, RiRobotLine, RiLightbulbLine,
  RiCheckLine, RiCloseLine, RiTimeLine, RiFilterLine,
  RiSearchLine, RiExternalLinkLine, RiBookmarkLine, RiBookmarkFill,
  RiArrowLeftLine, RiFireLine, RiCodeLine,
} from 'react-icons/ri';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python',     label: 'Python' },
  { value: 'java',       label: 'Java' },
  { value: 'cpp',        label: 'C++' },
  { value: 'c',          label: 'C' },
  { value: 'typescript', label: 'TypeScript' },
];

const STARTERS = {
  javascript: `// Read input from stdin\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// Your solution here\n`,
  python:     `import sys\nlines = sys.stdin.read().strip().split('\\n')\n# Your solution here\n`,
  java:       `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Your solution here\n    return 0;\n}`,
  c:          `#include <stdio.h>\nint main() {\n    // Your solution here\n    return 0;\n}`,
  typescript: `import * as fs from 'fs';\nconst lines = fs.readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// Your solution here\n`,
};

const DIFF_COLORS = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };
const DIFF_BG     = { easy: 'bg-green-900/40 text-green-300', medium: 'bg-yellow-900/40 text-yellow-300', hard: 'bg-red-900/40 text-red-300' };
const STATUS_ICON = { solved: '✓', attempted: '~', unsolved: '○' };
const STATUS_COLOR= { solved: 'text-green-400', attempted: 'text-yellow-400', unsolved: 'text-gray-600' };

function ExternalModal({ problem, onClose, onMarkStatus }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{problem.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-semibold ${DIFF_COLORS[problem.difficulty]}`}>{problem.difficulty}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-sm">{problem.topic}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><RiCloseLine className="text-2xl" /></button>
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {(problem.companies || []).map(c => (
            <span key={c} className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 text-xs rounded-full">{c}</span>
          ))}
        </div>
        {problem.frequencyScore && (
          <div className="flex items-center gap-2 mb-4">
            <RiFireLine className="text-orange-400" />
            <span className="text-gray-400 text-sm">Frequency: </span>
            <div className="flex gap-0.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-2 w-2 rounded-full ${i < problem.frequencyScore ? 'bg-orange-400' : 'bg-gray-700'}`} />
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mb-6">
          {(problem.sheetTags || []).map(t => (
            <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">{t}</span>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          <a href={problem.externalUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
            <RiExternalLinkLine /> Solve on {problem.platform === 'leetcode' ? 'LeetCode' : problem.platform === 'gfg' ? 'GFG' : 'Platform'}
          </a>
          <button onClick={() => { onMarkStatus(problem._id, 'solved'); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-900/40 hover:bg-green-900/60 text-green-400 rounded-xl font-semibold transition-colors border border-green-800">
            <RiCheckLine /> Mark Solved
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CodingModule() {
  const { user } = useSelector(s => s.auth);

  const [problems, setProblems]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filters, setFilters]     = useState({ difficulty: '', topic: '', company: '', source: '' });
  const [topics, setTopics]       = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedProblem, setSelectedProblem] = useState(null);
  const [fullProblem, setFullProblem]         = useState(null);
  const [showExternal, setShowExternal]       = useState(false);

  const [language, setLanguage]   = useState('python');
  const [code, setCode]           = useState(STARTERS.python);
  const [activeTab, setActiveTab] = useState('problem');
  const [output, setOutput]       = useState('');
  const [customInput, setCustomInput] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [score, setScore]         = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentorFeedback, setMentorFeedback] = useState(null);
  const [loadingMentor, setLoadingMentor]   = useState(false);
  const [lastTestId, setLastTestId] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [timer, setTimer]         = useState(0);
  const timerRef = useRef(null);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200, ...filters };
      if (search) params.q = search;
      const { data } = await dsaAPI.searchProblems(params);
      setProblems(data.problems || []);
      setTotal(data.pagination?.total || data.problems?.length || 0);
    } catch { toast.error('Failed to load problems'); }
    finally { setLoading(false); }
  }, [filters, search]);

  useEffect(() => { loadProblems(); }, [loadProblems]);

  useEffect(() => {
    dsaAPI.getTopics().then(r => setTopics(r.data.topics || [])).catch(() => {});
    dsaAPI.getCompanies().then(r => setCompanies(r.data.companies || [])).catch(() => {});
  }, []);

  const openProblem = async (p) => {
    setSelectedProblem(p);
    setScore(null); setTestResults([]); setOutput(''); setMentorFeedback(null);
    setShowHints(false); setActiveTab('problem');
    if (p.source === 'external') { setShowExternal(true); return; }
    setShowExternal(false);
    try {
      const { data } = await codingAPI.getProblemById(p._id || p.slug);
      setFullProblem(data.problem);
    } catch { setFullProblem(p); }
    clearInterval(timerRef.current);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  const closeProblem = () => {
    setSelectedProblem(null); setFullProblem(null); setShowExternal(false);
    clearInterval(timerRef.current); setTimer(0);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);
  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleLanguageChange = (lang) => { setLanguage(lang); setCode(STARTERS[lang]); };

  const handleRun = async () => {
    if (!code.trim()) return toast.error('Write some code first');
    setIsRunning(true); setActiveTab('output');
    try {
      const { data } = await codingAPI.runCode({ code, language, input: customInput });
      setOutput(data.output || data.stderr || 'No output');
    } catch (e) { setOutput(e.response?.data?.message || 'Execution failed'); }
    finally { setIsRunning(false); }
  };

  const handleSubmit = async () => {
    if (!selectedProblem?._id || !code.trim()) return toast.error('Write some code first');
    setIsSubmitting(true); setActiveTab('result');
    clearInterval(timerRef.current);
    try {
      const { data } = await codingAPI.submitCode({ code, language, problemId: selectedProblem._id, timeTaken: timer });
      setTestResults(data.testResults || []);
      setScore(data.score); setLastTestId(data.codingTest?._id);
      const ns = data.allPassed ? 'solved' : 'attempted';
      setProblems(prev => prev.map(p => p._id === selectedProblem._id ? { ...p, status: ns } : p));
      setSelectedProblem(prev => prev ? { ...prev, status: ns } : null);
      if (data.allPassed) toast.success('All test cases passed! 🎉');
      else toast(`Passed ${data.passedCount}/${data.totalTestCases} test cases`, { icon: '⚡' });
    } catch (e) { toast.error(e.response?.data?.message || 'Submission failed'); }
    finally { setIsSubmitting(false); }
  };

  const handleMentor = async () => {
    if (!lastTestId) return toast.error('Submit your code first');
    setLoadingMentor(true); setActiveTab('mentor');
    try {
      const { data } = await codingAPI.getMentorFeedback(lastTestId);
      setMentorFeedback(data.mentorFeedback);
    } catch { toast.error('Mentor feedback failed'); }
    finally { setLoadingMentor(false); }
  };

  const handleBookmark = async (problem, e) => {
    e.stopPropagation();
    if (!user) return toast.error('Login to bookmark');
    try {
      const { data } = await dsaAPI.toggleBookmark(problem._id);
      setProblems(prev => prev.map(p => p._id === problem._id ? { ...p, bookmarked: data.bookmarked } : p));
    } catch { toast.error('Failed'); }
  };

  const handleMarkStatus = (problemId, status) => {
    setProblems(prev => prev.map(p => p._id === problemId ? { ...p, status } : p));
  };

  const solvedCount   = problems.filter(p => p.status === 'solved').length;
  const attemptedCount= problems.filter(p => p.status === 'attempted').length;

  // ── IDE View ─────────────────────────────────────────────────────────────────
  if (selectedProblem && !showExternal) {
    const prob = fullProblem || selectedProblem;
    return (
      <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={closeProblem} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm whitespace-nowrap">
              <RiArrowLeftLine /> Back
            </button>
            <span className="text-gray-600">|</span>
            <span className="text-white font-semibold truncate">{prob.title}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${DIFF_BG[prob.difficulty]}`}>{prob.difficulty}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-gray-400 text-sm font-mono hidden sm:flex items-center gap-1">
              <RiTimeLine />{fmtTime(timer)}
            </span>
            <select value={language} onChange={e => handleLanguageChange(e.target.value)}
              className="bg-gray-800 text-gray-200 text-sm rounded-lg px-2 py-1 border border-gray-700 focus:outline-none">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button onClick={handleRun} disabled={isRunning}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              <RiPlayLine /> {isRunning ? 'Running...' : 'Run'}
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              <RiUploadLine /> {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button onClick={handleMentor}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors">
              <RiRobotLine /> Mentor
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Problem */}
          <div className="w-2/5 flex flex-col border-r border-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-800 bg-gray-900 flex-shrink-0">
              {['problem', 'output', 'result', 'mentor'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-sm">
              {activeTab === 'problem' && (
                <div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(prob.companies || []).slice(0, 5).map(c => (
                      <span key={c} className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">{prob.description}</div>
                  {prob.examples?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-white font-semibold">Examples</h3>
                      {prob.examples.map((ex, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3 font-mono text-xs">
                          <div><span className="text-gray-500">Input: </span><span className="text-green-300">{ex.input}</span></div>
                          <div><span className="text-gray-500">Output: </span><span className="text-blue-300">{ex.output}</span></div>
                          {ex.explanation && <div className="text-gray-600 mt-1">// {ex.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {prob.constraints && (
                    <div className="mt-4">
                      <h3 className="text-white font-semibold mb-1">Constraints</h3>
                      <p className="text-gray-400 text-xs font-mono">{prob.constraints}</p>
                    </div>
                  )}
                  {prob.hints?.length > 0 && (
                    <div className="mt-4">
                      <button onClick={() => setShowHints(!showHints)}
                        className="flex items-center gap-1 text-yellow-400 text-sm hover:text-yellow-300">
                        <RiLightbulbLine /> {showHints ? 'Hide Hints' : `Show Hints (${prob.hints.length})`}
                      </button>
                      {showHints && (
                        <div className="mt-2 space-y-1">
                          {prob.hints.map((h, i) => (
                            <div key={i} className="bg-yellow-900/20 border border-yellow-800/50 rounded p-2 text-yellow-200 text-xs">{i + 1}. {h}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'output' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Custom Input (stdin)</label>
                    <textarea value={customInput} onChange={e => setCustomInput(e.target.value)}
                      className="w-full h-20 bg-gray-800 text-gray-200 font-mono text-xs p-2 rounded border border-gray-700 resize-none focus:outline-none focus:border-indigo-500"
                      placeholder="Enter test input..." />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Output</label>
                    <pre className="bg-gray-800 text-gray-200 font-mono text-xs p-3 rounded min-h-[100px] whitespace-pre-wrap">
                      {isRunning ? 'Running...' : output || 'Click Run to see output'}
                    </pre>
                  </div>
                </div>
              )}
              {activeTab === 'result' && (
                <div>
                  {testResults.length > 0 ? (
                    <>
                      <div className={`p-3 rounded-xl mb-4 ${score === 100 ? 'bg-green-900/30 border border-green-700' : 'bg-yellow-900/30 border border-yellow-700'}`}>
                        <div className="text-lg font-bold text-white">Score: {score}/100</div>
                        <div className="text-sm text-gray-400">{testResults.filter(t => t.passed).length}/{testResults.length} passed</div>
                      </div>
                      {testResults.map((r, i) => (
                        <div key={i} className={`mb-2 p-2 rounded border text-xs ${r.passed ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
                          <div className="flex items-center gap-1 font-semibold mb-1">
                            {r.passed ? <RiCheckLine className="text-green-400" /> : <RiCloseLine className="text-red-400" />}
                            Test {i + 1}: {r.passed ? 'Passed' : 'Failed'}
                          </div>
                          {!r.passed && (
                            <div className="font-mono space-y-0.5 text-gray-400">
                              {r.input !== '[hidden]' && <div>In: <span className="text-blue-300">{r.input}</span></div>}
                              <div>Expected: <span className="text-green-300">{r.expectedOutput}</span></div>
                              <div>Got: <span className="text-red-300">{r.actualOutput}</span></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-gray-500 text-center mt-8">Submit your code to see results</div>
                  )}
                </div>
              )}
              {activeTab === 'mentor' && (
                <div>
                  {loadingMentor ? (
                    <div className="text-center text-gray-400 mt-8">Generating feedback...</div>
                  ) : mentorFeedback ? (
                    <div className="space-y-4">
                      {mentorFeedback.analysis && <div><h3 className="text-indigo-400 font-semibold mb-1">Analysis</h3><p className="text-gray-300 text-xs leading-relaxed">{mentorFeedback.analysis}</p></div>}
                      {mentorFeedback.optimizations?.length > 0 && <div><h3 className="text-yellow-400 font-semibold mb-1">Optimizations</h3><ul className="space-y-1">{mentorFeedback.optimizations.map((o,i) => <li key={i} className="text-gray-300 text-xs">• {o}</li>)}</ul></div>}
                      {mentorFeedback.alternativeApproach && <div><h3 className="text-green-400 font-semibold mb-1">Alternative Approach</h3><p className="text-gray-300 text-xs leading-relaxed">{mentorFeedback.alternativeApproach}</p></div>}
                      {mentorFeedback.learningPath?.length > 0 && <div><h3 className="text-purple-400 font-semibold mb-1">Learning Path</h3><ul className="space-y-1">{mentorFeedback.learningPath.map((l,i) => <li key={i} className="text-gray-300 text-xs">• {l}</li>)}</ul></div>}
                    </div>
                  ) : (
                    <div className="text-center mt-8">
                      <p className="text-gray-500 mb-3">Get AI mentor feedback on your solution</p>
                      <button onClick={handleMentor} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Generate Feedback</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Monaco */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={v => setCode(v || '')}
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 2, wordWrap: 'on' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Problem List ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
      {showExternal && selectedProblem && (
        <ExternalModal problem={selectedProblem} onClose={() => setShowExternal(false)} onMarkStatus={handleMarkStatus} />
      )}

      <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><RiCodeLine className="text-indigo-400" /> DSA Arena</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} problems • {solvedCount} solved • {attemptedCount} attempted</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            <RiFilterLine /> Filters
          </button>
        </div>
        <div className="relative mt-3">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search problems..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 text-gray-200 rounded-xl border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm" />
        </div>
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: 'difficulty', label: 'Difficulty', opts: [{ v: 'easy', l: 'Easy' }, { v: 'medium', l: 'Medium' }, { v: 'hard', l: 'Hard' }] },
              { key: 'source', label: 'Source', opts: [{ v: 'internal', l: 'Solvable Here' }, { v: 'external', l: 'External' }] },
            ].map(({ key, label, opts }) => (
              <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                className="bg-gray-800 text-gray-300 text-sm rounded-lg px-2 py-1 border border-gray-700 focus:outline-none">
                <option value="">All {label}</option>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            ))}
            <select value={filters.topic} onChange={e => setFilters(f => ({ ...f, topic: e.target.value }))}
              className="bg-gray-800 text-gray-300 text-sm rounded-lg px-2 py-1 border border-gray-700 focus:outline-none max-w-[180px]">
              <option value="">All Topics</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filters.company} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))}
              className="bg-gray-800 text-gray-300 text-sm rounded-lg px-2 py-1 border border-gray-700 focus:outline-none max-w-[180px]">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {Object.values(filters).some(Boolean) && (
              <button onClick={() => setFilters({ difficulty: '', topic: '', company: '', source: '' })}
                className="px-2 py-1 text-xs text-red-400 hover:text-red-300">Clear All</button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500 mt-16">Loading problems...</div>
        ) : problems.length === 0 ? (
          <div className="text-center text-gray-500 mt-16">No problems found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800/95 backdrop-blur z-10">
              <tr className="text-gray-500 text-left text-xs uppercase tracking-wide">
                <th className="pl-6 pr-2 py-2 w-8">#</th>
                <th className="px-2 py-2 w-10">Status</th>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2 w-24">Difficulty</th>
                <th className="px-2 py-2 hidden md:table-cell">Topic</th>
                <th className="px-2 py-2 hidden lg:table-cell">Companies</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {problems.map((p, i) => (
                <tr key={p._id} onClick={() => openProblem(p)}
                  className="hover:bg-gray-800/40 cursor-pointer transition-colors group">
                  <td className="pl-6 pr-2 py-3 text-gray-600 text-xs">{i + 1}</td>
                  <td className="px-2 py-3 text-center">
                    <span className={`font-bold ${STATUS_COLOR[p.status] || STATUS_COLOR.unsolved}`}>
                      {STATUS_ICON[p.status] || STATUS_ICON.unsolved}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span className="text-gray-200 font-medium group-hover:text-white">{p.title}</span>
                    {p.source === 'external' && <RiExternalLinkLine className="inline ml-1 text-gray-600 text-xs" />}
                  </td>
                  <td className="px-2 py-3">
                    <span className={`text-xs font-semibold capitalize ${DIFF_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                  </td>
                  <td className="px-2 py-3 hidden md:table-cell text-gray-500 text-xs">{p.topic}</td>
                  <td className="px-2 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(p.companies || []).slice(0, 2).map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{c}</span>
                      ))}
                      {(p.companies || []).length > 2 && <span className="text-gray-600 text-xs">+{p.companies.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <button onClick={e => handleBookmark(p, e)} className="text-gray-600 hover:text-yellow-400 transition-colors opacity-0 group-hover:opacity-100">
                      {p.bookmarked ? <RiBookmarkFill className="text-yellow-400 opacity-100" /> : <RiBookmarkLine />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
