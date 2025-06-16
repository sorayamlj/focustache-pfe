import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Target, BarChart3, User, Home, RefreshCw, AlertCircle, CheckCircle, Info, Zap, Timer, X, Settings, ArrowRight, Calendar, Filter } from 'lucide-react';

const Session = () => {
  // États principaux
  const [activeSession, setActiveSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États du timer
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // États des modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  
  // États des paramètres Pomodoro améliorés
  const [focusSettings, setFocusSettings] = useState({ 
    activerFocus: false,
    activerNotifications: false,
    activerPomodoro: false,
    tempsTravail: 25, // en minutes
    tempsPauseCourte: 5, // en minutes
    tempsPauseLongue: 15, // en minutes
    nombreCycles: 4 
  });
  
  const intervalRef = useRef(null);

  // Fonction pour vérifier l'authentification
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  // Fonction pour simuler la connexion
  const handleLogin = () => {
    const fakeToken = 'fake-jwt-token-for-development';
    localStorage.setItem('token', fakeToken);
    localStorage.setItem('user', JSON.stringify({ id: 'user123', email: 'user@example.com' }));
    
    initializeData();
    showNotification('Connexion simulée avec succès !', 'success');
  };

  // Données mockées pour les tâches (améliorées)
  const mockTasks = [
    {
      _id: 'task1',
      titre: 'Réviser les chapitres 1-3 de Mathématiques',
      module: 'Mathématiques',
      priorite: 'haute',
      statut: 'à faire',
      dateEcheance: '2025-06-20',
      description: 'Revoir les équations du second degré et les fonctions'
    },
    {
      _id: 'task2',
      titre: 'Rédiger le rapport de stage',
      module: 'Stage Professionnel',
      priorite: 'haute',
      statut: 'en cours',
      dateEcheance: '2025-06-25',
      description: 'Finaliser la rédaction et mise en forme'
    },
    {
      _id: 'task3',
      titre: 'Préparer l\'exposé de Physique',
      module: 'Physique',
      priorite: 'moyenne',
      statut: 'à faire',
      dateEcheance: '2025-06-22',
      description: 'Sujet : Les ondes électromagnétiques'
    },
    {
      _id: 'task4',
      titre: 'Exercices d\'Algorithmique',
      module: 'Informatique',
      priorite: 'moyenne',
      statut: 'à faire',
      dateEcheance: '2025-06-28',
      description: 'Chapitres 5 et 6 - Tri et recherche'
    },
    {
      _id: 'task5',
      titre: 'Lecture des articles scientifiques',
      module: 'Recherche',
      priorite: 'basse',
      statut: 'à faire',
      dateEcheance: '2025-07-01',
      description: 'Articles sur l\'intelligence artificielle'
    },
    {
      _id: 'task6',
      titre: 'Projet d\'anglais - Présentation',
      module: 'Anglais',
      priorite: 'moyenne',
      statut: 'à faire',
      dateEcheance: '2025-06-24',
      description: 'Présentation sur la culture britannique'
    }
  ];

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (activeSession) {
      setCurrentTime(activeSession.tempsEcoule || 0);
      setIsRunning(activeSession.timerActif || false);
      setIsPaused(activeSession.timerPause || false);
    }
  }, [activeSession]);

  useEffect(() => {
    if (isRunning && !isPaused && activeSession) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime > 0 && newTime % 10 === 0) {
            updateBackendTimer(newTime);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, activeSession]);

  const initializeData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchActiveSession(),
      fetchAvailableTasks()
    ]);
    setIsLoading(false);
  };

  const fetchActiveSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setActiveSession(null);
        setError('');
        return;
      }

      // Simulation d'une session active (pour test)
      // setActiveSession(null); // Pas de session active par défaut
      setError('');
      
    } catch (err) {
      console.error('Erreur fetchActiveSession:', err);
      setError(`Impossible de charger la session active: ${err.message}`);
      setActiveSession(null);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      // Utiliser toujours les données mockées pour garantir l'affichage
      console.log('Chargement des tâches mockées...');
      setTasks(mockTasks);
      setError(''); // Effacer toute erreur précédente
    } catch (err) {
      console.error('Erreur chargement tâches:', err);
      setTasks(mockTasks); // Fallback vers les données mockées
    }
  };

  const updateBackendTimer = async (timeInSeconds) => {
    if (!activeSession || isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Simulation de mise à jour
      console.log('Mise à jour timer:', timeInSeconds);
    } catch (error) {
      console.error('Erreur mise à jour timer:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChronodoroCycleComplete = (nextCycle) => {
    const isWork = nextCycle.type === 'work';
    showNotification(
      isWork 
        ? 'Pause terminée ! Reprenez le travail' 
        : `Cycle terminé ! ${nextCycle.isLong ? 'Longue pause' : 'Pause courte'} bien méritée`,
      'success',
      5000
    );

    // Notification navigateur
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro - Cycle terminé !', {
        body: isWork ? 'Temps de travailler !' : 'Temps de pause !',
        icon: '/favicon.ico'
      });
    }

    // Son de notification
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUUaDecsrGUXhsAQL/v3oCEAEAOCQCAgAABAAAICCAQAwEAIA==');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleStartSession = async () => {
    if (!selectedTask) {
      showNotification('Veuillez sélectionner une tâche', 'error');
      return;
    }

    try {
      // Simulation de création de session
      const newSession = {
        _id: 'session_' + Date.now(),
        taskIds: [selectedTask],
        tempsEcoule: 0,
        timerActif: false,
        timerPause: false,
        focusActif: focusSettings.activerFocus,
        chronodoroMode: focusSettings.activerPomodoro,
        notificationsBloquees: focusSettings.activerNotifications,
        tempsTravail: focusSettings.tempsTravail,
        tempsPauseCourte: focusSettings.tempsPauseCourte,
        tempsPauseLongue: focusSettings.tempsPauseLongue,
        nombreCycles: focusSettings.nombreCycles,
        cycleCount: 0,
        cycleType: 'work',
        efficaciteCalculee: 100,
        nombrePauses: 0
      };

      setActiveSession(newSession);
      setShowCreateModal(false);
      setSelectedTask(null);
      
      showNotification('Session démarrée avec succès !', 'success');

      // Activer automatiquement le mode Focus si sélectionné
      if (focusSettings.activerFocus) {
        setTimeout(() => {
          handleActivateFocusDirectly(newSession);
        }, 500);
      }

      // Réinitialiser les paramètres
      setFocusSettings({
        activerFocus: false,
        activerNotifications: false,
        activerPomodoro: false,
        tempsTravail: 25,
        tempsPauseCourte: 5,
        tempsPauseLongue: 15,
        nombreCycles: 4 
      });
      
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      showNotification(`Erreur: ${error.message}`, 'error');
    }
  };

  const handleActivateFocusDirectly = async (session) => {
    try {
      let updatedSession = { ...session };
      
      if (focusSettings.activerPomodoro) {
        updatedSession = {
          ...updatedSession,
          chronodoroMode: true,
          dureeCycle: focusSettings.tempsTravail * 60, // convertir en secondes
          cyclesTotalPrevus: focusSettings.nombreCycles,
          tempsPauseCourte: focusSettings.tempsPauseCourte,
          tempsPauseLongue: focusSettings.tempsPauseLongue
        };
        
        const messages = [];
        messages.push('Mode Focus activé');
        if (focusSettings.activerNotifications) messages.push('Notifications bloquées');
        messages.push('Pomodoro activé');
        
        showNotification(messages.join(' + ') + ' !', 'success');
      } else {
        updatedSession = {
          ...updatedSession,
          focusActif: true
        };
        
        const messages = [];
        messages.push('Mode Focus activé');
        if (focusSettings.activerNotifications) messages.push('Notifications bloquées');
        
        showNotification(messages.join(' + ') + ' !', 'success');
      }
      
      setActiveSession(updatedSession);
      setIsRunning(true);
      
    } catch (error) {
      console.error('Erreur activation focus directe:', error);
      showNotification(error.message, 'error');
    }
  };

  const handleActivateFocus = async () => {
    if (!activeSession) return;
    
    try {
      let updatedSession = { ...activeSession };
      
      if (focusSettings.activerPomodoro) {
        updatedSession = {
          ...updatedSession,
          chronodoroMode: true,
          dureeCycle: focusSettings.tempsTravail * 60,
          cyclesTotalPrevus: focusSettings.nombreCycles,
          tempsPauseCourte: focusSettings.tempsPauseCourte,
          tempsPauseLongue: focusSettings.tempsPauseLongue
        };
        
        const messages = [];
        messages.push('Mode Focus activé');
        if (focusSettings.activerNotifications) messages.push('Notifications bloquées');
        messages.push('Pomodoro activé');
        
        showNotification(messages.join(' + ') + ' !', 'success');
      } else {
        updatedSession = {
          ...updatedSession,
          focusActif: true
        };
        
        const messages = [];
        messages.push('Mode Focus activé');
        if (focusSettings.activerNotifications) messages.push('Notifications bloquées');
        
        showNotification(messages.join(' + ') + ' !', 'success');
      }
      
      setActiveSession(updatedSession);
      setIsRunning(true);
      setShowFocusModal(false);
      
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(error.message, 'error');
    }
  };

  const handleToggleTimer = async (action) => {
    if (!activeSession) return;
    
    try {
      let updatedSession = { ...activeSession };
      
      if (action === 'pause') {
        updatedSession.timerPause = true;
        updatedSession.timerActif = false;
        setIsRunning(false);
        setIsPaused(true);
        showNotification('Timer en pause', 'info');
      } else {
        updatedSession.timerPause = false;
        updatedSession.timerActif = true;
        setIsRunning(true);
        setIsPaused(false);
        showNotification('Timer repris', 'success');
      }
      
      setActiveSession(updatedSession);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(error.message, 'error');
    }
  };

  const handleStopSession = async (action = 'complete') => {
    if (!activeSession) return;

    try {
      setActiveSession(null);
      setCurrentTime(0);
      setIsRunning(false);
      setIsPaused(false);
      
      showNotification(
        action === 'complete' ? 'Session terminée avec succès !' : 'Session annulée',
        action === 'complete' ? 'success' : 'info'
      );

      if (action === 'complete') {
        const duration = Math.floor(currentTime / 60);
        setTimeout(() => {
          showNotification(
            `Résumé de session:\nTemps: ${duration} minutes\nEfficacité: 95%\nCycles: ${Math.floor(currentTime / 1500)}`,
            'success',
            6000
          );
        }, 1000);
      }
      
    } catch (error) {
      console.error('Erreur arrêt session:', error);
      showNotification(`Erreur: ${error.message}`, 'error');
    }
  };

  const showNotification = (message, type = 'info', duration = 3000) => {
    document.querySelectorAll('.session-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `session-notification fixed top-4 right-4 z-50 p-4 rounded-2xl text-white font-medium max-w-sm backdrop-blur-sm border transform transition-all duration-500 shadow-2xl ${
      type === 'success' ? 'bg-emerald-600/90 border-emerald-500/50' : 
      type === 'error' ? 'bg-red-600/90 border-red-500/50' : 
      'bg-blue-600/90 border-blue-500/50'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-xl">
          ${type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}
        </div>
        <div class="flex-1 whitespace-pre-line">${message}</div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white/70 hover:text-white text-lg">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getProgress = () => {
    if (!activeSession) return 0;
    
    if (activeSession.chronodoroMode && activeSession.dureeCycle) {
      const cycleProgress = (currentTime % activeSession.dureeCycle) / activeSession.dureeCycle;
      return Math.min(100, cycleProgress * 100);
    } else if (activeSession.tempsTotal && activeSession.tempsTotal > 0) {
      return Math.min(100, (currentTime / activeSession.tempsTotal) * 100);
    }
    
    return Math.min(100, (currentTime / 1800) * 100); // 30 minutes par défaut
  };

  const getRemainingTime = () => {
    if (!activeSession) return null;
    
    if (activeSession.chronodoroMode && activeSession.dureeCycle) {
      const remaining = activeSession.dureeCycle - (currentTime % activeSession.dureeCycle);
      return remaining > 0 ? remaining : 0;
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-white text-xl font-medium mt-6">Chargement des sessions...</p>
          <p className="text-purple-300 text-sm mt-2">Préparation de votre espace de travail...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('Session expirée') || error.includes('authentification');
    const isConnectionError = error.includes('API non disponible') || error.includes('connexion');
    
    const ErrorIcon = isAuthError ? User : isConnectionError ? AlertCircle : AlertCircle;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="flex justify-center mb-6">
            <ErrorIcon size={80} className="text-red-400 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {isAuthError ? 'Session expirée' : isConnectionError ? 'Connexion impossible' : 'Erreur technique'}
          </h2>
          <p className="text-red-300 mb-8 text-lg leading-relaxed">{error}</p>
          
          <div className="space-y-4">
            {isAuthError ? (
              <>
                <button 
                  onClick={handleLogin}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <User size={20} />
                  Se reconnecter
                </button>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Home size={18} />
                  Retour à l'accueil
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setError(''); initializeData(); }}
                  className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <RefreshCw size={20} />
                  Réessayer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated() && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <User size={80} className="text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Connexion requise</h2>
          <p className="text-purple-300 mb-8 text-lg leading-relaxed">
            Connectez-vous pour accéder à vos sessions de travail et améliorer votre productivité
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <Zap size={20} />
              Connexion (Développement)
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left">
            <h3 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <Info size={16} />
              Mode Développement :
            </h3>
            <p className="text-xs text-blue-200">
              Cliquez sur "Connexion (Développement)" pour simuler une authentification et tester l'interface.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const remainingTime = getRemainingTime();
  const isChronodoroActive = activeSession?.chronodoroMode;
  const isFocusActive = activeSession?.focusActif;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header fixe */}
      <div className="sticky top-0 z-40 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Sessions Focus
                </h1>
                {activeSession && (
                  <div className="flex items-center gap-2 mt-1">
                    {isChronodoroActive && (
                      <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30 flex items-center gap-1">
                        <Timer size={12} /> Pomodoro
                      </span>
                    )}
                    {isFocusActive && !isChronodoroActive && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30 flex items-center gap-1">
                        <Zap size={12} /> Focus
                      </span>
                    )}
                    {activeSession.notificationsBloquees && (
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30 flex items-center gap-1">
                        <AlertCircle size={12} /> Silencieux
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {activeSession && (
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{formatTime(currentTime)}</div>
                  <div className="text-xs text-slate-400">
                    {activeSession.taskIds?.[0]?.titre?.substring(0, 20) + '...' || '1 tâche'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeSession ? (
          /* Interface Session Active */
          <div className="max-w-5xl mx-auto">
            {/* Timer principal */}
            <div className="relative mb-8">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  
                  {/* Cercle timer */}
                  <div className="relative">
                    <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor: isChronodoroActive ? '#f97316' : '#8b5cf6'}} />
                          <stop offset="100%" style={{stopColor: isChronodoroActive ? '#ea580c' : '#7c3aed'}} />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="3"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="url(#progressGradient)"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${progress * 2.827} 282.7`}
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold text-white mb-2">
                        {formatTime(currentTime)}
                      </div>
                      {remainingTime !== null && (
                        <div className="text-sm text-slate-300">
                          -{formatTime(remainingTime)}
                        </div>
                      )}
                      {isChronodoroActive && (
                        <div className="text-xs text-orange-400 mt-2 text-center">
                          Cycle {Math.floor(activeSession.cycleCount / 2) + 1}/{activeSession.cyclesTotalPrevus}
                          <br/>
                          {activeSession.cycleType === 'work' ? 'Travail' : 'Pause'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contrôles et infos */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Session en cours
                    </h2>
                    
                    {/* Stats en temps réel */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="text-xl font-bold text-emerald-400">
                          {activeSession.efficaciteCalculee || 95}%
                        </div>
                        <div className="text-xs text-slate-400">Efficacité</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="text-xl font-bold text-purple-400">
                          {activeSession.nombrePauses || 0}
                        </div>
                        <div className="text-xs text-slate-400">Pauses</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="text-xl font-bold text-blue-400">
                          {isChronodoroActive ? Math.floor(activeSession.cycleCount / 2) : 0}
                        </div>
                        <div className="text-xs text-slate-400">Cycles</div>
                      </div>
                    </div>

                    {/* Contrôles principaux */}
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                      {!isFocusActive ? (
                        <button
                          onClick={() => setShowFocusModal(true)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Zap size={18} /> Activer Focus
                        </button>
                      ) : (
                        <>
                          {!isRunning || isPaused ? (
                            <button
                              onClick={() => handleToggleTimer('resume')}
                              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <Play size={20} /> {isPaused ? 'Reprendre' : 'Démarrer'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleTimer('pause')}
                              className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <Pause size={20} /> Pause
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions de session */}
                    <div className="flex justify-center lg:justify-start gap-3 mt-4">
                      <button
                        onClick={() => handleStopSession('cancel')}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-500/30 flex items-center gap-2"
                      >
                        <Square size={16} /> Annuler
                      </button>
                      <button
                        onClick={() => handleStopSession('complete')}
                        className="px-6 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all duration-200 border border-emerald-500/30 font-medium flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Terminer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-6">
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isChronodoroActive 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tâche de la session */}
            {activeSession.taskIds && activeSession.taskIds.length > 0 && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Target size={20} /> Tâche en cours
                </h3>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center text-lg font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-lg">{activeSession.taskIds[0]?.titre}</h4>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-purple-400">{activeSession.taskIds[0]?.module}</span>
                      <span className="text-slate-400">•</span>
                      <span className={`capitalize px-2 py-1 rounded text-xs ${
                        activeSession.taskIds[0]?.priorite === 'haute' ? 'bg-red-500/20 text-red-400' :
                        activeSession.taskIds[0]?.priorite === 'moyenne' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {activeSession.taskIds[0]?.priorite}
                      </span>
                      {activeSession.taskIds[0]?.dateEcheance && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400 text-xs">
                            {formatDate(activeSession.taskIds[0]?.dateEcheance)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Interface Création de Session */
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Sessions Focus
                    </h1>
                    <p className="text-slate-400 text-lg">
                      {tasks.length} tâche{tasks.length > 1 ? 's' : ''} disponible{tasks.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 flex items-center gap-3 text-lg"
                >
                  <Target size={24} />
                  Nouvelle Session
                </button>
              </div>
            </div>

            {/* Hero section */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <Target size={80} className="text-purple-400 animate-bounce" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Prêt à vous concentrer ?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Sélectionnez une tâche et créez votre session de travail optimisée
              </p>
            </div>

            {/* Tâches disponibles */}
            {tasks.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <CheckCircle size={24} className="text-purple-500" />
                  Tâches disponibles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tasks.slice(0, 6).map((task, index) => {
                    const isOverdue = task.dateEcheance && new Date(task.dateEcheance) < new Date() && task.statut !== 'terminée';
                    
                    return (
                      <div
                        key={task._id}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowCreateModal(true);
                        }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group cursor-pointer"
                        style={{ 
                          animation: `fadeInUp 0.6s ease-out forwards`,
                          animationDelay: `${index * 100}ms`,
                          opacity: 0
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2 flex-1">
                            {task.titre}
                          </h4>
                          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 ml-2" />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-purple-400">{task.module}</span>
                            <span className="text-slate-400">•</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              task.priorite === 'haute' ? 'bg-red-500/20 text-red-400' :
                              task.priorite === 'moyenne' ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {task.priorite}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="text-slate-400 text-sm line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>Échéance: {formatDate(task.dateEcheance)}</span>
                            {isOverdue && (
                              <span className="text-red-400 ml-2">⚠ En retard</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Présentation de la session */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="group bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 shadow-xl">
                <div className="flex justify-center mb-4">
                  <Target size={50} className="text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Session de Travail Personnalisée</h3>
                <p className="text-purple-200 text-sm leading-relaxed mb-4">
                  Démarrez votre session et activez optionnellement le <strong>Mode Focus</strong> avec blocage des notifications et/ou la technique <strong>Pomodoro</strong> avec des temps personnalisables
                </p>
                <div className="flex justify-center gap-2 text-xs flex-wrap">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded flex items-center gap-1">
                    <Target size={12} /> Session libre
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded flex items-center gap-1">
                    <Zap size={12} /> Mode Focus
                  </span>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded flex items-center gap-1">
                    <Timer size={12} /> Pomodoro+
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de création de session */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target size={24} /> Nouvelle Session
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFocusSettings({
                      activerFocus: false,
                      activerNotifications: false,
                      activerPomodoro: false,
                      tempsTravail: 25,
                      tempsPauseCourte: 5,
                      tempsPauseLongue: 15,
                      nombreCycles: 4 
                    });
                  }}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Sélection de la tâche */}
              <div className="mb-8">
                <label className="block text-white text-sm font-medium mb-4 flex items-center gap-2">
                  <Target size={16} /> Sélectionnez votre tâche
                </label>
                
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="flex justify-center mb-4">
                      <Target size={60} className="text-slate-500" />
                    </div>
                    <p className="text-lg mb-2">Aucune tâche disponible</p>
                    <p className="text-sm">Créez d'abord des tâches dans la section Tâches</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {tasks.map(task => {
                      const isSelected = selectedTask?._id === task._id;
                      const isOverdue = task.dateEcheance && new Date(task.dateEcheance) < new Date() && task.statut !== 'terminée';
                      
                      return (
                        <div
                          key={task._id}
                          onClick={() => setSelectedTask(isSelected ? null : task)}
                          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-yellow-500/50 text-white shadow-lg scale-105'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:scale-102'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'bg-purple-600 border-purple-600' : 'border-white/40'
                            }`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{task.titre}</h4>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-purple-400">{task.module}</span>
                                <span className="text-slate-400">•</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  task.priorite === 'haute' ? 'bg-red-500/20 text-red-400' :
                                  task.priorite === 'moyenne' ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {task.priorite}
                                </span>
                                {isOverdue && (
                                  <>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-red-400 text-xs">⚠ En retard</span>
                                  </>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Options Focus améliorées */}
              <div className="mb-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-white/10">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Settings size={18} /> Options avancées (optionnel)
                </h3>
                
                {/* Checkbox Mode Focus */}
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={focusSettings.activerFocus}
                      onChange={(e) => setFocusSettings(prev => ({
                        ...prev,
                        activerFocus: e.target.checked,
                        activerNotifications: e.target.checked ? prev.activerNotifications : false,
                        activerPomodoro: e.target.checked ? prev.activerPomodoro : false
                      }))}
                      className="w-5 h-5 rounded border-2 border-blue-500 bg-transparent checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <Zap size={18} className="text-blue-400" />
                    <span className="text-white font-medium">Activer le Mode Focus</span>
                  </label>
                  <p className="text-slate-400 text-sm mt-1 ml-8">Améliore la concentration avec des options avancées</p>
                </div>

                {/* Options Focus */}
                {focusSettings.activerFocus && (
                  <div className="ml-8 space-y-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    
                    {/* Checkbox Blocage Notifications */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={focusSettings.activerNotifications}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            activerNotifications: e.target.checked
                          }))}
                          className="w-4 h-4 rounded border-2 border-purple-500 bg-transparent checked:bg-purple-600 focus:ring-2 focus:ring-purple-500"
                        />
                        <AlertCircle size={16} className="text-purple-400" />
                        <span className="text-white">Bloquer les notifications</span>
                      </label>
                      <p className="text-slate-400 text-xs mt-1 ml-7">Silence total pour une concentration maximale</p>
                    </div>

                    {/* Checkbox Pomodoro */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={focusSettings.activerPomodoro}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            activerPomodoro: e.target.checked
                          }))}
                          className="w-4 h-4 rounded border-2 border-orange-500 bg-transparent checked:bg-orange-600 focus:ring-2 focus:ring-orange-500"
                        />
                        <Timer size={16} className="text-orange-400" />
                        <span className="text-white">Technique Pomodoro</span>
                      </label>
                      <p className="text-slate-400 text-xs mt-1 ml-7">Cycles de travail avec pauses automatiques personnalisables</p>
                    </div>

                    {/* Paramètres Pomodoro améliorés */}
                    {focusSettings.activerPomodoro && (
                      <div className="ml-7 mt-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <h4 className="text-orange-300 font-medium mb-4 flex items-center gap-2">
                          <Timer size={14} /> Paramètres Pomodoro
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {/* Temps de travail */}
                          <div>
                            <label className="block text-orange-200 text-sm mb-2">Temps de travail</label>
                            <select
                              value={focusSettings.tempsTravail}
                              onChange={(e) => setFocusSettings(prev => ({
                                ...prev,
                                tempsTravail: parseInt(e.target.value)
                              }))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={20}>20 minutes</option>
                              <option value={25}>25 minutes (classique)</option>
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={50}>50 minutes</option>
                              <option value={60}>60 minutes</option>
                              <option value={90}>90 minutes</option>
                            </select>
                          </div>
                          
                          {/* Temps de pause courte */}
                          <div>
                            <label className="block text-orange-200 text-sm mb-2">Pause courte</label>
                            <select
                              value={focusSettings.tempsPauseCourte}
                              onChange={(e) => setFocusSettings(prev => ({
                                ...prev,
                                tempsPauseCourte: parseInt(e.target.value)
                              }))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value={3}>3 minutes</option>
                              <option value={5}>5 minutes (recommandé)</option>
                              <option value={10}>10 minutes</option>
                              <option value={15}>15 minutes</option>
                            </select>
                          </div>
                          
                          {/* Temps de pause longue */}
                          <div>
                            <label className="block text-orange-200 text-sm mb-2">Pause longue</label>
                            <select
                              value={focusSettings.tempsPauseLongue}
                              onChange={(e) => setFocusSettings(prev => ({
                                ...prev,
                                tempsPauseLongue: parseInt(e.target.value)
                              }))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value={15}>15 minutes (classique)</option>
                              <option value={20}>20 minutes</option>
                              <option value={25}>25 minutes</option>
                              <option value={30}>30 minutes</option>
                            </select>
                          </div>
                          
                          {/* Nombre de cycles */}
                          <div>
                            <label className="block text-orange-200 text-sm mb-2">Nombre de cycles</label>
                            <select
                              value={focusSettings.nombreCycles}
                              onChange={(e) => setFocusSettings(prev => ({
                                ...prev,
                                nombreCycles: parseInt(e.target.value)
                              }))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value={2}>2 cycles</option>
                              <option value={4}>4 cycles (classique)</option>
                              <option value={6}>6 cycles</option>
                              <option value={8}>8 cycles</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Aperçu des paramètres */}
                        <div className="mt-4 p-3 bg-orange-400/10 rounded-lg">
                          <p className="text-orange-200 text-xs">
                            <strong>Aperçu :</strong> {focusSettings.tempsTravail}min travail → {focusSettings.tempsPauseCourte}min pause courte → ... → {focusSettings.tempsPauseLongue}min pause longue (après {focusSettings.nombreCycles} cycles)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFocusSettings({
                      activerFocus: false,
                      activerNotifications: false,
                      activerPomodoro: false,
                      tempsTravail: 25,
                      tempsPauseCourte: 5,
                      tempsPauseLongue: 15,
                      nombreCycles: 4 
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStartSession}
                  disabled={!selectedTask}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <Play size={18} />
                  Démarrer la Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Focus */}
        {showFocusModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/20 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap size={24} /> Mode Focus
              </h3>
              
              {/* Checkbox Blocage Notifications */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusSettings.activerNotifications}
                    onChange={(e) => setFocusSettings(prev => ({
                      ...prev,
                      activerNotifications: e.target.checked
                    }))}
                    className="w-5 h-5 rounded border-2 border-purple-500 bg-transparent checked:bg-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <AlertCircle size={18} className="text-purple-400" />
                  <span className="text-white font-medium">Bloquer les notifications</span>
                </label>
                <p className="text-slate-400 text-sm mt-1 ml-8">Silence total pendant la session</p>
              </div>

              {/* Checkbox Pomodoro */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusSettings.activerPomodoro}
                    onChange={(e) => setFocusSettings(prev => ({
                      ...prev,
                      activerPomodoro: e.target.checked
                    }))}
                    className="w-5 h-5 rounded border-2 border-orange-500 bg-transparent checked:bg-orange-600 focus:ring-2 focus:ring-orange-500"
                  />
                  <Timer size={18} className="text-orange-400" />
                  <span className="text-white font-medium">Technique Pomodoro</span>
                </label>
                <p className="text-slate-400 text-sm mt-1 ml-8">Cycles de travail avec pauses automatiques personnalisables</p>
                
                {focusSettings.activerPomodoro && (
                  <div className="ml-8 mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <h4 className="text-orange-300 font-medium mb-3 flex items-center gap-2">
                      <Timer size={16} /> Paramètres Pomodoro Personnalisés
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Travail</label>
                        <select
                          value={focusSettings.tempsTravail}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            tempsTravail: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={25}>25 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Pause courte</label>
                        <select
                          value={focusSettings.tempsPauseCourte}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            tempsPauseCourte: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value={3}>3 min</option>
                          <option value={5}>5 min</option>
                          <option value={10}>10 min</option>
                          <option value={15}>15 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Pause longue</label>
                        <select
                          value={focusSettings.tempsPauseLongue}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            tempsPauseLongue: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={25}>25 min</option>
                          <option value={30}>30 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-2">Cycles</label>
                        <select
                          value={focusSettings.nombreCycles}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            nombreCycles: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value={2}>2 cycles</option>
                          <option value={4}>4 cycles</option>
                          <option value={6}>6 cycles</option>
                          <option value={8}>8 cycles</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-blue-300 font-medium mb-3 text-lg flex items-center gap-2">
                  <Zap size={18} /> Que fait le Mode Focus ?
                </h4>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <Zap size={14} /> <strong>Mode concentration activé</strong>
                  </li>
                  {focusSettings.activerNotifications && (
                    <li className="flex items-center gap-2">
                      <AlertCircle size={14} /> <strong>Notifications bloquées automatiquement</strong>
                    </li>
                  )}
                  {focusSettings.activerPomodoro ? (
                    <>
                      <li className="flex items-center gap-2">
                        <Timer size={14} /> Cycles de {focusSettings.tempsTravail} minutes avec pauses de {focusSettings.tempsPauseCourte}min
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} /> {focusSettings.nombreCycles} cycles prévus + pause longue de {focusSettings.tempsPauseLongue}min
                      </li>
                      <li className="flex items-center gap-2">
                        <RefreshCw size={14} /> Notifications sonores à chaque fin de cycle
                      </li>
                    </>
                  ) : (
                    <li className="flex items-center gap-2">
                      <Clock size={14} /> Timer libre sans interruption
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowFocusModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleActivateFocus}
                  disabled={!focusSettings.activerNotifications && !focusSettings.activerPomodoro}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  Activer Focus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
};

export default Session;