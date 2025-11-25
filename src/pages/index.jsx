import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine
} from 'recharts';
import { Users, Clock, TrendingUp, Activity, Sun, Moon, Calendar, Filter } from 'lucide-react';

const mockPeriods = [
  { value: 'day', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, average: 0, peak: 0, current: 0 });
  const [period, setPeriod] = useState('day');
  const [darkMode, setDarkMode] = useState(false);
  const [popularHours, setPopularHours] = useState([]);

  useEffect(() => {
    const mockPopularHours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      count: Math.floor(Math.random() * 100) + 10,
    }));
    setPopularHours(mockPopularHours);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        
      const response = await fetch('/api/get');
      const json = await response.json();

      if (!json.success) throw new Error(json.error || 'Erreur de chargement');

      const lines = json.data.trim().split('\n');
      const parsed = lines.map(line => {
        const [timestamp, count] = line.split(',');
        const date = new Date(timestamp);
        return {
          timestamp: date,
          count: parseInt(count),
          hour: date.getHours(),
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          timeStr: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          dateStr: date.toLocaleDateString('fr-FR'),
        };
      });
      setData(parsed);
      setFilteredData(parsed);
      updateStats(parsed);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const updateStats = (filtered) => {
    const counts = filtered.map(d => d.count);
    setStats({
      total: counts.reduce((a, b) => a + b, 0),
      average: counts.length ? (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1) : 0,
      peak: counts.length ? Math.max(...counts) : 0,
      current: counts.length ? counts[counts.length - 1] : 0,
    });
  };

  const filterByPeriod = (period) => {
    const now = new Date();
    let filtered;
    switch (period) {
      case 'day':
        filtered = data.filter(d => d.dateStr === now.toLocaleDateString('fr-FR'));
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        filtered = data.filter(d => d.timestamp >= startOfWeek);
        break;
      case 'month':
        filtered = data.filter(d => d.month === now.getMonth() + 1 && d.year === now.getFullYear());
        break;
      case 'year':
        filtered = data.filter(d => d.year === now.getFullYear());
        break;
      default:
        filtered = data;
    }
    setFilteredData(filtered);
    updateStats(filtered);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Aggregate data by hour for heatmap
  const hourlyHeatmapData = filteredData.reduce((acc, curr) => {
    const hour = curr.hour;
    acc[hour] = (acc[hour] || 0) + curr.count;
    return acc;
  }, []);

  const heatmapData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    count: hourlyHeatmapData[i] || 0,
  }));

  // Pie chart data for distribution
  const pieData = [
    { name: 'Matin (6h-12h)', value: heatmapData.slice(6, 12).reduce((a, b) => a + b.count, 0) },
    { name: 'Après-midi (12h-18h)', value: heatmapData.slice(12, 18).reduce((a, b) => a + b.count, 0) },
    { name: 'Soir (18h-24h)', value: heatmapData.slice(18, 24).reduce((a, b) => a + b.count, 0) },
    { name: 'Nuit (0h-6h)', value: heatmapData.slice(0, 6).reduce((a, b) => a + b.count, 0) },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-2xl`}>
          Chargement des données...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      {/* Header avec toggle dark mode et filtres */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard de Présence</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>Analyse en temps réel</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white/10 rounded-lg p-2">
              <Calendar className="w-5 h-5 mr-2" />
              <select
                value={period}
                onChange={(e) => { setPeriod(e.target.value); filterByPeriod(e.target.value); }}
                className={`bg-transparent outline-none ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
              >
                {mockPeriods.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-800'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Présence Actuelle", value: stats.current, icon: <Users className="w-8 h-8" /> },
            { title: "Moyenne", value: stats.average, icon: <TrendingUp className="w-8 h-8" /> },
            { title: "Pic Maximum", value: stats.peak, icon: <Activity className="w-8 h-8" /> },
            { title: "Total Enregistré", value: stats.total, icon: <Clock className="w-8 h-8" /> },
          ].map((stat, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium mb-1`}>
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {React.cloneElement(stat.icon, { className: `w-8 h-8 ${COLORS[index]}` })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Real-time Area Chart */}
          <div className={`rounded-xl p-6 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <h3 className="text-xl font-semibold mb-4">Évolution en Temps Réel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredData.slice(-20)}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                <XAxis dataKey="timeStr" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#d1d5db' : '#374151',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS[0]}
                  fill="url(#colorCount)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Bar Chart */}
          <div className={`rounded-xl p-6 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <h3 className="text-xl font-semibold mb-4">Moyenne par Heure</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatmapData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                <XAxis dataKey="hour" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#d1d5db' : '#374151',
                  }}
                />
                <Bar dataKey="count" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap des heures populaires */}
          <div className={`rounded-xl p-6 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <h3 className="text-xl font-semibold mb-4">Heures les Plus Populaires</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatmapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                <XAxis type="number" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis dataKey="hour" type="category" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#d1d5db' : '#374151',
                  }}
                />
                <Bar dataKey="count" fill={COLORS[2]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart pour la répartition */}
          <div className={`rounded-xl p-6 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <h3 className="text-xl font-semibold mb-4">Répartition par Période</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#d1d5db' : '#374151',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Historique complet avec brush pour zoom */}
          <div className={`lg:col-span-2 rounded-xl p-6 border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <h3 className="text-xl font-semibold mb-4">Historique Complet</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} />
                <XAxis
                  dataKey="timeStr"
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  interval={Math.max(0, Math.floor(filteredData.length / 20))}
                />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#d1d5db' : '#374151',
                  }}
                />
                <Line type="monotone" dataKey="count" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                <Brush dataKey="timeStr" height={30} stroke={COLORS[3]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
{/* Section de téléchargement de l'application */}
<div className={`rounded-xl p-6 border mt-8 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-sm`}>
  <div className="flex flex-col md:flex-row items-center justify-between">
    <div className="flex items-center">
      <img
        src="/logoApp.png"
        alt="Logo de l'application"
        className="w-16 h-16 mr-4 object-contain"
      />
      <div>
        <h3 className="text-xl font-semibold mb-1">Application Mobile</h3>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
          Accédez à vos statistiques de présence en temps réel, où que vous soyez.
        </p>
      </div>
    </div>
    <a
      href="/app-release.apk"
      download="Projet Cloud.apk"
      className={`mt-4 md:mt-0 inline-flex items-center px-5 py-2.5 rounded-lg font-medium transition-colors ${
        darkMode
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Télécharger
    </a>
  </div>
</div>
    </div>
  );
};

export default Dashboard;

