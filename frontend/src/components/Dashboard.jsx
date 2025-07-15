import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  BookOpen, 
  Target, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Edit3, 
  Play, 
  Timer,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Home,
  Zap
} from 'lucide-react';

// ✅ Import du système de notifications
import { useNotificationsSafe } from '../hooks/useNotificationsSafe';

const Dashboard = ({ user, onNavigate }) => {
  // ✅ Hook de notifications
  const {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyTask,
    notifyAchievement
  } = useNotificationsSafe();

  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0, pending: 0, urgent: 0, overdue: 0 },
    sessions: { today: 0, todayTime: 0, thisWeek: 0, totalTime: 0 },
    notes: { total: 0, recent: [] },
    calendar: { todayTasks: 0, upcomingTasks: 0, weekEvents: 0 }
  });
  
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ Notification de bienvenue avec style
    const userName = user?.name || user?.nom || 'Étudiant';
    notifyInfo(`Bienvenue ${userName} ! 👋`, {
      title: '🏠 Dashboard chargé',
      duration: 3000
    });

    loadDashboardData();
  }, []);

  // Fonction pour obtenir le token d'authentification
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // ✅ Fonction API améliorée avec notifications d'erreur
  const apiCall = async (url, options = {}) => {
    const token = getAuthToken();
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      if (!response.ok) {
        // ✅ Notification d'erreur spécifique selon le statut
        if (response.status === 401) {
          notifyError('Session expirée, veuillez vous reconnecter', {
            title: '🔒 Authentification requise',
            persistent: true
          });
        } else if (response.status === 404) {
          notifyWarning('Ressource non trouvée', {
            title: '🔍 Erreur 404'
          });
        } else if (response.status >= 500) {
          notifyError('Erreur serveur, réessayez plus tard', {
            title: '🔧 Problème technique'
          });
        } else {
          notifyError(`Erreur API: ${response.status}`, {
            title: '⚠️ Erreur réseau'
          });
        }
        throw new Error(`Erreur API: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // ✅ Notification pour erreurs de connexion
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        notifyError('Impossible de se connecter au serveur', {
          title: '🌐 Problème de connexion',
          persistent: true
        });
      }
      throw error;
    }
  };

  // Charger les données depuis l'API
  const loadTasks = async () => {
    try {
      const response = await apiCall('http://localhost:5000/api/tasks');
      const tasks = response.tasks || response || [];
      
      // ✅ Notification discrète pour le chargement des tâches
      if (tasks.length > 0) {
        notifyTask(`${tasks.length} tâche${tasks.length > 1 ? 's' : ''} chargée${tasks.length > 1 ? 's' : ''}`, {
          duration: 2000
        });
      }
      
      return tasks;
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      return [];
    }
  };

  const loadSessions = async () => {
    try {
      const response = await apiCall('http://localhost:5000/api/sessions');
      const sessions = response.sessions || response || [];
      return sessions;
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
      return [];
    }
  };

  const loadNotes = async () => {
    try {
      const response = await apiCall('http://localhost:5000/api/notes');
      const notes = response.notes || response || [];
      return notes;
    } catch (error) {
      console.error('Erreur chargement notes:', error);
      return [];
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ Notification de début de chargement
      notifyInfo('Actualisation des données...', {
        title: '🔄 Chargement',
        duration: 1500
      });

      // Charger toutes les données en parallèle
      const [tasks, sessions, notes] = await Promise.all([
        loadTasks(),
        loadSessions(),
        loadNotes()
      ]);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calcul des statistiques des tâches
      const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.statut === 'terminée').length,
        pending: tasks.filter(t => t.statut === 'à faire').length,
        inProgress: tasks.filter(t => t.statut === 'en cours').length,
        urgent: tasks.filter(t => t.priorite === 'haute' && t.statut !== 'terminée').length,
        overdue: tasks.filter(t => 
          t.statut !== 'terminée' && 
          t.dateEcheance && 
          new Date(t.dateEcheance) < now
        ).length
      };

      // ✅ Notifications contextuelles selon les statistiques
      if (taskStats.overdue > 0) {
        notifyWarning(
          `${taskStats.overdue} tâche${taskStats.overdue > 1 ? 's' : ''} en retard !`,
          {
            title: '⏰ Attention aux échéances',
            persistent: true
          }
        );
      }

      if (taskStats.urgent > 0) {
        notifyWarning(
          `${taskStats.urgent} tâche${taskStats.urgent > 1 ? 's' : ''} priorité haute`,
          {
            title: '🔥 Tâches urgentes',
            duration: 6000
          }
        );
      }

      // Calcul des statistiques des sessions
      const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.createdAt || s.updatedAt);
        return sessionDate >= today;
      });

      const thisWeekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.createdAt || s.updatedAt);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      });

      const sessionStats = {
        today: todaySessions.length,
        todayTime: todaySessions.reduce((total, s) => total + (s.tempsEcoule || 0), 0) / 60,
        thisWeek: thisWeekSessions.length,
        totalTime: sessions.reduce((total, s) => total + (s.tempsEcoule || 0), 0) / 60
      };

      // ✅ Achievement si belle session aujourd'hui
      if (sessionStats.todayTime > 60) { // Plus d'1 heure
        notifyAchievement(
          `Excellent ! ${formatTime(sessionStats.todayTime)} de focus aujourd'hui`,
          {
            title: '🔥 Productivité maximale !',
            persistent: true
          }
        );
      }

      // Statistiques des notes
      const noteStats = {
        total: notes.length,
        recent: notes.slice(0, 2)
      };

      // Tâches récentes
      const recentTasks = tasks
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5);

      // Notes récentes
      const recentNotes = notes
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 3);

      // Mettre à jour les états
      setStats({
        tasks: taskStats,
        sessions: sessionStats,
        notes: noteStats,
        calendar: { todayTasks: 0, upcomingTasks: 0, weekEvents: 0 }
      });

      setRecentTasks(recentTasks);
      setRecentNotes(recentNotes);

      // ✅ Notification de succès de chargement
      notifySuccess('Dashboard mis à jour !', {
        title: '✨ Données actualisées',
        duration: 2000
      });

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setError('Impossible de charger les données du dashboard');
      
      // ✅ Notification d'erreur globale
      notifyError('Échec du chargement des données', {
        title: '❌ Erreur Dashboard',
        persistent: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Amélioration de la navigation avec notifications
  const handleQuickAction = (action) => {
    // ✅ Notification contextuelle selon l'action
    const actionMessages = {
      tasks: { message: 'Ouverture de la gestion des tâches', icon: '📋' },
      sessions: { message: 'Prêt à démarrer une session focus', icon: '🎯' },
      notes: { message: 'Accès à vos notes', icon: '📝' },
      calendar: { message: 'Consultation du calendrier', icon: '📅' },
      stats: { message: 'Analyse de vos statistiques', icon: '📊' }
    };

    const actionInfo = actionMessages[action];
    if (actionInfo) {
      notifyInfo(actionInfo.message, {
        title: `${actionInfo.icon} Navigation`,
        duration: 2000
      });
    }

    if (onNavigate) {
      onNavigate(`/${action}`);
    } else {
      // Navigation directe vers la page
      window.location.href = `/${action}`;
    }
  };

  // ✅ Fonction de rafraîchissement avec feedback
  const handleRefresh = async () => {
    notifyInfo('Actualisation en cours...', {
      title: '🔄 Rechargement',
      duration: 1000
    });
    
    await loadDashboardData();
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute': return 'text-red-400 bg-red-500/20';
      case 'moyenne': return 'text-yellow-400 bg-yellow-500/20';
      case 'basse': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'terminée': return 'text-green-400';
      case 'en cours': return 'text-blue-400';
      case 'à faire': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 17) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {getGreeting()}, {user?.name || user?.nom || 'Étudiant'} !
                </h1>
                <p className="text-gray-400">Voici un aperçu de votre journée</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              className="p-2 bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ✅ Alerte tâches en retard améliorée */}
        {stats.tasks.overdue > 0 && (
          <div className="bg-red-600/20 border border-red-600/30 rounded p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-300 font-medium">
                  ⚠️ Attention ! {stats.tasks.overdue} tâche{stats.tasks.overdue > 1 ? 's' : ''} en retard
                </p>
                <button 
                  onClick={() => {
                    notifyWarning('Redirection vers les tâches en retard', {
                      title: '🔍 Vérification nécessaire'
                    });
                    handleQuickAction('tasks');
                  }}
                  className="text-sm text-red-200 hover:text-red-100 underline"
                >
                  Voir les tâches en retard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Alerte tâches urgentes */}
        {stats.tasks.urgent > 0 && (
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded p-4 mb-6">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-300 font-medium">
                  🔥 {stats.tasks.urgent} tâche{stats.tasks.urgent > 1 ? 's' : ''} priorité haute à traiter
                </p>
                <button 
                  onClick={() => {
                    notifyInfo('Focus sur les tâches prioritaires', {
                      title: '🎯 Concentration requise'
                    });
                    handleQuickAction('tasks');
                  }}
                  className="text-sm text-yellow-200 hover:text-yellow-100 underline"
                >
                  Voir les tâches urgentes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-indigo-400 mb-1">
              {stats.tasks.pending + stats.tasks.inProgress}
            </div>
            <div className="text-gray-300 text-sm mb-2">Tâches actives</div>
            <div className="text-xs text-gray-400">{stats.tasks.total} au total</div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {stats.sessions.today}
            </div>
            <div className="text-gray-300 text-sm mb-2">Sessions aujourd'hui</div>
            <div className="text-xs text-gray-400">{formatTime(stats.sessions.todayTime)}</div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {stats.notes.total}
            </div>
            <div className="text-gray-300 text-sm mb-2">Notes créées</div>
            <div className="text-xs text-gray-400">{stats.notes.recent.length} récentes</div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stats.tasks.completed}
            </div>
            <div className="text-gray-300 text-sm mb-2">Tâches terminées</div>
            <div className="text-xs text-gray-400">Cette semaine</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Actions rapides */}
          <div className="bg-gray-800 border border-gray-700 rounded p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              Actions rapides
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => handleQuickAction('tasks')}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              >
                <Plus className="w-4 h-4 text-green-400" />
                <span>Nouvelle tâche</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => handleQuickAction('sessions')}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              >
                <Play className="w-4 h-4 text-purple-400" />
                <span>Démarrer session</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => handleQuickAction('notes')}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              >
                <Edit3 className="w-4 h-4 text-yellow-400" />
                <span>Nouvelle note</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => handleQuickAction('calendar')}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              >
                <Calendar className="w-4 h-4 text-pink-400" />
                <span>Voir calendrier</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => handleQuickAction('stats')}
                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Statistiques</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>

          {/* Tâches récentes */}
          <div className="bg-gray-800 border border-gray-700 rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-400" />
                Tâches récentes
              </h2>
              <button
                onClick={() => handleQuickAction('tasks')}
                className="text-green-400 text-sm hover:text-green-300"
              >
                Voir tout
              </button>
            </div>

            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                  <p>Aucune tâche créée</p>
                  <button
                    onClick={() => {
                      notifyInfo('Création de votre première tâche', {
                        title: '📋 Commencer l\'organisation'
                      });
                      handleQuickAction('tasks');
                    }}
                    className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    Créer une tâche
                  </button>
                </div>
              ) : (
                recentTasks.slice(0, 4).map((task) => (
                  <div
                    key={task._id}
                    onClick={() => {
                      notifyInfo(`Ouverture de la tâche: ${task.titre}`, {
                        title: '📋 Consultation tâche',
                        duration: 2000
                      });
                      handleQuickAction('tasks');
                    }}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        task.statut === 'terminée' ? 'bg-green-500' :
                        task.statut === 'en cours' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          task.statut === 'terminée' 
                            ? 'text-gray-400 line-through' 
                            : 'text-white'
                        }`}>
                          {task.titre}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">{task.module}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priorite)}`}>
                            {task.priorite}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes récentes */}
          <div className="bg-gray-800 border border-gray-700 rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-yellow-400" />
                Notes récentes
              </h2>
              <button
                onClick={() => handleQuickAction('notes')}
                className="text-yellow-400 text-sm hover:text-yellow-300"
              >
                Voir tout
              </button>
            </div>

            <div className="space-y-3">
              {recentNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2" />
                  <p>Aucune note créée</p>
                  <button
                    onClick={() => {
                      notifyInfo('Création de votre première note', {
                        title: '📝 Prise de notes'
                      });
                      handleQuickAction('notes');
                    }}
                    className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                  >
                    Créer une note
                  </button>
                </div>
              ) : (
                recentNotes.map((note) => (
                  <div
                    key={note._id}
                    onClick={() => {
                      notifyInfo(`Ouverture de la note: ${note.title || note.titre}`, {
                        title: '📝 Consultation note',
                        duration: 2000
                      });
                      handleQuickAction('notes');
                    }}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition-colors"
                  >
                    <h3 className="font-medium text-white mb-1">
                      {note.title || note.titre}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {note.content ? note.content.substring(0, 50) + '...' : 'Pas de contenu'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.updatedAt || note.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Résumé de la journée */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Résumé de la journée
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-700 rounded">
              <div className="text-lg font-bold text-blue-400 mb-1">
                {stats.tasks.pending + stats.tasks.inProgress}
              </div>
              <div className="text-gray-300 text-sm">Tâches à faire</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700 rounded">
              <div className="text-lg font-bold text-purple-400 mb-1">
                {formatTime(stats.sessions.todayTime)}
              </div>
              <div className="text-gray-300 text-sm">Temps de focus</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700 rounded">
              <div className="text-lg font-bold text-green-400 mb-1">
                {stats.tasks.completed}
              </div>
              <div className="text-gray-300 text-sm">Tâches terminées</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;