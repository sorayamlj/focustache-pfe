import React, { useState, useEffect, useRef } from 'react';

const ModeFocus = ({ session, onStop, onUpdate }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showChronodoroModal, setShowChronodoroModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // États pour Chronodoro
  const [chronodoroSettings, setChronodoroSettings] = useState({
    dureeCycle: 25,
    nombreCycles: 4
  });
  
  // États pour Focus libre
  const [focusSettings, setFocusSettings] = useState({
    dureeMinutes: 45
  });

  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (session) {
      setCurrentTime(session.tempsEcoule || 0);
      setIsRunning(session.timerActif || false);
      setIsPaused(session.timerPause || false);
    }
  }, [session]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          
          // Mettre à jour le backend toutes les 10 secondes
          if (newTime > 0 && newTime % 10 === 0) {
            updateBackendTimer(newTime);
          }
          
          return newTime;
        });
      }, 1000);
      
      lastUpdateRef.current = Date.now();
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
  }, [isRunning, isPaused]);

  const updateBackendTimer = async (timeInSeconds) => {
    if (!session || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sessions/${session._id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tempsEcouleSecondes: timeInSeconds
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Vérifier si un cycle Chronodoro est terminé
        if (data.cycleCompleted) {
          handleChronodoroCycleComplete(data.nextCycle);
        }
        
        // Mettre à jour la session
        if (onUpdate) {
          onUpdate(data.session);
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour timer:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChronodoroCycleComplete = (nextCycle) => {
    // Notification de fin de cycle
    showNotification(
      nextCycle.type === 'work' 
        ? '✅ Pause terminée ! Reprenez le travail 💪'
        : '🎉 Cycle terminé ! Prenez une pause bien méritée 🛋️',
      'success',
      4000
    );

    // Son de notification (optionnel)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Chronodoro - Cycle terminé !', {
        body: nextCycle.type === 'work' ? 'Temps de travailler !' : 'Temps de pause !',
        icon: '/favicon.ico'
      });
    }
  };

  const handleActivateFocus = async () => {
    if (!session) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sessions/${session._id}/focus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dureeMinutes: focusSettings.dureeMinutes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erreur lors de l\'activation du Focus');
      }

      const data = await response.json();
      if (onUpdate) {
        onUpdate(data.session);
      }
      
      setIsRunning(true);
      setShowFocusModal(false);
      
      showNotification('🔥 Mode Focus activé !\n🔇 Notifications bloquées • Concentrez-vous !', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(error.message, 'error');
    }
  };

  const handleStartChronodoro = async () => {
    if (!session) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sessions/${session._id}/chronodoro`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dureeCycleMinutes: chronodoroSettings.dureeCycle,
          nombreCycles: chronodoroSettings.nombreCycles
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erreur lors du démarrage du Chronodoro');
      }

      const data = await response.json();
      if (onUpdate) {
        onUpdate(data.session);
      }
      
      setIsRunning(true);
      setShowChronodoroModal(false);
      
      showNotification('🍅 Chronodoro démarré !\n🔇 Notifications bloquées • Premier cycle de travail !', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(error.message, 'error');
    }
  };

  const handleToggleTimer = async (action) => {
    if (!session) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/sessions/${session._id}/timer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erreur lors du contrôle du timer');
      }

      const data = await response.json();
      if (onUpdate) {
        onUpdate(data.session);
      }
      
      if (action === 'pause') {
        setIsRunning(false);
        setIsPaused(true);
        showNotification('⏸️ Timer en pause', 'info');
      } else {
        setIsRunning(true);
        setIsPaused(false);
        showNotification('▶️ Timer repris', 'success');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(error.message, 'error');
    }
  };

  const showNotification = (message, type = 'info', duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-medium max-w-sm backdrop-blur-sm border transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-600/90 border-green-500/50' : 
      type === 'error' ? 'bg-red-600/90 border-red-500/50' : 
      'bg-blue-600/90 border-blue-500/50'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-xl">
          ${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}
        </div>
        <div class="flex-1">${message}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
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

  const getProgress = () => {
    if (!session) return 0;
    
    if (session.chronodoroMode && session.dureeCycle) {
      // Progression dans le cycle actuel
      const cycleProgress = (currentTime % session.dureeCycle) / session.dureeCycle;
      return Math.min(100, cycleProgress * 100);
    } else if (session.tempsTotal && session.tempsTotal > 0) {
      // Progression sur la durée totale
      return Math.min(100, (currentTime / session.tempsTotal) * 100);
    }
    
    return 0;
  };

  const getRemainingTime = () => {
    if (!session) return null;
    
    if (session.chronodoroMode && session.dureeCycle) {
      const remaining = session.dureeCycle - (currentTime % session.dureeCycle);
      return remaining > 0 ? remaining : 0;
    } else if (session.tempsTotal && session.tempsTotal > 0) {
      const remaining = session.tempsTotal - currentTime;
      return remaining > 0 ? remaining : 0;
    }
    
    return null;
  };

  if (!session) return null;

  const progress = getProgress();
  const remainingTime = getRemainingTime();
  const isChronodoroActive = session.chronodoroMode;
  const isFocusActive = session.focusActif;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Carte principale de la session */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
        
        {/* Header avec informations session */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Session Active
              {isChronodoroActive && (
                <span className="ml-3 px-3 py-1 bg-orange-600/20 text-orange-400 text-sm font-medium rounded-full border border-orange-500/30">
                  🍅 Chronodoro
                </span>
              )}
              {isFocusActive && !isChronodoroActive && (
                <span className="ml-3 px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-full border border-blue-500/30">
                  🔥 Focus
                </span>
              )}
              {session.notificationsBloquees && (
                <span className="ml-3 px-3 py-1 bg-purple-600/20 text-purple-400 text-sm font-medium rounded-full border border-purple-500/30">
                  🔇 Mode Silencieux
                </span>
              )}
            </h2>
            <p className="text-slate-400">
              {session.taskIds?.length || 0} tâche{session.taskIds?.length > 1 ? 's' : ''} sélectionnée{session.taskIds?.length > 1 ? 's' : ''}
              {session.notificationsBloquees && (
                <span className="ml-2 text-purple-400">• Notifications bloquées</span>
              )}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => onStop('cancel')}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-500/30"
            >
              ❌ Annuler
            </button>
            <button
              onClick={() => onStop('complete')}
              className="px-6 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 rounded-lg transition-all duration-200 border border-green-500/30 font-medium"
            >
              ✅ Terminer
            </button>
          </div>
        </div>

        {/* Timer principal */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            {/* Cercle de progression */}
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={isChronodoroActive ? "#f97316" : "#3b82f6"}
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progress * 2.827} 282.7`}
                className="transition-all duration-300"
              />
            </svg>
            
            {/* Temps au centre */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-white mb-2">
                {formatTime(currentTime)}
              </div>
              {remainingTime !== null && (
                <div className="text-sm text-slate-400">
                  {formatTime(remainingTime)} restant{remainingTime > 1 ? 'es' : ''}
                </div>
              )}
              {isChronodoroActive && (
                <div className="text-xs text-orange-400 mt-1">
                  Cycle {Math.floor(session.cycleCount / 2) + 1}/{session.cyclesTotalPrevus}
                  {session.cycleType === 'work' ? ' 💪' : ' 🛋️'}
                </div>
              )}
            </div>
          </div>

          {/* Barre de progression linéaire */}
          <div className="w-full max-w-md mx-auto bg-white/10 rounded-full h-2 mb-6">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isChronodoroActive ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex justify-center gap-4 mb-8">
          {!isFocusActive ? (
            <>
              <button
                onClick={() => setShowFocusModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                🔥 Activer Focus
                <span className="text-xs opacity-75">(🔇 + Timer)</span>
              </button>
              <button
                onClick={() => setShowChronodoroModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                🍅 Chronodoro
                <span className="text-xs opacity-75">(🔇 + Cycles)</span>
              </button>
            </>
          ) : (
            <>
              {!isRunning || isPaused ? (
                <button
                  onClick={() => handleToggleTimer('resume')}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-3 text-lg"
                >
                  ▶️ {isPaused ? 'Reprendre' : 'Démarrer'}
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTimer('pause')}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-3 text-lg"
                >
                  ⏸️ Pause
                </button>
              )}
            </>
          )}
        </div>

        {/* Informations sur les tâches */}
        {session.taskIds && session.taskIds.length > 0 && (
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Tâches de cette session
            </h3>
            <div className="space-y-3">
              {session.taskIds.map((task, index) => (
                <div key={task._id || index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{task.titre}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <span className="text-purple-400">{task.module}</span>
                      <span className="text-slate-400">•</span>
                      <span className={`capitalize ${
                        task.priorite === 'haute' ? 'text-red-400' :
                        task.priorite === 'moyenne' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {task.priorite}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats temps réel */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-slate-400 text-sm">Temps écoulé</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-green-400 mb-2">
            {session.efficaciteCalculee || 0}%
          </div>
          <div className="text-slate-400 text-sm">Efficacité</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-2">
            {session.nombrePauses || 0}
          </div>
          <div className="text-slate-400 text-sm">Pauses</div>
        </div>
      </div>

      {/* Modal Focus */}
      {showFocusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-white mb-6">🔥 Mode Focus</h3>
            
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">
                Durée de focus (optionnel)
              </label>
              <input
                type="number"
                value={focusSettings.dureeMinutes}
                onChange={(e) => setFocusSettings(prev => ({
                  ...prev,
                  dureeMinutes: parseInt(e.target.value) || ''
                }))}
                placeholder="En minutes (laissez vide pour illimité)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h4 className="text-blue-300 font-medium mb-2">🔥 Mode Focus :</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• 🔇 <strong>Notifications bloquées automatiquement</strong></li>
                <li>• ⏱️ Timer libre sans interruption</li>  
                <li>• 🧘 Idéal pour la concentration profonde</li>
                <li>• 🎯 Environnement de travail optimisé</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowFocusModal(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleActivateFocus}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                🔥 Activer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chronodoro */}
      {showChronodoroModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-white mb-6">🍅 Chronodoro</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Durée par cycle
                </label>
                <select
                  value={chronodoroSettings.dureeCycle}
                  onChange={(e) => setChronodoroSettings(prev => ({
                    ...prev,
                    dureeCycle: parseInt(e.target.value)
                  }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={25}>25 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                </select>
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Nombre de cycles
                </label>
                <select
                  value={chronodoroSettings.nombreCycles}
                  onChange={(e) => setChronodoroSettings(prev => ({
                    ...prev,
                    nombreCycles: parseInt(e.target.value)
                  }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={2}>2 cycles</option>
                  <option value={4}>4 cycles</option>
                  <option value={6}>6 cycles</option>
                  <option value={8}>8 cycles</option>
                </select>
              </div>
            </div>

            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <h4 className="text-orange-300 font-medium mb-2">🍅 Technique Chronodoro :</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• 🔄 Alternance travail/pause automatique</li>
                <li>• ⏰ Pause courte : 5 min | Pause longue : 15 min</li>
                <li>• 🔇 <strong>Notifications bloquées pendant les cycles</strong></li>
                <li>• 🧠 Améliore focus et évite l'épuisement</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowChronodoroModal(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleStartChronodoro}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                🍅 Démarrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeFocus;