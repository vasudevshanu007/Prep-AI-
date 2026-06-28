import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchDashboardStats } from '../../redux/slices/analyticsSlice';
import {
  RiRobotLine, RiMicLine, RiFileTextLine, RiCodeLine,
  RiBarChartLine, RiTrophyLine, RiFireLine, RiStarLine,
  RiArrowRightLine, RiTimeLine,
} from 'react-icons/ri';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const quickActions = [
  { title: 'AI Interview', desc: 'Generate & practice questions', icon: RiRobotLine, path: '/interview/generate', color: 'from-blue-600 to-blue-800', badge: 'Popular' },
  { title: 'Mock Chat', desc: 'Chat with AI interviewer', icon: RiMicLine, path: '/interview/mock', color: 'from-purple-600 to-purple-800', badge: '' },
  { title: 'Resume AI', desc: 'Get ATS score & feedback', icon: RiFileTextLine, path: '/resume', color: 'from-green-600 to-green-800', badge: '' },
  { title: 'Coding Arena', desc: 'Solve coding challenges', icon: RiCodeLine, path: '/coding', color: 'from-orange-600 to-orange-800', badge: 'New' },
];

function StatCard({ icon: Icon, label, value, color, suffix = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="text-white text-xl" />
      </div>
      <div>
        <p className="text-gray-400 text-xs mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white">{value}<span className="text-sm text-gray-400 ml-1">{suffix}</span></p>
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { stats, scoreTrend, recentActivity, loading } = useSelector((s) => s.analytics);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const chartData = {
    labels: scoreTrend.map((d) => d.date),
    datasets: [{
      label: 'Interview Score',
      data: scoreTrend.map((d) => d.score),
      borderColor: '#667eea',
      backgroundColor: 'rgba(102,126,234,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#667eea',
      pointRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#e5e7eb',
        bodyColor: '#9ca3af',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { color: '#1f2937' }, ticks: { color: '#6b7280', font: { size: 11 } } },
      y: { min: 0, max: 10, grid: { color: '#1f2937' }, ticks: { color: '#6b7280', font: { size: 11 } } },
    },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {stats?.totalInterviews === 0
              ? "You haven't started any interviews yet. Let's begin!"
              : `You've completed ${stats?.totalInterviews} interviews. Keep going!`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-orange-900/30 border border-orange-800/50 rounded-xl px-4 py-2">
            <RiFireLine className="text-orange-400" />
            <span className="text-orange-400 font-semibold text-sm">{stats?.streak || 0} day streak</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-800/50 rounded-xl px-4 py-2">
            <RiStarLine className="text-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">{stats?.xp || 0} XP</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner text="Loading stats..." /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={RiRobotLine} label="Total Interviews" value={stats?.totalInterviews || 0} color="from-blue-600 to-blue-800" />
          <StatCard icon={RiTrophyLine} label="Avg Score" value={stats?.averageScore || 0} suffix="/10" color="from-purple-600 to-purple-800" />
          <StatCard icon={RiCodeLine} label="Coding Tests" value={stats?.totalCodingTests || 0} color="from-orange-600 to-orange-800" />
          <StatCard icon={RiFileTextLine} label="Resume Score" value={stats?.resumeScore || 0} suffix="%" color="from-green-600 to-green-800" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Score Trend</h3>
            <Link to="/analytics" className="text-primary-400 text-sm hover:underline flex items-center gap-1">
              View all <RiArrowRightLine />
            </Link>
          </div>
          {scoreTrend.length > 0 ? (
            <div className="h-52">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center flex-col gap-2">
              <RiBarChartLine className="text-gray-700 text-4xl" />
              <p className="text-gray-500 text-sm">Complete interviews to see your progress</p>
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Focus Areas</h3>
          {user?.weakTopics?.length > 0 ? (
            <div className="space-y-2">
              {user.weakTopics.slice(0, 6).map((topic, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{topic}</span>
                </div>
              ))}
              <Link to="/interview/generate" className="btn-outline w-full text-sm mt-2 flex justify-center">
                Practice These Topics
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <RiTrophyLine className="text-gray-700 text-4xl mb-2" />
              <p className="text-gray-500 text-sm">No weak topics yet.</p>
              <p className="text-gray-600 text-xs">Complete interviews to get insights.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ title, desc, icon: Icon, path, color, badge }) => (
            <Link key={path} to={path}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="card-hover relative overflow-hidden"
              >
                {badge && (
                  <span className="absolute top-3 right-3 text-xs bg-primary-500/20 text-primary-400 border border-primary-500/30 px-2 py-0.5 rounded-full font-medium">
                    {badge}
                  </span>
                )}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                  <Icon className="text-white text-xl" />
                </div>
                <h4 className="text-white font-semibold text-sm">{title}</h4>
                <p className="text-gray-500 text-xs mt-1">{desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Activity</h3>
            <Link to="/history" className="text-primary-400 text-sm hover:underline flex items-center gap-1">
              View all <RiArrowRightLine />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.type === 'interview' ? 'bg-blue-900/50 text-blue-400' : 'bg-orange-900/50 text-orange-400'}`}>
                    {item.type === 'interview' ? <RiMicLine /> : <RiCodeLine />}
                  </div>
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{item.title}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <RiTimeLine /> {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${item.score >= 7 ? 'text-green-400' : item.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {item.score}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {stats?.badges?.length > 0 && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Badges Earned</h3>
          <div className="flex flex-wrap gap-3">
            {stats.badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-yellow-900/20 border border-yellow-800/40 rounded-xl">
                <RiTrophyLine className="text-yellow-400" />
                <span className="text-yellow-300 text-sm font-medium capitalize">{badge.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
