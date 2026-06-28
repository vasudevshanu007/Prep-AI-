import { useState, useEffect } from 'react';
import { dsaAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { RiTrophyLine, RiTimeLine, RiUserLine, RiCalendarLine, RiLockLine } from 'react-icons/ri';

const TYPE_BADGE = {
  weekly:     'bg-blue-900/40 text-blue-400 border-blue-800',
  monthly:    'bg-purple-900/40 text-purple-400 border-purple-800',
  'mock-oa':  'bg-orange-900/40 text-orange-400 border-orange-800',
  'company-oa': 'bg-green-900/40 text-green-400 border-green-800',
};

const TYPE_LABEL = {
  weekly:     'Weekly',
  monthly:    'Monthly',
  'mock-oa':  'Mock OA',
  'company-oa': 'Company OA',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatus(contest) {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end   = new Date(contest.endTime).getTime();
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'active';
  return 'past';
}

function ContestCard({ contest }) {
  const status = getStatus(contest);
  const statusStyles = {
    upcoming: 'border-gray-700 bg-gray-800/50',
    active:   'border-indigo-600/50 bg-indigo-950/30 shadow-lg shadow-indigo-900/20',
    past:     'border-gray-800 bg-gray-900/50 opacity-70',
  };

  return (
    <div className={`rounded-xl border p-5 transition-all ${statusStyles[status]}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {status === 'active' && (
              <span className="flex items-center gap-1 bg-green-900/40 text-green-400 border border-green-800 text-xs px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            )}
            {status === 'upcoming' && (
              <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-900/40 text-blue-400 border-blue-800">Upcoming</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_BADGE[contest.type] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              {TYPE_LABEL[contest.type] || contest.type}
            </span>
            {contest.company && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-400">{contest.company}</span>
            )}
          </div>
          <h3 className="text-white font-semibold text-lg leading-tight">{contest.title}</h3>
          {contest.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{contest.description}</p>
          )}
        </div>
        <RiTrophyLine className={`text-2xl flex-shrink-0 ${status === 'active' ? 'text-yellow-400' : 'text-gray-600'}`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-gray-500">
          <RiCalendarLine className="text-gray-600" />
          <span>{formatDate(contest.startTime)}</span>
        </div>
        {contest.duration && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <RiTimeLine className="text-gray-600" />
            <span>{contest.duration} min</span>
          </div>
        )}
        {contest.participants !== undefined && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <RiUserLine className="text-gray-600" />
            <span>{contest.participants} participants</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-gray-600 text-xs">{contest.problems?.length || 0} problems</span>
        {status === 'active' ? (
          <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
            Enter Contest
          </button>
        ) : status === 'upcoming' ? (
          <button className="px-4 py-1.5 border border-indigo-600/50 text-indigo-400 hover:bg-indigo-950/40 rounded-lg text-sm font-medium transition-colors">
            Register
          </button>
        ) : (
          <button className="px-4 py-1.5 border border-gray-700 text-gray-500 rounded-lg text-sm cursor-default">
            View Results
          </button>
        )}
      </div>
    </div>
  );
}

export default function DSAContests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    dsaAPI.getContests()
      .then(r => { setContests(r.data.contests || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load contests'); setLoading(false); });
  }, []);

  const statusGroups = {
    active:   contests.filter(c => getStatus(c) === 'active'),
    upcoming: contests.filter(c => getStatus(c) === 'upcoming'),
    past:     contests.filter(c => getStatus(c) === 'past'),
  };

  const filtered = contests.filter(c => {
    const matchTab  = tab === 'all' || getStatus(c) === tab;
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchTab && matchType;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading contests...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Contests</h1>
          <p className="text-gray-500 mt-1">Weekly challenges, mock OAs, and company-style contests</p>
        </div>
      </div>

      {/* Live contests banner */}
      {statusGroups.active.length > 0 && (
        <div className="mb-6 bg-indigo-950/50 border border-indigo-600/40 rounded-xl p-4 flex items-center gap-3">
          <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-indigo-300 font-medium">{statusGroups.active.length} contest{statusGroups.active.length > 1 ? 's' : ''} live right now!</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-1 bg-gray-800/50 border border-gray-700 rounded-xl p-1">
          {[['all', 'All'], ['active', 'Live'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {label}
              {id !== 'all' && statusGroups[id]?.length > 0 && (
                <span className="ml-1 bg-white/20 text-white text-xs rounded-full px-1.5">{statusGroups[id].length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-800/50 border border-gray-700 rounded-xl p-1">
          {[['all', 'All Types'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['mock-oa', 'Mock OA'], ['company-oa', 'Company OA']].map(([id, label]) => (
            <button key={id} onClick={() => setTypeFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contest list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <RiTrophyLine className="text-5xl text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No contests found.</p>
          <p className="text-gray-600 text-sm mt-1">Check back later for upcoming contests!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => <ContestCard key={c._id || c.slug} contest={c} />)}
        </div>
      )}
    </div>
  );
}
