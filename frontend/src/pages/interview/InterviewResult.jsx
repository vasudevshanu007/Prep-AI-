import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { interviewAPI, reportAPI } from '../../services/api';
import { RiTrophyLine, RiArrowRightLine, RiRefreshLine, RiCheckLine, RiCloseLine, RiDownload2Line } from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function ScoreCircle({ score, size = 120 }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1f2937" strokeWidth="10" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black text-white">{score}</p>
        <p className="text-gray-400 text-xs">/ 10</p>
      </div>
    </div>
  );
}

export default function InterviewResult() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { data } = await reportAPI.download(id);
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `PrepAI_Report_${interview.role.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await interviewAPI.getById(id);
        setInterview(res.data.interview);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading results..." /></div>;
  if (!interview) return <div className="text-center py-20 text-gray-400">Interview not found.</div>;

  const grade = interview.overallScore >= 9 ? 'A+' : interview.overallScore >= 8 ? 'A' : interview.overallScore >= 7 ? 'B+' : interview.overallScore >= 6 ? 'B' : interview.overallScore >= 5 ? 'C' : 'D';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center">
        <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <RiTrophyLine className="text-white text-3xl" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Interview Complete!</h1>
        <p className="text-gray-400 text-sm">{interview.role} · {new Date(interview.completedAt).toLocaleDateString()}</p>

        <div className="flex items-center justify-center gap-12 mt-8">
          <div className="text-center">
            <ScoreCircle score={interview.overallScore} />
            <p className="text-gray-400 text-sm mt-2">Overall</p>
          </div>
          <div className="space-y-3 text-left">
            <div>
              <p className="text-gray-400 text-xs mb-1">Grade</p>
              <p className={`text-3xl font-black ${interview.overallScore >= 7 ? 'text-green-400' : interview.overallScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{grade}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Technical</p>
              <p className="text-white font-bold">{interview.technicalScore}/10</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Questions</p>
              <p className="text-white font-bold">{interview.questions.filter((q) => q.userAnswer).length}/{interview.questions.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Feedback */}
      {interview.aiFeedback?.summary && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">AI Assessment</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{interview.aiFeedback.summary}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-4">
              <p className="text-green-400 font-medium text-sm mb-2">Key Strengths</p>
              <ul className="space-y-1">
                {interview.aiFeedback.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <RiCheckLine className="text-green-400 flex-shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-orange-900/10 border border-orange-900/30 rounded-xl p-4">
              <p className="text-orange-400 font-medium text-sm mb-2">Areas to Improve</p>
              <ul className="space-y-1">
                {interview.aiFeedback.improvements?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <RiArrowRightLine className="text-orange-400 flex-shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {interview.aiFeedback.recommendedTopics?.length > 0 && (
            <div className="mt-4 p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl">
              <p className="text-blue-400 font-medium text-sm mb-2">Recommended Study Topics</p>
              <div className="flex flex-wrap gap-2">
                {interview.aiFeedback.recommendedTopics.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-900/30 border border-blue-800/50 rounded-full text-blue-300 text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Questions review */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4">Question Review</h3>
        <div className="space-y-3">
          {interview.questions.map((q, i) => (
            <details key={i} className="group">
              <summary className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700/80 transition-colors list-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${q.aiEvaluation?.score >= 7 ? 'bg-green-700 text-white' : q.aiEvaluation?.score >= 5 ? 'bg-yellow-700 text-white' : q.aiEvaluation?.score > 0 ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {i + 1}
                </div>
                <p className="text-gray-200 text-sm flex-1 line-clamp-1">{q.question}</p>
                {q.aiEvaluation?.score > 0 ? (
                  <span className={`text-sm font-bold flex-shrink-0 ${q.aiEvaluation.score >= 7 ? 'text-green-400' : q.aiEvaluation.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {q.aiEvaluation.score}/10
                  </span>
                ) : (
                  <span className="text-gray-600 text-sm flex-shrink-0">Skipped</span>
                )}
              </summary>
              <div className="mt-2 p-4 bg-gray-800/50 rounded-xl space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                  <p className="text-gray-300 text-sm">{q.userAnswer || 'No answer provided'}</p>
                </div>
                {q.aiEvaluation?.feedback && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">AI Feedback</p>
                    <p className="text-gray-300 text-sm">{q.aiEvaluation.feedback}</p>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/interview/generate" className="btn-primary flex-1 flex items-center justify-center gap-2">
          <RiRefreshLine /> New Interview
        </Link>
        <Link to="/analytics" className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <RiArrowRightLine /> View Analytics
        </Link>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-900 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <RiDownload2Line /> {downloading ? 'Generating PDF...' : 'Download Report'}
        </button>
      </div>
    </div>
  );
}
