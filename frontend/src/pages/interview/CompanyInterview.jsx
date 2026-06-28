import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI } from '../../services/api';

const DIFF_COLOR = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };

const CompanyCard = ({ company, onSelect }) => (
  <button
    onClick={() => onSelect(company)}
    className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500 rounded-xl p-5 text-left transition-all group"
  >
    <div className="flex items-center gap-3 mb-3">
      <span className="text-3xl">{company.emoji}</span>
      <div>
        <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{company.name}</h3>
        <span className={`text-xs font-medium capitalize ${DIFF_COLOR[company.difficulty]}`}>{company.difficulty}</span>
      </div>
    </div>
    <p className="text-gray-400 text-sm leading-relaxed mb-3">{company.description}</p>
    <div className="flex flex-wrap gap-1">
      {company.focusAreas.slice(0, 3).map((a) => (
        <span key={a} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{a}</span>
      ))}
    </div>
  </button>
);

const GenerateModal = ({ company, onClose, onGenerate }) => {
  const [role, setRole]   = useState('Software Engineer');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await companyAPI.generateInterview(company.id, { targetRole: role, count });
      onGenerate(data.interview._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate interview.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{company.emoji}</span>
          <div>
            <h2 className="font-bold text-white text-lg">{company.name} Interview</h2>
            <p className="text-gray-400 text-sm">{company.rounds.length} rounds</p>
          </div>
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Number of Questions: {count}</label>
            <input
              type="range"
              min={5}
              max={15}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1"><span>5</span><span>15</span></div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3 mb-5">
          <p className="text-xs text-gray-400 font-medium mb-2">Interview Rounds</p>
          <div className="space-y-1">
            {company.rounds.map((r, i) => (
              <div key={r} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="w-5 h-5 bg-indigo-700 text-indigo-200 rounded-full text-xs flex items-center justify-center">{i + 1}</span>
                {r}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-3 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Generating...' : 'Start Interview'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CompanyInterview() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    companyAPI.getAll()
      .then(({ data }) => setCompanies(data.companies))
      .catch(() => setError('Failed to load companies.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400">Loading companies...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Company-Specific Interviews</h1>
          <p className="text-gray-400 mt-1">Practice with questions tailored to real company interview patterns</p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {companies.map((c) => (
            <CompanyCard key={c.id} company={c} onSelect={setSelected} />
          ))}
        </div>
      </div>

      {selected && (
        <GenerateModal
          company={selected}
          onClose={() => setSelected(null)}
          onGenerate={(interviewId) => navigate(`/interview/${interviewId}`)}
        />
      )}
    </div>
  );
}
