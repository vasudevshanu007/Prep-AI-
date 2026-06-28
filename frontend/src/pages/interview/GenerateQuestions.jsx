import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuestions, submitAnswer, completeInterview, setCurrentQuestion, clearCurrentInterview } from '../../redux/slices/interviewSlice';
import {
  RiRobotLine, RiCheckLine, RiTimeLine, RiArrowRightLine,
  RiArrowLeftLine, RiStarLine, RiTrophyLine, RiRefreshLine,
} from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Mobile Developer', 'System Design Engineer', 'Software Engineer', 'Product Manager'];
const SKILL_OPTIONS = ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'AWS', 'Docker', 'System Design', 'Data Structures', 'Algorithms', 'Machine Learning'];

function QuestionCard({ question, index, total, onSubmit, submitting, currentAnswer, setCurrentAnswer, evaluation }) {
  const typeColors = { technical: 'badge-medium', hr: 'bg-blue-900/50 text-blue-400 border border-blue-800 badge', scenario: 'bg-purple-900/50 text-purple-400 border border-purple-800 badge', behavioral: 'bg-green-900/50 text-green-400 border border-green-800 badge' };

  return (
    <motion.div key={index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={typeColors[question.type] || 'badge bg-gray-800 text-gray-400 border border-gray-700'}>{question.type}</span>
          <span className={question.difficulty === 'easy' ? 'badge-easy' : question.difficulty === 'hard' ? 'badge-hard' : 'badge-medium'}>
            {question.difficulty}
          </span>
        </div>
        <span className="text-gray-500 text-sm">{index + 1} / {total}</span>
      </div>

      <div className="card bg-gray-800/80">
        <p className="text-gray-100 text-base leading-relaxed">{question.question}</p>
      </div>

      {evaluation ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className={`p-4 rounded-xl border ${evaluation.score >= 7 ? 'bg-green-900/20 border-green-800' : evaluation.score >= 5 ? 'bg-yellow-900/20 border-yellow-800' : 'bg-red-900/20 border-red-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">Your Score</span>
              <span className={`text-2xl font-black ${evaluation.score >= 7 ? 'text-green-400' : evaluation.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {evaluation.score}/10
              </span>
            </div>
            <p className="text-gray-300 text-sm">{evaluation.feedback}</p>
          </div>

          {evaluation.strengths?.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-4">
                <p className="text-green-400 font-medium text-sm mb-2">Strengths</p>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => <li key={i} className="text-gray-300 text-sm flex items-start gap-2"><RiCheckLine className="text-green-400 flex-shrink-0 mt-0.5" />{s}</li>)}
                </ul>
              </div>
              <div className="bg-orange-900/10 border border-orange-900/30 rounded-xl p-4">
                <p className="text-orange-400 font-medium text-sm mb-2">Improvements</p>
                <ul className="space-y-1">
                  {evaluation.improvements?.map((s, i) => <li key={i} className="text-gray-300 text-sm flex items-start gap-2"><RiArrowRightLine className="text-orange-400 flex-shrink-0 mt-0.5" />{s}</li>)}
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div>
          <label className="label">Your Answer</label>
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="input-field resize-none"
          />
          <button onClick={() => onSubmit(currentAnswer)} disabled={submitting || !currentAnswer.trim()} className="btn-primary w-full mt-3">
            {submitting ? <LoadingSpinner size="sm" /> : 'Submit Answer & Get AI Feedback'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function GenerateQuestions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentInterview, currentQuestionIndex, generatingQuestions, submittingAnswer, loading } = useSelector((s) => s.interview);

  const [config, setConfig] = useState({ role: '', skills: [], difficulty: 'medium', count: 8, interviewType: 'mixed' });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [startTime] = useState(Date.now());
  const [completing, setCompleting] = useState(false);

  const toggleSkill = (skill) => {
    setConfig((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!config.role) return toast.error('Please select or enter a role');
    await dispatch(generateQuestions(config));
    setEvaluation(null);
    setCurrentAnswer('');
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return toast.error('Please write your answer');
    const result = await dispatch(submitAnswer({
      id: currentInterview._id,
      data: { questionIndex: currentQuestionIndex, userAnswer: currentAnswer, timeSpent: Math.round((Date.now() - startTime) / 1000) },
    }));
    if (submitAnswer.fulfilled.match(result)) {
      setEvaluation(result.payload.evaluation);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentInterview.questions.length - 1) {
      dispatch(setCurrentQuestion(currentQuestionIndex + 1));
      setCurrentAnswer('');
      setEvaluation(null);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestion(currentQuestionIndex - 1));
      setCurrentAnswer(currentInterview.questions[currentQuestionIndex - 1].userAnswer || '');
      setEvaluation(currentInterview.questions[currentQuestionIndex - 1].aiEvaluation?.score > 0 ? currentInterview.questions[currentQuestionIndex - 1].aiEvaluation : null);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    const result = await dispatch(completeInterview({
      id: currentInterview._id,
      data: { duration: Math.round((Date.now() - startTime) / 60000) },
    }));
    setCompleting(false);
    if (completeInterview.fulfilled.match(result)) {
      toast.success('Interview completed!');
      navigate(`/interview/result/${currentInterview._id}`);
    }
  };

  const handleReset = () => {
    dispatch(clearCurrentInterview());
    setConfig({ role: '', skills: [], difficulty: 'medium', count: 8, interviewType: 'mixed' });
    setEvaluation(null);
    setCurrentAnswer('');
  };

  // Result / Interview in progress
  if (currentInterview) {
    const question = currentInterview.questions[currentQuestionIndex];
    const answeredCount = currentInterview.questions.filter((q) => q.userAnswer).length;
    const isLast = currentQuestionIndex === currentInterview.questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold text-sm">{currentInterview.role} Interview</h2>
            <button onClick={handleReset} className="text-gray-500 hover:text-gray-300 flex items-center gap-1 text-xs">
              <RiRefreshLine /> New Interview
            </button>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${((answeredCount) / currentInterview.questions.length) * 100}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">{answeredCount}/{currentInterview.questions.length} answered</p>
        </div>

        {/* Question */}
        <div className="card">
          <AnimatePresence mode="wait">
            <QuestionCard
              key={currentQuestionIndex}
              question={question}
              index={currentQuestionIndex}
              total={currentInterview.questions.length}
              onSubmit={handleSubmitAnswer}
              submitting={submittingAnswer}
              currentAnswer={currentAnswer}
              setCurrentAnswer={setCurrentAnswer}
              evaluation={evaluation}
            />
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
            <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="btn-secondary py-2 px-4 flex items-center gap-2 disabled:opacity-40">
              <RiArrowLeftLine /> Prev
            </button>
            <div className="flex gap-1">
              {currentInterview.questions.map((q, i) => (
                <button key={i} onClick={() => { dispatch(setCurrentQuestion(i)); setCurrentAnswer(q.userAnswer || ''); setEvaluation(q.aiEvaluation?.score > 0 ? q.aiEvaluation : null); }}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${i === currentQuestionIndex ? 'bg-primary-500 text-white' : q.userAnswer ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {isLast ? (
              <button onClick={handleComplete} disabled={completing} className="btn-primary py-2 px-4 flex items-center gap-2">
                {completing ? <LoadingSpinner size="sm" /> : <><RiTrophyLine /> Finish</>}
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary py-2 px-4 flex items-center gap-2">
                Next <RiArrowRightLine />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Setup form
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RiRobotLine className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Interview Generator</h1>
          <p className="text-gray-400 text-sm mt-2">Configure your interview and get AI-generated questions with real-time feedback</p>
        </div>

        <div className="card space-y-6">
          <div>
            <label className="label">Target Role *</label>
            <input
              type="text"
              placeholder="e.g. Frontend Developer, Data Scientist..."
              value={config.role}
              onChange={(e) => setConfig({ ...config, role: e.target.value })}
              className="input-field"
              list="roles-list"
            />
            <datalist id="roles-list">
              {ROLES.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>

          <div>
            <label className="label">Select Skills (optional)</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${config.skills.includes(skill) ? 'bg-primary-500/20 text-primary-400 border-primary-500/50' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Difficulty</label>
              <select value={config.difficulty} onChange={(e) => setConfig({ ...config, difficulty: e.target.value })} className="input-field">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label">Questions</label>
              <select value={config.count} onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })} className="input-field">
                {[5, 8, 10, 12, 15].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Interview Type</label>
              <select value={config.interviewType} onChange={(e) => setConfig({ ...config, interviewType: e.target.value })} className="input-field">
                <option value="mixed">Mixed</option>
                <option value="technical">Technical</option>
                <option value="hr">HR/Behavioral</option>
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generatingQuestions || !config.role} className="btn-primary w-full flex items-center justify-center gap-2">
            {generatingQuestions ? <><LoadingSpinner size="sm" /> Generating Questions...</> : <><RiStarLine /> Generate Interview Questions</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
