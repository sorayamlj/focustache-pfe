// src/components/Stats.jsx
import React from 'react';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';

const Stats = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Statistiques</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Temps par matière</h2>
          </div>
          <p className="text-slate-400">Graphique à développer</p>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Productivité</h2>
          </div>
          <p className="text-slate-400">Analyse à développer</p>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Sessions</h2>
          </div>
          <p className="text-slate-400">Historique à développer</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;