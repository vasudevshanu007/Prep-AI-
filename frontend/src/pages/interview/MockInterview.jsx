import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage } from '../../redux/slices/interviewSlice';
import {
  RiSendPlaneLine, RiRobotLine, RiUser3Line, RiBriefcaseLine,
  RiRestartLine, RiMicLine, RiStopLine,
} from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STARTER_ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'Product Manager'];

const INITIAL_MESSAGES = (role) => [
  {
    role: 'assistant',
    content: `Hello! I'm your AI interviewer today. I'll be conducting a ${role} interview. Let's get started!\n\nTell me about yourself and your relevant experience for this ${role} position.`,
  },
];

function MessageBubble({ message, animate }) {
  const isAI = message.role === 'assistant';
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-gradient-primary' : 'bg-gray-700'}`}>
        {isAI ? <RiRobotLine className="text-white text-lg" /> : <RiUser3Line className="text-gray-300 text-lg" />}
      </div>
      <div className={`max-w-[75%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <p className={`text-xs mb-1 ${isAI ? 'text-primary-400' : 'text-gray-500'}`}>
          {isAI ? 'AI Interviewer' : 'You'}
        </p>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isAI ? 'bg-gray-800 text-gray-200 rounded-tl-none' : 'bg-primary-500/20 border border-primary-500/30 text-gray-100 rounded-tr-none'}`}>
          {message.content}
        </div>
        {message.timestamp && (
          <p className="text-xs text-gray-600 mt-1">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function MockInterview() {
  const dispatch = useDispatch();
  const { chatLoading } = useSelector((s) => s.interview);

  const [role, setRole] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = () => {
    if (!role.trim()) return;
    setStarted(true);
    setMessages(INITIAL_MESSAGES(role).map((m) => ({ ...m, timestamp: new Date() })));
    setQuestionIndex(0);
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    const result = await dispatch(sendChatMessage({
      conversationHistory: messages.map(({ role, content }) => ({ role, content })),
      userMessage: input.trim(),
      role,
      questionIndex,
    }));

    if (sendChatMessage.fulfilled.match(result)) {
      setMessages((prev) => [...prev, { role: 'assistant', content: result.payload.response, timestamp: new Date() }]);
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const resetInterview = () => {
    setStarted(false);
    setMessages([]);
    setRole('');
    setQuestionIndex(0);
    setInput('');
  };

  if (!started) {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RiRobotLine className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Mock Interview</h1>
            <p className="text-gray-400 text-sm mt-2">Chat with an AI interviewer in a realistic interview simulation</p>
          </div>

          <div className="card space-y-5">
            <div>
              <label className="label">Interview Role</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Data Scientist..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startInterview()}
                className="input-field"
                list="roles-mock"
              />
              <datalist id="roles-mock">{STARTER_ROLES.map((r) => <option key={r} value={r} />)}</datalist>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STARTER_ROLES.map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-left ${role === r ? 'bg-primary-500/15 border-primary-500/40 text-primary-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  <RiBriefcaseLine className="inline mr-2 text-base" />{r}
                </button>
              ))}
            </div>

            <div className="bg-gray-800 rounded-xl p-4 text-sm">
              <p className="text-gray-300 font-medium mb-2">How it works:</p>
              <ul className="space-y-1 text-gray-400">
                <li>• AI asks interview questions in sequence</li>
                <li>• Type or speak your answers</li>
                <li>• AI evaluates and asks follow-ups</li>
                <li>• Practice as long as you like</li>
              </ul>
            </div>

            <button onClick={startInterview} disabled={!role.trim()} className="btn-primary w-full">
              Start Interview
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold">{role} Interview</h2>
          <p className="text-gray-500 text-xs">{questionIndex} questions answered</p>
        </div>
        <button onClick={resetInterview} className="btn-secondary py-2 px-3 flex items-center gap-2 text-sm">
          <RiRestartLine /> End Interview
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} animate={i === messages.length - 1} />
          ))}
        </AnimatePresence>

        {chatLoading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <RiRobotLine className="text-white text-lg" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={toggleVoice}
          className={`p-3 rounded-xl border transition-all flex-shrink-0 ${isListening ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
          title={isListening ? 'Stop listening' : 'Speak answer'}
        >
          {isListening ? <RiStopLine className="text-lg" /> : <RiMicLine className="text-lg" />}
        </button>
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="input-field resize-none pr-12"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || chatLoading}
            className="absolute right-3 bottom-3 p-2 bg-gradient-primary rounded-lg text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <RiSendPlaneLine className="text-lg" />
          </button>
        </div>
      </div>
      <p className="text-center text-gray-600 text-xs mt-2">Shift+Enter for new line · Enter to send · Click mic to speak</p>
    </div>
  );
}
