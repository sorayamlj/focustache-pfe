import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Target, User, RefreshCw, AlertCircle, CheckCircle, Info, Zap, X, Settings } from 'lucide-react';
import { useSession } from '../services/SessionContext';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const Session = () => {
  // Context hooks
  const { 
    activeSession, 
    currentTime, 
    isRunning, 
    isPaused, 
    isFocusModeActive,
    focusSettings,
    showFocusModal,
    setShowFocusModal,
    setFocusSettings,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    activateFocusMode,
    smartNotify
  } = useSession();

  // Local states
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localFocusSettings, setLocalFocusSettings] = useState({ 
    activerFocus: false,
    activerNotifications: false,
    activerPomodoro: false,
    tempsTravail: 25,
    tempsPauseCourte: 5,
    tempsPauseLongue: 15,
    nombreCycles: 4
  });

  // Utility functions
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setTasks([]);
        return;
      }

      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      const allTasks = Array.isArray(data) ? data : (data.tasks || []);
      const availableTasks = allTasks.filter(task => task.statut !== 'supprimée');
      
      setTasks(availableTasks);
      setError('');
    } catch (error) {
      console.error('Erreur fetchTasks:', error);
      setError('Impossible de charger les tâches');
      setTasks([]);
    }
  };

  // Session handlers
  const handleStartSession = async () => {
    if (!selectedTask) {
      smartNotify('WARNING', 'Veuillez sélectionner une tâche');
      return;
    }

    if (!selectedTask._id || !isValidObjectId(selectedTask._id)) {
      smartNotify('ERROR', 'Tâche invalide sélectionnée');
      return;
    }

    const success = await startSession(selectedTask._id, localFocusSettings);
    if (success) {
      setShowCreateModal(false);
      setSelectedTask(null);
      setLocalFocusSettings({
        activerFocus: false,
        activerNotifications: false,
        activerPomodoro: false,
        tempsTravail: 25,
        tempsPauseCourte: 5,
        tempsPauseLongue: 15,
        nombreCycles: 4
      });
    }
  };

  const handleStopSession = async (action = 'complete') => {
    await stopSession(action);
  };

  const handleToggleTimer = () => {
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  };

  // Initialize data
  const initializeData = async () => {
    setIsLoading(true);
    try {
      await fetchTasks();
    } catch (error) {
      setError('Erreur de connexion à l\'API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isAuthError = error.includes('Session expirée') || error.includes('authentification');
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <AlertCircle size={60} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Erreur</h2>
          <p className="text-red-300 mb-6">{error}</p>
          
          <div className="space-y-3">
            {isAuthError ? (
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
              >
                Se connecter
              </button>
            ) : (
              <button 
                onClick={() => { setError(''); initializeData(); }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (!isAuthenticated() && !error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <User size={60} className="text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connexion requise</h2>
          <p className="text-gray-400 mb-6">
            Connectez-vous pour accéder à vos sessions de travail
          </p>
          
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center gap-2 mx-auto"
          >
            <User size={18} />
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Main interface
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Sessions Focus</h1>
                <p className="text-gray-400">
                  {activeSession ? 'Session active' : `${tasks.length} tâches disponibles`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {activeSession ? (
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    isRunning && !isPaused ? 'text-green-400' : 
                    isPaused ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {isRunning && !isPaused ? '⏱️ En cours' : 
                     isPaused ? '⏸️ En pause' : '⏹️ Arrêté'}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Nouvelle Session
                </button>
              )}
            </div>
          </div>

          {/* Status badges */}
          {activeSession && (
            <div className="flex items-center gap-2 text-sm">
              {activeSession.focusActif && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                  Focus actif
                </span>
              )}
              {activeSession.chronodoroMode && (
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                  Pomodoro
                </span>
              )}
              {(activeSession.notificationsBloquees || isFocusModeActive) && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                  🔕 Notifications bloquées
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {activeSession ? (
          /* ACTIVE SESSION */
          <div className="space-y-6">
            {/* Main timer */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="text-center mb-6">
                <div className={`text-4xl font-bold mb-2 ${
                  isRunning && !isPaused ? 'text-green-400' : 
                  isPaused ? 'text-yellow-400' : 'text-white'
                }`}>
                  {formatTime(currentTime)}
                </div>
                <p className="text-gray-400">
                  {activeSession.chronodoroMode ? 'Session Pomodoro en cours' : 'Session en cours'}
                </p>
                {activeSession.chronodoroMode && (
                  <div className="text-sm text-orange-400 mt-1">
                    Cycle {Math.floor((activeSession.cycleCount || 0) / 2) + 1}/{activeSession.cyclesTotalPrevus || 4} • 
                    {(activeSession.cycleType === 'work' || !activeSession.cycleType) ? ' Travail' : ' Pause'}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-3 mb-6">
                {!isRunning || isPaused ? (
                  <button
                    onClick={handleToggleTimer}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <Play size={18} /> {isPaused ? 'Reprendre' : 'Démarrer'}
                  </button>
                ) : (
                  <button
                    onClick={handleToggleTimer}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg flex items-center gap-2"
                  >
                    <Pause size={18} /> Pause
                  </button>
                )}
                
                {!activeSession.focusActif && !isFocusModeActive && (
                  <button
                    onClick={() => setShowFocusModal(true)}
                    className="px-4 py-3 bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 border border-purple-500/30 rounded-lg flex items-center gap-2"
                  >
                    <Zap size={18} /> Mode Focus
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleStopSession('cancel')}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleStopSession('complete')}
                  className="px-6 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg border border-green-500/30 font-medium"
                >
                  Terminer
                </button>
              </div>
            </div>

            {/* Current task */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Tâche en cours</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 text-white rounded flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-white font-medium">
                    {activeSession.taskIds?.[0]?.titre || 'Tâche en cours'}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{activeSession.taskIds?.[0]?.module || 'Module'}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      activeSession.taskIds?.[0]?.priorite === 'haute' ? 'bg-red-500/20 text-red-400' :
                      activeSession.taskIds?.[0]?.priorite === 'moyenne' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {activeSession.taskIds?.[0]?.priorite || 'moyenne'}
                    </span>
                    {activeSession.taskIds?.[0]?.dateEcheance && (
                      <>
                        <span>•</span>
                        <span className="text-xs">
                          Échéance: {formatDate(activeSession.taskIds[0]?.dateEcheance)}
                        </span>
                      </>
                    )}
                  </div>
                  {activeSession.taskIds?.[0]?.description && (
                    <p className="text-gray-400 text-sm mt-1">
                      {activeSession.taskIds[0].description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* NO ACTIVE SESSION - TASK LIST */
          <div className="space-y-6">
            {tasks.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Tâches disponibles ({tasks.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => {
                    const isOverdue = task.dateEcheance && new Date(task.dateEcheance) < new Date();
                    
                    return (
                      <div
                        key={task._id}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowCreateModal(true);
                        }}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors line-clamp-2 flex-1">
                            {task.titre}
                          </h4>
                          {isOverdue && (
                            <span className="ml-2 text-red-400 text-xs">⚠</span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-purple-400">{task.module}</span>
                            <span className="text-gray-400">•</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              task.priorite === 'haute' ? 'bg-red-500/20 text-red-400' :
                              task.priorite === 'moyenne' ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {task.priorite}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="text-gray-400 text-sm line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Échéance: {formatDate(task.dateEcheance)}</span>
                            <span className={`px-2 py-1 rounded ${
                              task.statut === 'en cours' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {task.statut}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target size={60} className="text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Aucune tâche disponible</h3>
                <p className="text-gray-400 mb-6">
                  Créez vos premières tâches pour commencer à organiser votre travail
                </p>
                <button
                  onClick={fetchTasks}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
                >
                  Actualiser
                </button>
              </div>
            )}
          </div>
        )}

        {/* CREATE SESSION MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Nouvelle Session</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Task selection */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Sélectionnez votre tâche
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Target size={40} className="mx-auto mb-3 text-gray-500" />
                        <p className="mb-2">Aucune tâche disponible</p>
                        <p className="text-sm">Créez d'abord des tâches dans la section Tâches</p>
                      </div>
                    ) : (
                      tasks.map(task => {
                        const isOverdue = task.dateEcheance && new Date(task.dateEcheance) < new Date();
                        
                        return (
                          <div
                            key={task._id}
                            onClick={() => setSelectedTask(selectedTask?._id === task._id ? null : task)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedTask?._id === task._id
                                ? 'bg-purple-600/30 border-purple-500 text-white'
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                selectedTask?._id === task._id ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
                              }`}>
                                {selectedTask?._id === task._id && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium line-clamp-1">{task.titre}</h4>
                                  {isOverdue && <span className="text-red-400 text-xs ml-2">⚠</span>}
                                </div>
                                <div className="flex items-center gap-2 text-sm opacity-75 mt-1">
                                  <span>{task.module}</span>
                                  <span>•</span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    task.priorite === 'haute' ? 'bg-red-500/20 text-red-400' :
                                    task.priorite === 'moyenne' ? 'bg-yellow-500/20 text-yellow-400' : 
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    {task.priorite}
                                  </span>
                                  <span>•</span>
                                  <span className="text-xs">
                                    {formatDate(task.dateEcheance)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Focus options */}
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Options Focus (optionnel)</h3>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFocusSettings.activerFocus}
                      onChange={(e) => setLocalFocusSettings(prev => ({
                        ...prev,
                        activerFocus: e.target.checked,
                        activerNotifications: e.target.checked ? prev.activerNotifications : false,
                        activerPomodoro: e.target.checked ? prev.activerPomodoro : false
                      }))}
                      className="w-4 h-4"
                    />
                    <Zap size={16} className="text-purple-400" />
                    <span className="text-white">Activer le Mode Focus</span>
                  </label>

                  {localFocusSettings.activerFocus && (
                    <div className="ml-6 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localFocusSettings.activerNotifications}
                          onChange={(e) => setLocalFocusSettings(prev => ({
                            ...prev,
                            activerNotifications: e.target.checked
                          }))}
                          className="w-4 h-4"
                        />
                        <AlertCircle size={16} className="text-red-400" />
                        <div className="flex-1">
                          <span className="text-white">Bloquer les notifications</span>
                          <p className="text-xs text-gray-400">
                            Bloque les alertes JS, popups et nouvelles fenêtres
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localFocusSettings.activerPomodoro}
                          onChange={(e) => setLocalFocusSettings(prev => ({
                            ...prev,
                            activerPomodoro: e.target.checked
                          }))}
                          className="w-4 h-4"
                        />
                        <Clock size={16} className="text-orange-400" />
                        <span className="text-white">Technique Pomodoro</span>
                      </label>

                      {localFocusSettings.activerPomodoro && (
                        <div className="ml-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-orange-200 text-sm mb-1">Travail</label>
                              <select
                                value={localFocusSettings.tempsTravail}
                                onChange={(e) => setLocalFocusSettings(prev => ({
                                  ...prev,
                                  tempsTravail: parseInt(e.target.value)
                                }))}
                                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                              >
                                <option value={15}>15 min</option>
                                <option value={20}>20 min</option>
                                <option value={25}>25 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={50}>50 min</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-orange-200 text-sm mb-1">Cycles</label>
                              <select
                                value={localFocusSettings.nombreCycles}
                                onChange={(e) => setLocalFocusSettings(prev => ({
                                  ...prev,
                                  nombreCycles: parseInt(e.target.value)
                                }))}
                                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                              >
                                <option value={2}>2 cycles</option>
                                <option value={4}>4 cycles</option>
                                <option value={6}>6 cycles</option>
                                <option value={8}>8 cycles</option>
                              </select>
                            </div>
                          </div>
                          <p className="text-orange-200 text-xs mt-2">
                            {localFocusSettings.tempsTravail}min travail → {localFocusSettings.tempsPauseCourte}min pause
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-700 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStartSession}
                  disabled={!selectedTask}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Démarrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOCUS MODAL (for active session) */}
        {showFocusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Mode Focus</h2>
                <button
                  onClick={() => setShowFocusModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusSettings.activerNotifications}
                    onChange={(e) => setFocusSettings(prev => ({
                      ...prev,
                      activerNotifications: e.target.checked
                    }))}
                    className="w-4 h-4"
                  />
                  <AlertCircle size={16} className="text-red-400" />
                  <div className="flex-1">
                    <span className="text-white">Bloquer les notifications</span>
                    <p className="text-xs text-gray-400">
                      Bloque les alertes JS, popups et nouvelles fenêtres
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusSettings.activerPomodoro}
                    onChange={(e) => setFocusSettings(prev => ({
                      ...prev,
                      activerPomodoro: e.target.checked
                    }))}
                    className="w-4 h-4"
                  />
                  <Clock size={16} className="text-orange-400" />
                  <span className="text-white">Technique Pomodoro</span>
                </label>

                {focusSettings.activerPomodoro && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <h4 className="text-orange-300 font-medium mb-3">Paramètres Pomodoro</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-orange-200 text-sm mb-1">Travail</label>
                        <select
                          value={focusSettings.tempsTravail}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            tempsTravail: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        >
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={25}>25 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={50}>50 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-orange-200 text-sm mb-1">Cycles</label>
                        <select
                          value={focusSettings.nombreCycles}
                          onChange={(e) => setFocusSettings(prev => ({
                            ...prev,
                            nombreCycles: parseInt(e.target.value)
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
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

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-purple-300 font-medium mb-2">Mode Focus</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Améliore la concentration</li>
                    <li>• Démarre automatiquement le timer</li>
                    {focusSettings.activerNotifications && (
                      <li>• 🔕 Bloque les notifications de cette page</li>
                    )}
                    {focusSettings.activerPomodoro && (
                      <li>• Cycles automatiques avec pauses</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="p-4 border-t border-gray-700 flex gap-3">
                <button
                  onClick={() => setShowFocusModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={activateFocusMode}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Activer Focus{focusSettings.activerPomodoro ? ' + Pomodoro' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection indicator */}
      <div className="fixed bottom-4 left-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
          isAuthenticated() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isAuthenticated() ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          {isAuthenticated() ? 'Connecté' : 'Déconnecté'}
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .group:hover {
          transform: translateY(-2px);
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #374151;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default Session;