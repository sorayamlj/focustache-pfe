// src/components/Stats.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, Target, Calendar } from 'lucide-react';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`${API_BASE}/tasks/stats/detailed`, { headers });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Erreur fetch stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-400 rounded">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Statistiques</h1>
              <p className="text-gray-400">Suivez votre progression</p>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Temps par État */}
          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-500 rounded">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-medium text-white">Temps par État</h2>
            </div>

            <div className="space-y-3">
              {[
                { etat: 'à faire', color: 'text-blue-400', bg: 'bg-blue-400' },
                { etat: 'en cours', color: 'text-yellow-400', bg: 'bg-yellow-400' },
                { etat: 'terminée', color: 'text-green-400', bg: 'bg-green-400' }
              ].map(({ etat, color, bg }) => {
                const entry = stats?.tempsParEtat?.find(e => e.etat === etat);
                const totalTime = entry?.minutes ?? 0;
                return (
                  <div key={etat} className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${bg} rounded-full`}></div>
                      <span className="text-white text-sm capitalize">{etat}</span>
                    </div>
                    <span className={`${color} font-medium`}>{formatTime(totalTime)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temps par Module */}
          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-500 rounded">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-medium text-white">Temps par Module</h2>
            </div>

            <div className="space-y-3">
              {stats?.tempsParModule?.length > 0 ? (
                stats.tempsParModule.map((entry, index) => {
                  const colors = ['text-indigo-400', 'text-pink-400', 'text-cyan-400', 'text-orange-400', 'text-emerald-400'];
                  const bgColors = ['bg-indigo-400', 'bg-pink-400', 'bg-cyan-400', 'bg-orange-400', 'bg-emerald-400'];
                  const totalTime = entry?.minutes ?? 0;

                  return (
                    <div key={entry.module} className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${bgColors[index % bgColors.length]} rounded-full`}></div>
                        <span className="text-white text-sm truncate" title={entry.module}>
                          {entry.module.length > 15 ? `${entry.module.substring(0, 15)}...` : entry.module}
                        </span>
                      </div>
                      <span className={`${colors[index % colors.length]} font-medium`}>
                        {formatTime(totalTime)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">Aucun module</p>
                  <p className="text-gray-500 text-xs">Vos modules apparaîtront ici</p>
                </div>
              )}
            </div>
          </div>

          {/* Temps par Catégorie */}
          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-teal-500 rounded">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-medium text-white">Temps par Catégorie</h2>
            </div>

            <div className="space-y-3">
              {[
                { categorie: 'universitaire', color: 'text-purple-400', bg: 'bg-purple-400' },
                { categorie: 'para-universitaire', color: 'text-amber-400', bg: 'bg-amber-400' }
              ].map(({ categorie, color, bg }) => {
                const entry = stats?.tempsParCategorie?.find(e => e.categorie === categorie);
                const totalTime = entry?.minutes ?? 0;

                return (
                  <div key={categorie} className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${bg} rounded-full`}></div>
                      <span className="text-white text-sm capitalize">{categorie}</span>
                    </div>
                    <span className={`${color} font-medium`}>{formatTime(totalTime)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
