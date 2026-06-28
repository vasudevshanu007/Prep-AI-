import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RiMicLine, RiStopLine, RiVolumeUpLine, RiRobotLine,
  RiRefreshLine, RiCheckLine, RiCameraLine, RiCameraOffLine,
  RiEyeLine, RiEyeOffLine,
} from 'react-icons/ri';
import { interviewAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const QUESTIONS = [
  'Tell me about yourself and your background.',
  'What are your greatest strengths and weaknesses?',
  'Why do you want this job?',
  'Describe a challenging project you have worked on.',
  'Where do you see yourself in 5 years?',
  'Tell me about a time you showed leadership.',
  'How do you handle pressure and tight deadlines?',
  'What motivates you to do your best work?',
];

function AudioVisualizer({ isActive }) {
  return (
    <div className="flex items-end gap-0.5 h-10">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-primary-500"
          animate={isActive ? { height: [8, Math.random() * 32 + 8, 8] } : { height: 4 }}
          transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

// Floating webcam panel — draggable would be ideal but a fixed corner keeps it simple
function WebcamPanel({ stream, visible, onToggleVisible, onDisable }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!visible) {
    return (
      <button
        onClick={onToggleVisible}
        title="Show webcam"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-all shadow-lg"
      >
        <RiEyeLine className="text-xl" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-52 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-36 object-cover bg-gray-900 scale-x-[-1]"
      />
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900/90">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-gray-400 text-xs">Camera on</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleVisible} title="Hide panel" className="text-gray-500 hover:text-gray-300 transition-colors">
            <RiEyeOffLine className="text-sm" />
          </button>
          <button onClick={onDisable} title="Turn off camera" className="text-gray-500 hover:text-red-400 transition-colors">
            <RiCameraOffLine className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VoiceInterview() {
  const [currentQ, setCurrentQ]       = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [answers, setAnswers]         = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [started, setStarted]         = useState(false);
  const [finished, setFinished]       = useState(false);

  // Webcam state
  const [camStream, setCamStream]     = useState(null);
  const [camEnabled, setCamEnabled]   = useState(false);
  const [camVisible, setCamVisible]   = useState(true);
  const [camDenied, setCamDenied]     = useState(false);

  const recognitionRef = useRef(null);

  // Stop stream on unmount
  useEffect(() => {
    return () => stopCam();
  }, []);

  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCamStream(stream);
      setCamEnabled(true);
      setCamVisible(true);
      setCamDenied(false);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCamDenied(true);
        toast.error('Camera permission denied. You can still do the interview without it.');
      } else {
        toast.error('Could not access camera.');
      }
    }
  }, []);

  const stopCam = useCallback(() => {
    setCamStream(prev => {
      if (prev) prev.getTracks().forEach(t => t.stop());
      return null;
    });
    setCamEnabled(false);
  }, []);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported. Please use Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
    };
    recognition.onerror = () => { setIsListening(false); toast.error('Microphone error. Check permissions.'); };
    recognition.onend   = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
    setTranscript('');
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const submitAnswer = async () => {
    if (!transcript.trim()) return toast.error('Please speak your answer first');
    setIsEvaluating(true);
    try {
      const res = await interviewAPI.chat({
        conversationHistory: [],
        userMessage: `Question: "${QUESTIONS[currentQ]}" Answer: "${transcript}"`,
        role: 'HR Interviewer',
        questionIndex: currentQ,
      });
      const feedback  = res.data.response;
      const newAnswer = { question: QUESTIONS[currentQ], answer: transcript, feedback };
      setAnswers(prev => [...prev, newAnswer]);

      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1);
        setTranscript('');
        setTimeout(() => speak(QUESTIONS[currentQ + 1]), 1000);
      } else {
        setFinished(true);
        stopCam();
      }
    } catch {
      toast.error('Evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const startInterview = () => {
    setStarted(true);
    setTimeout(() => speak(QUESTIONS[0]), 500);
  };

  const restart = () => {
    window.speechSynthesis.cancel();
    stopCam();
    setStarted(false);
    setFinished(false);
    setCurrentQ(0);
    setTranscript('');
    setAnswers([]);
    setCamEnabled(false);
  };

  // ── Pre-interview screen ──────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RiMicLine className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">Voice Interview</h1>
            <p className="text-gray-400 text-sm mt-2">Practice answering interview questions out loud with AI</p>
          </div>

          <div className="card space-y-5">
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <p className="text-gray-200 font-medium text-sm">Requirements</p>
              {[
                'Allow microphone access when prompted',
                'Use Chrome/Edge for best speech recognition',
                'Speak clearly and at a moderate pace',
                'AI will ask 8 HR/behavioral questions',
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                  <RiCheckLine className="text-green-400 flex-shrink-0" />{tip}
                </div>
              ))}
            </div>

            {/* Webcam toggle */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-200 text-sm font-medium">Webcam Preview</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {camDenied ? 'Permission denied — continue without camera' : 'Optional — simulates a real interview environment'}
                  </p>
                </div>
                <button
                  onClick={camEnabled ? stopCam : startCam}
                  disabled={camDenied}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    camEnabled
                      ? 'bg-green-900/40 text-green-400 border border-green-800'
                      : camDenied
                      ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  {camEnabled ? <><RiCameraLine /> On</> : <><RiCameraOffLine /> Off</>}
                </button>
              </div>
              {camEnabled && (
                <WebcamPreviewSmall stream={camStream} />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-gray-300 text-sm font-medium">Sample Questions:</p>
              {QUESTIONS.slice(0, 3).map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-400 text-sm p-3 bg-gray-800 rounded-xl">
                  <span className="text-primary-400 font-bold flex-shrink-0">{i + 1}.</span>{q}
                </div>
              ))}
              <p className="text-gray-600 text-xs text-center">...and {QUESTIONS.length - 3} more</p>
            </div>

            <button onClick={startInterview} className="btn-primary w-full flex items-center justify-center gap-2">
              <RiMicLine /> Start Voice Interview
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <RiCheckLine className="text-green-400 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Voice Interview Complete!</h2>
          <p className="text-gray-400 text-sm">You answered all {QUESTIONS.length} questions.</p>
        </div>

        <div className="space-y-4">
          {answers.map((a, i) => (
            <div key={i} className="card">
              <p className="text-primary-400 text-xs mb-1">Q{i + 1}</p>
              <p className="text-white font-medium text-sm mb-3">{a.question}</p>
              <div className="bg-gray-800 rounded-xl p-3 mb-3">
                <p className="text-gray-400 text-xs mb-1">Your Answer</p>
                <p className="text-gray-200 text-sm">{a.answer}</p>
              </div>
              {a.feedback && (
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3">
                  <p className="text-primary-400 text-xs mb-1">AI Feedback</p>
                  <p className="text-gray-300 text-sm">{a.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={restart} className="btn-primary w-full flex items-center justify-center gap-2">
          <RiRefreshLine /> Try Again
        </button>
      </div>
    );
  }

  // ── Active interview screen ───────────────────────────────────────────────────
  return (
    <>
      {/* Floating webcam panel */}
      {camEnabled && (
        <WebcamPanel
          stream={camStream}
          visible={camVisible}
          onToggleVisible={() => setCamVisible(v => !v)}
          onDisable={stopCam}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Question {currentQ + 1} of {QUESTIONS.length}</span>
            <div className="flex items-center gap-3">
              {/* Camera toggle during interview */}
              <button
                onClick={camEnabled ? stopCam : startCam}
                title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  camEnabled
                    ? 'border-green-800 text-green-400 bg-green-900/20 hover:bg-green-900/40'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {camEnabled ? <RiCameraLine /> : <RiCameraOffLine />}
                {camEnabled ? 'Cam on' : 'Cam off'}
              </button>
              <button onClick={restart} className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1">
                <RiRefreshLine /> Restart
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-primary transition-all"
              style={{ width: `${(currentQ / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* AI Question */}
        <div className="card text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <RiRobotLine className="text-white text-2xl" />
            </div>
            <div className={`flex items-center gap-2 text-sm ${isSpeaking ? 'text-primary-400' : 'text-gray-500'}`}>
              <RiVolumeUpLine className={isSpeaking ? 'animate-pulse' : ''} />
              {isSpeaking ? 'AI is speaking...' : 'AI Interviewer'}
            </div>
          </div>
          <p className="text-white text-lg font-medium leading-relaxed">{QUESTIONS[currentQ]}</p>
          <button
            onClick={() => speak(QUESTIONS[currentQ])}
            className="mt-4 text-primary-400 text-sm hover:underline flex items-center gap-1 mx-auto"
          >
            <RiVolumeUpLine /> Read again
          </button>
        </div>

        {/* Mic input */}
        <div className="card text-center space-y-4">
          <div className="flex justify-center">
            <AudioVisualizer isActive={isListening} />
          </div>

          <div className="min-h-[80px] bg-gray-800 rounded-xl p-4 text-left">
            {transcript ? (
              <p className="text-gray-200 text-sm">{transcript}</p>
            ) : (
              <p className="text-gray-600 text-sm">
                {isListening ? 'Listening...' : 'Click the mic to start speaking'}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 py-3 px-8 rounded-2xl font-semibold transition-all ${
                isListening
                  ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
                  : 'bg-gradient-primary text-white hover:opacity-90'
              }`}
            >
              {isListening ? <><RiStopLine /> Stop</> : <><RiMicLine /> Speak</>}
            </button>

            <button
              onClick={submitAnswer}
              disabled={!transcript.trim() || isEvaluating}
              className="btn-secondary flex items-center gap-2 disabled:opacity-40"
            >
              {isEvaluating ? <LoadingSpinner size="sm" /> : <><RiCheckLine /> Submit Answer</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Small preview shown on the pre-interview setup card
function WebcamPreviewSmall({ stream }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-700">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-28 object-cover bg-gray-900 scale-x-[-1]" />
    </div>
  );
}
