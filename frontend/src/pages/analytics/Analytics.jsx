import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, fetchInterviewAnalysis } from '../../redux/slices/analyticsSlice';
import { motion } from 'framer-motion';
import {
  Line, Bar, Doughnut, Radar,
} from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
  ArcElement, RadialLinearScale,
} from 'chart.js';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { RiBarChartLine, RiTrophyLine, RiFireLine, RiStarLine } from 'react-icons/ri';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler, ArcElement, RadialLinearScale
);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#e5e7eb',
      bodyColor: '#9ca3af',
      borderColor: '#374151',
      borderWidth: 1,
    },
  },
};

const scaleDefaults = {
  grid: { color: '#1f2937' },
  ticks: { color: '#6b7280', font: { size: 11 } },
};

export default function Analytics() {
  const dispatch = useDispatch();
  const { stats, scoreTrend, skillData, languageData, difficultyDist, loading, interviewAnalysis } = useSelector((s) => s.analytics);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchInterviewAnalysis());
  }, [dispatch]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading analytics..." /></div>;

  const scoreLineData = {
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
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const skillBarData = {
    labels: skillData.map((s) => s.skill),
    datasets: [{
      label: 'Avg Score',
      data: skillData.map((s) => s.avgScore),
      backgroundColor: skillData.map((_, i) => `hsl(${240 + i * 30}, 60%, 60%)`),
      borderRadius: 6,
    }],
  };

  const diffDoughnutData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [{
      data: [difficultyDist.easy || 0, difficultyDist.medium || 0, difficultyDist.hard || 0],
      backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
      borderColor: '#111827',
      borderWidth: 3,
    }],
  };

  const langBarData = {
    labels: languageData.map((l) => l.language),
    datasets: [{
      label: 'Tests',
      data: languageData.map((l) => l.count),
      backgroundColor: 'rgba(118,75,162,0.7)',
      borderRadius: 6,
    }],
  };

  const monthlyData = interviewAnalysis?.monthlyTrend || [];
  const monthlyChartData = {
    labels: monthlyData.map((m) => m.month),
    datasets: [
      { label: 'Count', data: monthlyData.map((m) => m.count), backgroundColor: 'rgba(102,126,234,0.5)', borderRadius: 6 },
      { label: 'Avg Score', data: monthlyData.map((m) => m.avgScore), backgroundColor: 'rgba(118,75,162,0.5)', borderRadius: 6 },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Detailed insights into your interview preparation progress</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Interviews', value: stats?.totalInterviews || 0, icon: RiBarChartLine, color: 'text-blue-400', bg: 'bg-blue-900/20' },
          { label: 'Average Score', value: `${stats?.averageScore || 0}/10`, icon: RiTrophyLine, color: 'text-purple-400', bg: 'bg-purple-900/20' },
          { label: 'Current Streak', value: `${stats?.streak || 0} days`, icon: RiFireLine, color: 'text-orange-400', bg: 'bg-orange-900/20' },
          { label: 'Total XP', value: stats?.xp || 0, icon: RiStarLine, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`${color} text-xl`} />
            </div>
            <p className="text-gray-400 text-xs">{label}</p>
            <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Score trend */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4">Interview Score Trend</h3>
        {scoreTrend.length > 0 ? (
          <div className="h-64">
            <Line data={scoreLineData} options={{ ...chartDefaults, scales: { x: scaleDefaults, y: { ...scaleDefaults, min: 0, max: 10 } } }} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <RiBarChartLine className="text-gray-700 text-5xl mx-auto mb-3" />
              <p className="text-gray-500">Complete interviews to see your score trend</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skill performance */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Skill Performance</h3>
          {skillData.length > 0 ? (
            <div className="h-52">
              <Bar data={skillBarData} options={{ ...chartDefaults, scales: { x: scaleDefaults, y: { ...scaleDefaults, min: 0, max: 10 } } }} />
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-500 text-sm">No skill data yet</div>
          )}
        </div>

        {/* Difficulty distribution */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Difficulty Distribution</h3>
          {(difficultyDist.easy || difficultyDist.medium || difficultyDist.hard) ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-48">
                <Doughnut data={diffDoughnutData} options={{ ...chartDefaults, cutout: '65%' }} />
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-500 text-sm">No data yet</div>
          )}
        </div>

        {/* Language usage */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Coding Languages Used</h3>
          {languageData.length > 0 ? (
            <div className="h-52">
              <Bar data={langBarData} options={{ ...chartDefaults, scales: { x: scaleDefaults, y: { ...scaleDefaults, min: 0 } } }} />
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-500 text-sm">Solve coding problems to see data</div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Monthly Interview Activity</h3>
          {monthlyData.length > 0 ? (
            <div className="h-52">
              <Bar data={monthlyChartData} options={{ ...chartDefaults, scales: { x: scaleDefaults, y: { ...scaleDefaults, min: 0 } } }} />
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-500 text-sm">No monthly data yet</div>
          )}
        </div>
      </div>

      {/* Interview type breakdown */}
      {interviewAnalysis?.typeBreakdown && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Interview Type Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(interviewAnalysis.typeBreakdown).map(([type, count]) => (
              <div key={type} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-gray-400 text-sm capitalize mt-1">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak topics */}
      {stats?.weakTopics?.length > 0 && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Focus Areas (AI Recommended)</h3>
          <div className="flex flex-wrap gap-2">
            {stats.weakTopics.map((topic, i) => (
              <span key={i} className="px-3 py-1.5 bg-red-900/20 border border-red-900/40 rounded-full text-red-300 text-sm">{topic}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
