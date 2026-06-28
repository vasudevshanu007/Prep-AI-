import { useState, useEffect } from 'react';
import { dsaAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { RiTrophyLine, RiFireLine, RiBookmarkLine, RiArrowRightLine } from 'react-icons/ri';

const DIFF_BAR = { easy: 'bg-green-500', medium: 'bg-yellow-500', hard: 'bg-red-500' };
const DIFF_TEXT = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-white font-medium mt-1">{label}</div>
      {sub && <div className="text-gray-500 text-sm mt-0.5">{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-indigo-500' }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-400 text-xs w-16 text-right">{value}/{max}</span>
    </div>
  );
}

export default function DSAProgress() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('overview');

  useEffect(() => {
    dsaAPI.getProgress()
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load progress'); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading progress...</div>;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Could not load progress data.</p>
        <Link to="/coding" className="text-indigo-400 mt-2 text-sm">Go solve some problems →</Link>
      </div>
    );
  }

  const { overview, topicBreakdown = [], companyReadiness = [], sheetProgress = [] } = data;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'topics',   label: 'Topic Mastery' },
    { id: 'company',  label: 'Company Readiness' },
    { id: 'sheets',   label: 'Sheet Progress' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Progress</h1>
          <p className="text-gray-500 mt-1">Track your DSA preparation journey</p>
        </div>
        <Link to="/coding" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm">
          Practice now <RiArrowRightLine />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 mb-6 border border-gray-700">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Solved" value={overview?.solved || 0} color="text-green-400" sub="problems" />
            <StatCard label="Attempted" value={overview?.attempted || 0} color="text-yellow-400" sub="problems" />
            <StatCard label="Bookmarked" value={overview?.bookmarked || 0} color="text-indigo-400" sub="problems" />
            <StatCard label="Total" value={overview?.total || 0} color="text-gray-300" sub="in platform" />
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-4">
            <h2 className="text-white font-semibold mb-4">By Difficulty</h2>
            <div className="space-y-4">
              {(['easy', 'medium', 'hard']).map(d => {
                const s = overview?.byDifficulty?.[d] || { solved: 0, total: 0 };
                return (
                  <div key={d}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm font-semibold capitalize ${DIFF_TEXT[d]}`}>{d}</span>
                      <span className="text-gray-500 text-sm">{s.solved}/{s.total}</span>
                    </div>
                    <ProgressBar value={s.solved} max={s.total} color={DIFF_BAR[d]} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-3">Recent Activity</h2>
            {(overview?.recentActivity || []).length === 0 ? (
              <p className="text-gray-600 text-sm">No activity yet. <Link to="/coding" className="text-indigo-400">Start solving!</Link></p>
            ) : (
              <div className="space-y-2">
                {overview.recentActivity.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'solved' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className="text-gray-300 flex-1">{a.problemTitle || 'Problem'}</span>
                    <span className={`text-xs font-semibold ${DIFF_TEXT[a.difficulty] || 'text-gray-500'}`}>{a.difficulty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topic Mastery */}
      {tab === 'topics' && (
        <div className="space-y-3">
          {topicBreakdown.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>No topic data yet.</p>
              <Link to="/coding" className="text-indigo-400 text-sm mt-1 block">Start solving problems!</Link>
            </div>
          ) : topicBreakdown.map(topic => (
            <div key={topic.topic} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{topic.topic}</span>
                <span className={`text-sm font-bold ${topic.mastery >= 70 ? 'text-green-400' : topic.mastery >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {topic.mastery}%
                </span>
              </div>
              <ProgressBar
                value={topic.solved}
                max={topic.total}
                color={topic.mastery >= 70 ? 'bg-green-500' : topic.mastery >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
              />
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="text-green-400">{topic.solved} solved</span>
                <span className="text-yellow-400">{topic.attempted} attempted</span>
                <span>{topic.total} total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Readiness */}
      {tab === 'company' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companyReadiness.length === 0 ? (
            <div className="col-span-2 text-center text-gray-500 py-12">
              <p>Solve company-tagged problems to see readiness scores.</p>
            </div>
          ) : companyReadiness.map(c => (
            <div key={c.company} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{c.company}</h3>
                <span className={`text-lg font-bold ${c.readiness >= 70 ? 'text-green-400' : c.readiness >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {c.readiness}%
                </span>
              </div>
              <ProgressBar
                value={c.solved}
                max={c.total}
                color={c.readiness >= 70 ? 'bg-green-500' : c.readiness >= 40 ? 'bg-yellow-500' : 'bg-red-500'}
              />
              <p className="text-gray-500 text-xs mt-2">{c.solved}/{c.total} problems solved</p>
            </div>
          ))}
        </div>
      )}

      {/* Sheet Progress */}
      {tab === 'sheets' && (
        <div className="space-y-4">
          {sheetProgress.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>No sheet progress yet.</p>
              <Link to="/coding/sheets" className="text-indigo-400 text-sm mt-1 block">Browse DSA Sheets →</Link>
            </div>
          ) : sheetProgress.map(s => (
            <Link key={s.slug} to={`/coding/sheets/${s.slug}`}
              className="flex items-center gap-4 bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-xl p-5 transition-all group">
              <div className="text-3xl">{s.icon || '📚'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold group-hover:text-indigo-300 transition-colors">{s.name}</span>
                  <span className="text-white font-bold text-sm">{s.pct}%</span>
                </div>
                <ProgressBar value={s.solved} max={s.total} />
                <p className="text-gray-500 text-xs mt-1">{s.solved}/{s.total} completed</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
