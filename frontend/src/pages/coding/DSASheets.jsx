import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dsaAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  RiArrowLeftLine, RiCheckLine, RiExternalLinkLine,
  RiBookmarkLine, RiBookmarkFill, RiFireLine,
} from 'react-icons/ri';

const DIFF_COLORS = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };
const STATUS_COLOR = { solved: 'text-green-400', attempted: 'text-yellow-400', unsolved: 'text-gray-600' };
const STATUS_ICON  = { solved: '✓', attempted: '~', unsolved: '○' };

const SHEET_COLORS = {
  'neetcode-150': 'from-indigo-600 to-purple-600',
  'blind-75':     'from-orange-500 to-red-600',
  'grind-75':     'from-green-500 to-teal-600',
  'striver-sde':  'from-red-500 to-pink-600',
  'love-babbar':  'from-purple-500 to-indigo-600',
  'apna-college': 'from-cyan-500 to-blue-600',
};

export default function DSASheets() {
  const { slug } = useParams();
  const [sheets, setSheets]         = useState([]);
  const [sheet, setSheet]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [expandedCats, setExpandedCats] = useState({});

  useEffect(() => {
    if (slug) {
      setLoading(true);
      dsaAPI.getSheetBySlug(slug)
        .then(r => { setSheet(r.data.sheet); setLoading(false); })
        .catch(() => { toast.error('Sheet not found'); setLoading(false); });
    } else {
      setLoading(true);
      dsaAPI.getSheets()
        .then(r => { setSheets(r.data.sheets || []); setLoading(false); })
        .catch(() => { toast.error('Failed to load sheets'); setLoading(false); });
    }
  }, [slug]);

  const toggleCat = (id) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  }

  // ── Sheet Detail ─────────────────────────────────────────────────────────────
  if (slug && sheet) {
    const allProblems = sheet.categories?.flatMap(c => c.problems) || [];
    const solved  = allProblems.filter(p => p.status === 'solved').length;
    const total   = allProblems.length;
    const pct     = total ? Math.round((solved / total) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/coding/sheets" className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 w-fit">
          <RiArrowLeftLine /> All Sheets
        </Link>

        <div className={`rounded-2xl bg-gradient-to-r ${SHEET_COLORS[sheet.slug] || 'from-indigo-600 to-purple-600'} p-6 mb-6`}>
          <div className="text-4xl mb-2">{sheet.icon || '📚'}</div>
          <h1 className="text-3xl font-bold text-white mb-1">{sheet.name}</h1>
          <p className="text-white/70 mb-4">{sheet.description}</p>
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm">{solved}/{total} solved</span>
            <div className="flex-1 h-2 bg-white/20 rounded-full max-w-xs">
              <div className="h-2 bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-white font-bold">{pct}%</span>
          </div>
          {sheet.author && <p className="text-white/60 text-xs mt-2">by {sheet.author}</p>}
        </div>

        <div className="space-y-4">
          {(sheet.categories || []).map(cat => {
            const catSolved = cat.problems?.filter(p => p.status === 'solved').length || 0;
            const catTotal  = cat.problems?.length || 0;
            const isOpen    = expandedCats[cat._id] !== false; // open by default

            return (
              <div key={cat._id} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCat(cat._id)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{cat.name}</span>
                    <span className="text-gray-500 text-sm">{catSolved}/{catTotal}</span>
                    {catSolved === catTotal && catTotal > 0 && (
                      <RiCheckLine className="text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-gray-700 rounded-full">
                      <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: catTotal ? `${(catSolved / catTotal) * 100}%` : 0 }} />
                    </div>
                    <span className="text-gray-500 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y divide-gray-700/50">
                    {(cat.problems || []).map((p, i) => (
                      <div key={p._id || p.slug} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/60 group">
                        <span className="text-gray-600 text-xs w-6">{i + 1}</span>
                        <span className={`font-bold w-4 ${STATUS_COLOR[p.status] || STATUS_COLOR.unsolved}`}>
                          {STATUS_ICON[p.status] || STATUS_ICON.unsolved}
                        </span>
                        <span className="flex-1 text-gray-200 group-hover:text-white">{p.title}</span>
                        <span className={`text-xs font-semibold ${DIFF_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                        <span className="text-gray-600 text-xs hidden md:block">{p.topic}</span>
                        {p.source === 'internal' ? (
                          <Link to="/coding" className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-indigo-900/40 text-indigo-400 text-xs rounded transition-opacity">
                            Solve
                          </Link>
                        ) : p.externalUrl ? (
                          <a href={p.externalUrl} target="_blank" rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-gray-400 hover:text-indigo-400 text-xs transition-opacity">
                            <RiExternalLinkLine />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Sheets List ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-white mb-2">DSA Sheets</h1>
      <p className="text-gray-500 mb-8">Curated problem sets from the best DSA content creators</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sheets.map(sheet => (
          <Link key={sheet.slug} to={`/coding/sheets/${sheet.slug}`}
            className="group bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${SHEET_COLORS[sheet.slug] || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-2xl mb-3`}>
              {sheet.icon || '📚'}
            </div>
            <h2 className="text-white font-bold text-lg group-hover:text-indigo-300 transition-colors">{sheet.name}</h2>
            <p className="text-gray-500 text-sm mt-1 mb-3 line-clamp-2">{sheet.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">{sheet.totalProblems} problems</span>
              {sheet.author && <span className="text-gray-600 text-xs">by {sheet.author}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
