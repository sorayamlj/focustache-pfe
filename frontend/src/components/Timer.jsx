import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Clock, Target, Shield, Bell, BellOff } from 'lucide-react';

const FocusTimer = () => {
  // États principaux
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes par défaut
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState('work'); // work, short-break, long-break
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentSession, setCurrentSession] = useState(null);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  
  // Paramètres personnalisables
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    enableNotifications: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Durées en secondes selon le mode
  const getDuration = (mode) => {
    const durations = {
      work: settings.workDuration * 60,
      'short-break': settings.shortBreakDuration * 60,
      'long-break': settings.longBreakDuration * 60
    };
    return durations[mode];
  };

  // Formatage du temps
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gestion du mode focus
  const toggleFocusMode = async () => {
    if (!focusModeActive) {
      // Activer le mode focus
      try {
        // 1. Demander permission pour les notifications
        if ('Notification' in window) {
          await Notification.requestPermission();
        }
        
        // 2. Passer en plein écran pour réduire les distractions
        if (document.documentElement.requestFullscreen) {
          try {
            await document.documentElement.requestFullscreen();
          } catch (err) {
            console.log('Plein écran non autorisé:', err);
          }
        }
        
        // 3. Masquer le curseur après inactivité
        let mouseTimer;
        const hideCursor = () => {
          document.body.style.cursor = 'none';
        };
        const showCursor = () => {
          document.body.style.cursor = 'default';
          clearTimeout(mouseTimer);
          mouseTimer = setTimeout(hideCursor, 3000);
        };
        
        document.addEventListener('mousemove', showCursor);
        mouseTimer = setTimeout(hideCursor, 3000);
        
        // 4. Désactiver les sons du navigateur
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(el => {
          if (el !== audioRef.current) {
            el.muted = true;
          }
        });
        
        // 5. Bloquer les raccourcis clavier distrayants
        const blockKeys = (e) => {
          if (e.ctrlKey && (e.key === 't' || e.key === 'n' || e.key === 'w')) {
            e.preventDefault();
            showNotification('🎯 Mode Focus actif - Navigation bloquée', 'info');
          }
          if (e.key === 'F11') {
            e.preventDefault();
          }
        };
        document.addEventListener('keydown', blockKeys);
        
        // 6. Stocker les fonctions de nettoyage
        window.focusCleanup = {
          showCursor: () => {
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', showCursor);
            clearTimeout(mouseTimer);
          },
          enableAudio: () => {
            const audioElements = document.querySelectorAll('audio, video');
            audioElements.forEach(el => {
              if (el !== audioRef.current) {
                el.muted = false;
              }
            });
          },
          enableKeys: () => {
            document.removeEventListener('keydown', blockKeys);
          }
        };
        
        setNotificationsBlocked(true);
        setFocusModeActive(true);
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎯 Mode Focus Activé', {
            body: 'Plein écran activé, distractions minimisées. Restez concentré!',
            icon: '/focus-icon.png'
          });
        }
        
        showNotification('🎯 Mode Focus activé - Distractions bloquées', 'success');
        
      } catch (error) {
        console.error('Erreur activation mode focus:', error);
        showNotification('⚠️ Erreur activation mode focus', 'error');
      }
    } else {
      // Désactiver le mode focus
      try {
        // Sortir du plein écran
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        }
        
        // Nettoyer les fonctions de focus
        if (window.focusCleanup) {
          window.focusCleanup.showCursor();
          window.focusCleanup.enableAudio();
          window.focusCleanup.enableKeys();
          delete window.focusCleanup;
        }
        
        setNotificationsBlocked(false);
        setFocusModeActive(false);
        
        showNotification('✅ Mode Focus désactivé', 'info');
        
      } catch (error) {
        console.error('Erreur désactivation mode focus:', error);
      }
    }
  };

  // Fonction pour afficher des notifications internes
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : 
      type === 'error' ? 'bg-gradient-to-r from-red-600 to-red-700' : 
      'bg-gradient-to-r from-blue-600 to-blue-700'
    } shadow-lg backdrop-blur-sm border border-white/20`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    
    // Suppression après 4 secondes
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  };

  // Nettoyage à la fermeture du composant
  useEffect(() => {
    return () => {
      // Nettoyer le mode focus si actif
      if (focusModeActive && window.focusCleanup) {
        window.focusCleanup.showCursor();
        window.focusCleanup.enableAudio();
        window.focusCleanup.enableKeys();
        delete window.focusCleanup;
      }
      
      // Nettoyer le timer
      clearInterval(intervalRef.current);
    };
  }, [focusModeActive]);

  // Démarrer une session
  const startSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/pomodoro/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: currentMode,
            customDuration: getDuration(currentMode)
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentSession(data.session);
        }
      }
      
      setIsRunning(true);
      
      // Activer automatiquement le mode focus pendant le travail
      if (currentMode === 'work' && !focusModeActive) {
        toggleFocusMode();
      }
      
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      // Mode offline - continuer sans backend
      setIsRunning(true);
    }
  };

  // Terminer une session
  const completeSession = async (completed = true) => {
    if (currentSession) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`http://localhost:5000/api/pomodoro/${currentSession._id}/complete`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              completed,
              actualDuration: getDuration(currentMode) - timeLeft
            })
          });
        }
      } catch (error) {
        console.error('Erreur fin session:', error);
      }
    }
    
    setCurrentSession(null);
    setIsRunning(false);
    
    // Désactiver le mode focus à la fin du travail
    if (currentMode === 'work' && focusModeActive) {
      setFocusModeActive(false);
      setNotificationsBlocked(false);
    }
  };

  // Gestion du timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Timer terminé
            completeSession(true);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // Quand le timer se termine
  const handleTimerComplete = () => {
    // Son de notification
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Notification
    if (settings.enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const messages = {
        work: '🎉 Pomodoro terminé ! Temps pour une pause.',
        'short-break': '💪 Pause terminée ! Prêt pour un nouveau Pomodoro ?',
        'long-break': '🚀 Grande pause terminée ! Retour au travail !'
      };
      
      new Notification('Timer Focus', {
        body: messages[currentMode],
        icon: '/timer-icon.png'
      });
    }

    // Auto-switch des modes
    if (currentMode === 'work') {
      setPomodoroCount(prev => prev + 1);
      const nextBreak = (pomodoroCount + 1) % settings.longBreakInterval === 0 
        ? 'long-break' 
        : 'short-break';
      
      if (settings.autoStartBreaks) {
        switchMode(nextBreak);
      }
    } else if (settings.autoStartPomodoros) {
      switchMode('work');
    }
  };

  // Changer de mode
  const switchMode = (newMode) => {
    setCurrentMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
    
    if (currentSession) {
      completeSession(false);
    }
  };

  // Contrôles du timer
  const handlePlayPause = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
    } else {
      if (!currentSession && timeLeft === getDuration(currentMode)) {
        startSession();
      } else {
        setIsRunning(true);
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(currentMode));
    clearInterval(intervalRef.current);
    
    if (currentSession) {
      completeSession(false);
    }
  };

  // Couleurs selon le mode
  const getModeColors = () => {
    const colors = {
      work: {
        bg: 'from-red-500 to-red-600',
        button: 'bg-red-600 hover:bg-red-700',
        accent: 'text-red-400',
        ring: 'ring-red-500/50'
      },
      'short-break': {
        bg: 'from-emerald-500 to-emerald-600',
        button: 'bg-emerald-600 hover:bg-emerald-700',
        accent: 'text-emerald-400',
        ring: 'ring-emerald-500/50'
      },
      'long-break': {
        bg: 'from-blue-500 to-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
        accent: 'text-blue-400',
        ring: 'ring-blue-500/50'
      }
    };
    return colors[currentMode];
  };

  const modeColors = getModeColors();
  const progress = ((getDuration(currentMode) - timeLeft) / getDuration(currentMode)) * 100;

  // Stats calculées
  const totalFocusTime = Math.floor(pomodoroCount * settings.workDuration);
  const todayStreak = pomodoroCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Audio pour les notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>

      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Mode Focus
            </h1>
            <p className="text-slate-400 text-lg">Maximisez votre productivité avec la technique Pomodoro</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
              <div className="text-2xl font-bold text-red-400">{todayStreak}</div>
              <div className="text-slate-300 text-sm">Pomodoros</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
              <div className="text-2xl font-bold text-emerald-400">
                {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
              </div>
              <div className="text-slate-300 text-sm">Focus Total</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
              <div className={`flex items-center justify-center gap-2 mb-2 ${focusModeActive ? 'text-orange-400' : 'text-slate-400'}`}>
                <Shield className="w-6 h-6" />
                <span className="font-bold text-2xl">{focusModeActive ? 'ON' : 'OFF'}</span>
              </div>
              <div className="text-slate-300 text-sm">Mode Focus</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
              <div className={`flex items-center justify-center gap-2 mb-2 ${isRunning ? 'text-green-400' : 'text-slate-400'}`}>
                <Clock className="w-6 h-6" />
                <span className="font-bold text-2xl">{isRunning ? 'ON' : 'OFF'}</span>
              </div>
              <div className="text-slate-300 text-sm">Session Active</div>
            </div>
          </div>

          {/* Actions Header */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={toggleFocusMode}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  focusModeActive 
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-600/25 transform scale-[1.02]' 
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <Shield className="w-4 h-4" />
                {focusModeActive ? 'Focus Actif' : 'Activer Focus'}
              </button>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all duration-300 border border-white/10 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </button>
          </div>
        </div>

        {/* Sélecteur de mode */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 transition-all duration-300 hover:bg-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'work', label: 'Session Travail', icon: Clock, duration: settings.workDuration },
                { key: 'short-break', label: 'Pause Courte', icon: Coffee, duration: settings.shortBreakDuration },
                { key: 'long-break', label: 'Pause Longue', icon: Coffee, duration: settings.longBreakDuration }
              ].map(({ key, label, icon: Icon, duration }) => (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={`group flex flex-col items-center gap-3 p-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                    currentMode === key
                      ? `bg-gradient-to-r ${modeColors.bg} text-white shadow-lg shadow-current/25 ring-2 ${modeColors.ring}`
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/10'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">{label}</div>
                    <div className="text-sm opacity-75">{duration} minutes</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timer principal */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-white/10 hover:border-white/20">
            {/* Barre de progression */}
            <div className="absolute top-0 left-0 h-2 bg-white/10 w-full rounded-t-2xl">
              <div 
                className={`h-full bg-gradient-to-r ${modeColors.bg} transition-all duration-1000 ease-linear rounded-tl-2xl`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mb-8 mt-4">
              <div className="text-8xl md:text-9xl font-bold text-white mb-4 font-mono tracking-tight">
                {formatTime(timeLeft)}
              </div>
              <div className="flex items-center justify-center gap-3 text-slate-400 text-lg">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${modeColors.bg}`}></div>
                <span className="capitalize font-medium">
                  {currentMode === 'work' ? 'Session de Travail' :
                   currentMode === 'short-break' ? 'Pause Courte' : 'Pause Longue'}
                </span>
              </div>
            </div>

            {/* Contrôles */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handlePlayPause}
                className={`group flex items-center gap-4 px-10 py-5 bg-gradient-to-r ${modeColors.bg} text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-current/25 hover:shadow-xl`}
              >
                {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                {isRunning ? 'Pause' : 'Démarrer'}
              </button>
              
              <button
                onClick={handleReset}
                className="group flex items-center gap-3 px-8 py-5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl font-medium transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <RotateCcw className="w-6 h-6" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Panneau d'information Mode Focus */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Mode Focus - Fonctionnalités</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Plein écran automatique</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Masquage du curseur après inactivité</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Blocage des raccourcis distrayants</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Désactivation des sons tiers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Notifications web uniquement*</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Interface immersive</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  * Pour bloquer complètement les sites distrayants, utilisez le mode "Ne pas déranger" de votre système.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau de paramètres */}
        {showSettings && (
          <div className="mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-300 hover:bg-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Paramètres du Timer
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-3">
                      Durée Session Travail (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.workDuration}
                      onChange={(e) => setSettings(prev => ({...prev, workDuration: parseInt(e.target.value)}))}
                      className="w-full p-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all duration-200"
                      min="1"
                      max="120"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-3">
                      Durée Pause Courte (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.shortBreakDuration}
                      onChange={(e) => setSettings(prev => ({...prev, shortBreakDuration: parseInt(e.target.value)}))}
                      className="w-full p-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-3">
                      Durée Pause Longue (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.longBreakDuration}
                      onChange={(e) => setSettings(prev => ({...prev, longBreakDuration: parseInt(e.target.value)}))}
                      className="w-full p-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all duration-200"
                      min="1"
                      max="120"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-3">
                      Pause Longue tous les X pomodoros
                    </label>
                    <input
                      type="number"
                      value={settings.longBreakInterval}
                      onChange={(e) => setSettings(prev => ({...prev, longBreakInterval: parseInt(e.target.value)}))}
                      className="w-full p-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all duration-200"
                      min="2"
                      max="10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200 border border-white/10">
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => setSettings(prev => ({...prev, autoStartBreaks: e.target.checked}))}
                    className="w-5 h-5 rounded bg-white/5 border-2 border-white/20 checked:bg-blue-600 checked:border-blue-600 transition-all duration-200"
                  />
                  <span className="text-slate-300 group-hover:text-white font-medium">
                    Démarrer automatiquement les pauses
                  </span>
                </label>
                
                <label className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200 border border-white/10">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => setSettings(prev => ({...prev, enableNotifications: e.target.checked}))}
                    className="w-5 h-5 rounded bg-white/5 border-2 border-white/20 checked:bg-blue-600 checked:border-blue-600 transition-all duration-200"
                  />
                  <span className="text-slate-300 group-hover:text-white font-medium">
                    Activer les notifications
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Message de motivation selon le mode */}
        <div className="text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 inline-block transition-all duration-300 hover:bg-white/10">
            {currentMode === 'work' && !isRunning && (
              <p className="text-slate-300">
                🎯 <span className="font-medium">Prêt à vous concentrer ?</span> Cliquez sur Démarrer pour commencer votre session de travail !
              </p>
            )}
            {currentMode === 'work' && isRunning && (
              <p className="text-slate-300">
                🔥 <span className="font-medium">Session active !</span> Restez concentré sur votre tâche en cours.
              </p>
            )}
            {currentMode === 'short-break' && (
              <p className="text-slate-300">
                ☕ <span className="font-medium">Pause courte !</span> Détendez-vous quelques minutes, vous l'avez mérité.
              </p>
            )}
            {currentMode === 'long-break' && (
              <p className="text-slate-300">
                🌟 <span className="font-medium">Grande pause !</span> Profitez-en pour recharger vos batteries complètement.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;