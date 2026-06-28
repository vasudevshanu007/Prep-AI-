import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAPI } from '../../services/api';
import {
  RiUploadCloud2Line, RiFileTextLine, RiCheckLine, RiCloseLine,
  RiStarLine, RiAlertLine, RiArrowRightLine, RiDeleteBinLine, RiDownloadLine,
} from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function ScoreBar({ label, score, color = '#667eea' }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-bold">{score}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
        />
      </div>
    </div>
  );
}

function CircleScore({ score, label, size = 100 }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1f2937" strokeWidth="8" fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="8" fill="none"
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-white">{score}</span>
        </div>
      </div>
      <p className="text-gray-400 text-xs">{label}</p>
    </div>
  );
}

export default function ResumeAnalysis() {
  const { user } = useSelector((s) => s.auth);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [mode, setMode] = useState('analyze');
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') return toast.error('Only PDF files are accepted');
    if (f.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');
    setFile(f);
    setAnalysis(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return toast.error('Please select a PDF resume');
    setAnalyzing(true);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await resumeAPI.analyze(formData);
      setAnalysis(res.data.analysis);
      toast.success('Resume analyzed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Ensure the PDF is not scanned.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a PDF resume');
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      await resumeAPI.upload(formData);
      toast.success('Resume uploaded to your profile!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    try {
      await resumeAPI.delete();
      toast.success('Resume removed from profile');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Analysis</h1>
        <p className="text-gray-400 text-sm mt-1">Upload your PDF resume and get instant AI feedback, ATS score, and improvement tips</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'analyze', label: 'AI Analysis' },
          { key: 'upload', label: 'Save to Profile' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setMode(key)} className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${mode === key ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40' : 'text-gray-400 hover:text-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-primary-500 bg-primary-500/5' : file ? 'border-green-600 bg-green-900/10' : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'}`}
      >
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        {file ? (
          <div className="space-y-2">
            <div className="w-14 h-14 bg-green-900/40 rounded-2xl flex items-center justify-center mx-auto">
              <RiFileTextLine className="text-green-400 text-3xl" />
            </div>
            <p className="text-green-400 font-semibold">{file.name}</p>
            <p className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto">
              <RiUploadCloud2Line className="text-gray-400 text-3xl" />
            </div>
            <div>
              <p className="text-white font-semibold">Drop your resume here</p>
              <p className="text-gray-400 text-sm mt-1">or click to browse — PDF only, max 5MB</p>
            </div>
          </div>
        )}
      </div>

      {mode === 'analyze' ? (
        <button onClick={handleAnalyze} disabled={!file || analyzing} className="btn-primary w-full flex items-center justify-center gap-2">
          {analyzing ? <><LoadingSpinner size="sm" /> Analyzing Resume...</> : <><RiStarLine /> Analyze with AI</>}
        </button>
      ) : (
        <div className="flex gap-3">
          <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {uploading ? <LoadingSpinner size="sm" /> : <><RiUploadCloud2Line /> Save to Profile</>}
          </button>
          {user?.resumeUrl && (
            <button onClick={handleDeleteResume} className="btn-secondary px-4 flex items-center gap-2 text-red-400 hover:text-red-300">
              <RiDeleteBinLine /> Remove
            </button>
          )}
        </div>
      )}

      {user?.resumeUrl && (
        <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl">
          <RiFileTextLine className="text-primary-400 text-xl" />
          <div className="flex-1">
            <p className="text-gray-200 text-sm font-medium">Current Resume on Profile</p>
            <p className="text-gray-500 text-xs">Uploaded to Cloudinary</p>
          </div>
          <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="text-primary-400 text-sm hover:underline flex items-center gap-1">
            <RiDownloadLine /> View
          </a>
        </div>
      )}

      {/* Analysis Result */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Score overview */}
            <div className="card">
              <h3 className="text-white font-semibold mb-6">Analysis Overview</h3>
              <div className="flex flex-wrap justify-center gap-8 mb-6">
                <CircleScore score={analysis.atsScore} label="ATS Score" />
                <CircleScore score={analysis.overallScore} label="Overall Score" />
              </div>
              <p className="text-gray-300 text-sm text-center leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Section scores */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Section Scores</h3>
              <div className="space-y-3">
                {Object.entries(analysis.sections || {}).map(([key, val]) => (
                  <ScoreBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} score={val} />
                ))}
              </div>
            </div>

            {/* Strengths & weaknesses */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2"><RiCheckLine /> Strengths</h3>
                <ul className="space-y-2">
                  {analysis.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <RiCheckLine className="text-green-400 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2"><RiAlertLine /> Weaknesses</h3>
                <ul className="space-y-2">
                  {analysis.weaknesses?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <RiCloseLine className="text-red-400 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            <div className="card">
              <h3 className="text-white font-semibold mb-3">AI Suggestions</h3>
              <div className="space-y-2">
                {analysis.suggestions?.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-800 rounded-xl">
                    <RiArrowRightLine className="text-primary-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-300 text-sm">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-white font-semibold mb-3">Found Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords?.map((k, i) => (
                    <span key={i} className="px-3 py-1 bg-green-900/30 border border-green-800/50 rounded-full text-green-300 text-xs">{k}</span>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="text-white font-semibold mb-3">Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords?.map((k, i) => (
                    <span key={i} className="px-3 py-1 bg-red-900/30 border border-red-800/50 rounded-full text-red-300 text-xs">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
