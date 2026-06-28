import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchInterviewHistory } from '../redux/slices/interviewSlice';
import { motion } from 'framer-motion';
import { RiMicLine, RiTimeLine, RiArrowRightLine, RiTrophyLine } from 'react-icons/ri';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DIFF_COLORS = { easy: 'badge-easy', medium: 'badge-medium', hard: 'badge-hard' };

export default function History() {
  const dispatch = useDispatch();
  const { history, pagination, loading } = useSelector((s) => s.interview);

  useEffect(() => {
    dispatch(fetchInterviewHistory({ page: 1, limit: 20 }));
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Interview History</h1>
        <p className="text-gray-400 text-sm mt-1">Review your past interviews and performance</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : history.length === 0 ? (
        <div className="card text-center py-16">
          <RiTrophyLine className="text-gray-700 text-5xl mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No interviews yet</p>
          <p className="text-gray-600 text-sm mt-1">Start your first AI interview to see history here</p>
          <Link to="/interview/generate" className="btn-primary inline-block mt-6">Generate Interview</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((interview, i) => (
            <motion.div
              key={interview._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/interview/result/${interview._id}`}>
                <div className="card-hover flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${interview.status === 'completed' ? 'bg-blue-900/40' : 'bg-gray-800'}`}>
                    <RiMicLine className={interview.status === 'completed' ? 'text-blue-400 text-xl' : 'text-gray-500 text-xl'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{interview.role}</h3>
                      <span className={DIFF_COLORS[interview.difficulty]}>{interview.difficulty}</span>
                      {interview.status !== 'completed' && (
                        <span className="badge bg-gray-700 text-gray-400 border border-gray-600">{interview.status}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <RiTimeLine /> {new Date(interview.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span>{interview.questions?.length || 0} questions</span>
                      {interview.skills?.length > 0 && (
                        <span className="hidden sm:block truncate max-w-[160px]">{interview.skills.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {interview.status === 'completed' && (
                      <div className="text-right">
                        <p className={`text-lg font-bold ${interview.overallScore >= 7 ? 'text-green-400' : interview.overallScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {interview.overallScore}/10
                        </p>
                        <p className="text-gray-600 text-xs">Score</p>
                      </div>
                    )}
                    <RiArrowRightLine className="text-gray-600" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
