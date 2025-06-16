// src/components/Dashboard.jsx - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/dashboardApi';
import { tasksApi } from '../services/tasksApi';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0, pending: 0, urgent: 0 },
    sessions: { today: 0, todayTime: 0, thisWeek: 0, recentSessions: [] },
    todayFocus: 0,
    completedToday: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les tâches
      const tasksResponse = await tasksApi.getTasks();
      const tasks = tasksResponse.tasks || tasksResponse || [];

      // Simuler des sessions (en attendant l'API sessions)
      const mockSessions = {
        today: Math.floor(Math.random() * 5) + 1,
        todayTime: Math.floor(Math.random() * 120) + 30,
        thisWeek: Math.floor(Math.random() * 15) + 5,
        recentSessions: [
          { id: 1, task: 'Mathématiques', duration: 25, type: 'pomodoro', time: '14:30' },
          { id: 2, task: 'Anglais', duration: 45, type: 'focus', time: '16:15' },
          { id: 3, task: 'Histoire', duration: 30, type: 'revision', time: '18:00' }
        ]
      };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const calculatedStats = {
        tasks: {
          total: tasks.length,
          completed: tasks.filter(t => t.completed || t.statut === 'terminée').length,
          pending: tasks.filter(t => !t.completed && t.statut !== 'terminée').length,
          urgent: tasks.filter(t => (t.priorite === 'haute' || t.priority === 'high') && !t.completed && t.statut !== 'terminée').length
        },
        sessions: mockSessions,
        completedToday: tasks.filter(t => 
          (t.completed || t.statut === 'terminée') && 
          t.updatedAt && 
          new Date(t.updatedAt) >= today
        ).length,
        overdue: tasks.filter(t => 
          !t.completed && 
          t.statut !== 'terminée' &&
          t.dateEcheance && 
          new Date(t.dateEcheance) < now
        ).length
      };

      setStats(calculatedStats);

      // Tâches récentes
      const recentTasks = tasks
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 4);

      setRecentTasks(recentTasks);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setError('Impossible de charger les données du dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute':
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'moyenne':
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'basse':
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const { tasks, sessions } = stats;
    
    if (hour < 12) {
      return tasks.pending > 0 
        ? `Bonjour ! Prêt pour une journée productive ? ${tasks.pending} tâche${tasks.pending > 1 ? 's' : ''} vous attend${tasks.pending > 1 ? 'ent' : ''}.`
        : "Bonjour ! Excellente nouvelle, aucune tâche en attente aujourd'hui !";
    } else if (hour < 18) {
      return sessions.today > 0
        ? `Bon après-midi ! ${sessions.today} session${sessions.today > 1 ? 's' : ''} de focus aujourd'hui. Continuez !`
        : "Bon après-midi ! Que diriez-vous d'une session de focus ?";
    } else {
      return stats.completedToday > 0
        ? `Bonsoir ! Belle journée avec ${stats.completedToday} tâche${stats.completedToday > 1 ? 's' : ''} terminée${stats.completedToday > 1 ? 's' : ''} !`
        : "Bonsoir ! Il est encore temps pour quelques tâches...";
    }
  };

  // Composants d'icônes
  const TaskIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const FireIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  const PlayIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a3 3 0 013-3v0a3 3 0 013 3v1" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const BoardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const FocusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-lg">Chargement de votre dashboard...</p>
        </div>
      </div>
    );
  }

  const statCardsData = [
    {
      icon: <TaskIcon />,
      title: 'Tâches en attente',
      value: stats.tasks.pending,
      subtitle: `${stats.tasks.total} au total`,
      gradient: 'from-blue-500 to-blue-700',
      hoverShadow: 'hover:shadow-blue-500/20'
    },
    {
      icon: <ClockIcon />,
      title: 'Sessions aujourd\'hui',
      value: stats.sessions.today,
      subtitle: `${formatTime(stats.sessions.todayTime)} de focus`,
      gradient: 'from-purple-500 to-purple-700',
      hoverShadow: 'hover:shadow-purple-500/20'
    },
    {
      icon: <CheckIcon />,
      title: 'Terminées aujourd\'hui',
      value: stats.completedToday,
      subtitle: `${stats.tasks.completed} complétées`,
      gradient: 'from-green-500 to-green-700',
      hoverShadow: 'hover:shadow-green-500/20'
    },
    {
      icon: <FireIcon />,
      title: 'Tâches urgentes',
      value: stats.tasks.urgent,
      subtitle: stats.tasks.urgent > 0 ? 'À traiter rapidement' : 'Tout va bien !',
      gradient: 'from-red-500 to-red-700',
      hoverShadow: 'hover:shadow-red-500/20'
    }
  ];

  const quickActions = [
    {
      icon: <PlusIcon />,
      title: 'Nouvelle tâche',
      description: 'Créer une nouvelle tâche',
      color: 'blue',
      hoverBg: 'hover:bg-blue-500/10 hover:border-blue-500/30',
      action: () => window.location.href = '/#/tasks'
    },
    {
      icon: <PlayIcon />,
      title: 'Démarrer Pomodoro',
      description: 'Session de focus 25 min',
      color: 'red',
      hoverBg: 'hover:bg-red-500/10 hover:border-red-500/30',
      action: () => window.location.href = '/#/focus'
    },
    {
      icon: <ChartIcon />,
      title: 'Voir mes statistiques',
      description: 'Analyser ma productivité',
      color: 'purple',
      hoverBg: 'hover:bg-purple-500/10 hover:border-purple-500/30',
      action: () => window.location.href = '/#/stats'
    },
    {
      icon: <BoardIcon />,
      title: 'Vue Kanban',
      description: 'Organiser visuellement',
      color: 'green',
      hoverBg: 'hover:bg-green-500/10 hover:border-green-500/30',
      action: () => window.location.href = '/#/kanban'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header avec design moderne */}
        <div className="relative mb-8 overflow-hidden">
          {/* Arrière-plan avec pattern géométrique */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-3xl">
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute top-8 right-8 w-16 h-16 bg-cyan-300/20 rounded-full blur-lg animate-bounce"></div>
              <div className="absolute bottom-4 left-1/3 w-12 h-12 bg-purple-300/15 rounded-full blur-md animate-pulse"></div>
            </div>
          </div>
          
          <div className="relative z-10 p-10 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a3 3 0 013-3v0a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                  Salut {user?.name || 'Étudiant'} !
                </h1>
              </div>
            </div>
            <p className="text-xl opacity-90 font-medium max-w-2xl">
              {getMotivationalMessage()}
            </p>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 text-red-300 animate-pulse">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.858 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCardsData.map((stat, index) => (
            <div
              key={index}
              className={`
                bg-slate-800/80 backdrop-blur-xl border border-slate-600/20 rounded-2xl p-7 
                cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-105
                ${stat.hoverShadow} hover:shadow-2xl group
              `}
              style={{ 
                animation: `fadeInUp 0.6s ease-out forwards`,
                animationDelay: `${index * 100}ms`,
                opacity: 0
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} text-white`}>
                  {stat.icon}
                </div>
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${stat.gradient} shadow-lg group-hover:animate-pulse`}></div>
              </div>
              
              <h3 className={`text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2 leading-none`}>
                {stat.value}
              </h3>
              
              <p className="text-slate-200 text-lg font-semibold mb-1">
                {stat.title}
              </p>
              
              <p className="text-slate-400 text-sm">
                {stat.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Contenu principal en 3 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Actions rapides */}
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/20 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Actions rapides
            </h2>
            
            <div className="space-y-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    w-full flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-xl 
                    text-white text-left transition-all duration-300 
                    hover:translate-x-2 ${action.hoverBg}
                    group
                  `}
                  style={{ 
                    animation: `fadeInUp 0.6s ease-out forwards`,
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                >
                  <div className={`p-2 bg-${action.color}-500/20 rounded-lg text-${action.color}-400`}>
                    {action.icon}
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{action.title}</div>
                    <div className="text-sm text-slate-400">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interface Sessions */}
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/20 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <FocusIcon />
                </div>
                Sessions Focus
              </h2>
              <button
                onClick={() => window.location.href = '/#/focus'}
                className="text-purple-400 text-sm font-semibold hover:text-purple-300 hover:scale-105 transition-all duration-200 px-3 py-2 rounded-lg"
              >
                Toutes →
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.sessions.today}</div>
                  <div className="text-sm text-slate-400">Aujourd'hui</div>
                </div>
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-pink-400">{formatTime(stats.sessions.todayTime)}</div>
                  <div className="text-sm text-slate-400">Temps total</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-300 mb-3">Sessions récentes</h3>
              {stats.sessions.recentSessions.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <div className="w-8 h-8 mx-auto mb-2">
                    <FocusIcon />
                  </div>
                  <p className="mt-2">Aucune session aujourd'hui</p>
                  <button
                    onClick={() => window.location.href = '/#/focus'}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300"
                  >
                    Démarrer une session
                  </button>
                </div>
              ) : (
                stats.sessions.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white">{session.task}</h4>
                        <p className="text-sm text-slate-400">{session.type} • {session.time}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">{session.duration}min</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tâches récentes */}
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600/20 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <TaskIcon />
                </div>
                Tâches récentes
              </h2>
              <button
                onClick={() => window.location.href = '/#/tasks'}
                className="text-green-400 text-sm font-semibold hover:text-green-300 hover:scale-105 transition-all duration-200 px-3 py-2 rounded-lg"
              >
                Voir tout →
              </button>
            </div>

            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <div className="w-12 h-12 mx-auto mb-4 p-3 bg-slate-700 rounded-xl">
                    <TaskIcon />
                  </div>
                  <p className="mb-5 text-lg">Aucune tâche créée</p>
                  <button
                    onClick={() => window.location.href = '/#/tasks'}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                  >
                    Créer ma première tâche
                  </button>
                </div>
              ) : (
                recentTasks.map((task, index) => (
                  <div
                    key={task._id}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-all duration-300 hover:translate-x-1 hover:bg-white/10"
                    style={{ 
                      animation: `fadeInUp 0.6s ease-out forwards`,
                      animationDelay: `${index * 100}ms`,
                      opacity: 0
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded ${(task.completed || task.statut === 'terminée') ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                          {(task.completed || task.statut === 'terminée') ? <CheckIcon /> : <TaskIcon />}
                        </div>
                        <h3 className={`font-semibold flex-1 ${
                          (task.completed || task.statut === 'terminée') 
                            ? 'text-slate-400 line-through' 
                            : 'text-white'
                        }`}>
                          {task.titre}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(task.priorite || task.priority)}`}>
                        {task.priorite || task.priority || 'normale'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-slate-400 ml-8">
                      <span>{task.module || 'Aucun module'}</span>
                      <span>{task.dateEcheance ? new Date(task.dateEcheance).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS en tant que style global */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }
        `
      }} />
    </div>
  );
};

export default Dashboard;