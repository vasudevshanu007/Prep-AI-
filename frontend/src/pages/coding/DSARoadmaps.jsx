import { useState, useEffect } from 'react';
import { dsaAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { RiArrowRightLine, RiCheckLine, RiTimeLine, RiFlashlightLine } from 'react-icons/ri';

const PATH_COLORS = {
  beginner:     { bg: 'from-green-600 to-teal-600',   badge: 'bg-green-900/40 text-green-400 border-green-800' },
  intermediate: { bg: 'from-blue-600 to-indigo-600',  badge: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  faang:        { bg: 'from-indigo-600 to-purple-600', badge: 'bg-indigo-900/40 text-indigo-400 border-indigo-800' },
  service:      { bg: 'from-orange-600 to-red-600',   badge: 'bg-orange-900/40 text-orange-400 border-orange-800' },
  startup:      { bg: 'from-pink-600 to-rose-600',    badge: 'bg-pink-900/40 text-pink-400 border-pink-800' },
};

const LEVEL_COLOR = {
  easy:   'bg-green-900/30 text-green-400 border-green-800',
  medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  hard:   'bg-red-900/30 text-red-400 border-red-800',
};

export default function DSARoadmaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    dsaAPI.getRoadmaps()
      .then(r => {
        const data = r.data.roadmaps || [];
        setRoadmaps(data);
        if (data.length > 0) setSelected(data[0].id);
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load roadmaps'); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading roadmaps...</div>;
  }

  const current = roadmaps.find(r => r.id === selected);
  const colors   = PATH_COLORS[selected] || PATH_COLORS.beginner;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-2">Learning Roadmaps</h1>
      <p className="text-gray-500 mb-6">Structured paths to master DSA for your target role</p>

      {/* Path selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {roadmaps.map(r => (
          <button key={r.id} onClick={() => setSelected(r.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selected === r.id
                ? `bg-gradient-to-r ${PATH_COLORS[r.id]?.bg || 'from-indigo-600 to-purple-600'} text-white border-transparent`
                : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
            }`}>
            {r.title}
          </button>
        ))}
      </div>

      {current && (
        <>
          {/* Hero card */}
          <div className={`rounded-2xl bg-gradient-to-r ${colors.bg} p-6 mb-6`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{current.title}</h2>
                <p className="text-white/70 mt-1">{current.description}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-white/70 text-sm">
                  <span className="flex items-center gap-1"><RiTimeLine /> {current.duration}</span>
                  <span className="flex items-center gap-1"><RiFlashlightLine /> {current.totalTopics} topics</span>
                  <span className="flex items-center gap-1"><RiCheckLine /> {current.problems}+ problems</span>
                </div>
              </div>
              <Link to="/coding"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap">
                Start Practicing <RiArrowRightLine />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {(current.targetRoles || []).map(role => (
                <span key={role} className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{role}</span>
              ))}
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-4">
            {(current.phases || []).map((phase, phaseIdx) => (
              <div key={phaseIdx} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {phaseIdx + 1}
                  </div>
                  <div>
                    <span className="text-white font-semibold">{phase.title}</span>
                    {phase.duration && <span className="text-gray-500 text-sm ml-2">• {phase.duration}</span>}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(phase.topics || []).map((t, ti) => (
                    <div key={ti} className="flex items-start gap-3 bg-gray-900/40 rounded-lg p-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {ti + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-200 text-sm font-medium">{t.name}</span>
                          {t.level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_COLOR[t.level] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                              {t.level}
                            </span>
                          )}
                        </div>
                        {t.problems > 0 && (
                          <span className="text-gray-500 text-xs">{t.problems} problems</span>
                        )}
                        {t.description && (
                          <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{t.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
