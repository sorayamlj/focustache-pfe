import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// Configuration API
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// Utilitaires
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Context
const SessionContext = createContext(undefined);

export const SessionProvider = ({ children }) => {
  // États principaux
  const [activeSession, setActiveSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  
  // Configuration Focus avec valeurs par défaut
  const [focusSettings, setFocusSettings] = useState({
    activerFocus: false,
    activerNotifications: false,
    activerPomodoro: false,
    tempsTravail: 25,
    tempsPauseCourte: 5,
    tempsPauseLongue: 15,
    nombreCycles: 4
  });
  
  // Références pour le timer
  const timerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const syncIntervalRef = useRef(null);

  // Fonction de notification intelligente qui respecte le mode focus
  const smartNotify = useCallback((type, message, duration = 4000) => {
    // Vérifier si les notifications sont bloquées en mode focus
    if (isFocusModeActive && activeSession?.notificationsBloquees) {
      const importantTypes = ['ERROR', 'ACHIEVEMENT', 'SESSION_END', 'SESSION_COMPLETE'];
      if (!importantTypes.includes(type)) {
        console.log('🔕 Notification bloquée en mode focus:', message);
        return;
      }
    }
    
    // Utiliser le système de notifications existant ou fallback
    if (window.addNotification && typeof window.addNotification === 'function') {
      window.addNotification(type, message, duration);
    } else {
      // Fallback vers console avec style
      const styles = {
        SUCCESS: 'color: #10B981; font-weight: bold;',
        ERROR: 'color: #EF4444; font-weight: bold;',
        WARNING: 'color: #F59E0B; font-weight: bold;',
        INFO: 'color: #3B82F6; font-weight: bold;',
        ACHIEVEMENT: 'color: #8B5CF6; font-weight: bold; font-size: 16px;'
      };
      console.log(`%c${type}: ${message}`, styles[type] || styles.INFO);
      
      // Fallback vers notification native si autorisé
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification(`FocusTâche - ${type}`, {
            body: message,
            icon: '/favicon.ico',
            tag: `focustache-${type.toLowerCase()}`,
            requireInteraction: type === 'ERROR' || type === 'ACHIEVEMENT'
          });
          
          if (type !== 'ERROR' && type !== 'ACHIEVEMENT') {
            setTimeout(() => notification.close(), duration);
          }
        } catch (error) {
          console.warn('Notification native échouée:', error);
        }
      }
    }
  }, [isFocusModeActive, activeSession]);

  // Gestion du timer avec persistance
  useEffect(() => {
    if (isRunning && !isPaused && activeSession) {
      lastUpdateRef.current = Date.now();
      
      // Timer principal toutes les secondes
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastUpdateRef.current) / 1000);
        lastUpdateRef.current = now;
        
        setCurrentTime(prev => {
          const newTime = prev + elapsed;
          return newTime;
        });
      }, 1000);

      // Synchronisation avec le backend toutes les 30 secondes
      syncIntervalRef.current = setInterval(() => {
        syncTimeWithBackend(currentTime);
      }, 30000);
    } else {
      // Nettoyer les timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, activeSession, currentTime]);

  // Synchronisation avec le backend
  const syncTimeWithBackend = useCallback(async (timeElapsed) => {
    if (!activeSession?._id || !isValidObjectId(activeSession._id)) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/sessions/${activeSession._id}/sync`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tempsEcoule: timeElapsed })
      });
    } catch (error) {
      console.warn('Échec synchronisation temps:', error);
    }
  }, [activeSession]);

  // Fonctions de gestion des notifications bloquées
  const activateNotificationBlocking = useCallback(async () => {
    try {
      // Sauvegarder et bloquer les alertes JavaScript
      if (typeof window.alert === 'function') {
        window.originalAlert = window.alert;
        window.alert = () => {};
      }
      
      if (typeof window.confirm === 'function') {
        window.originalConfirm = window.confirm;
        window.confirm = () => false;
      }
      
      if (typeof window.prompt === 'function') {
        window.originalPrompt = window.prompt;
        window.prompt = () => null;
      }

      // Bloquer les notifications Web
      if ('Notification' in window) {
        window.originalNotificationConstructor = window.Notification;
        window.Notification = class {
          constructor() {
            console.log('🚫 Notification Web bloquée en mode focus');
            return {};
          }
          static requestPermission() {
            return Promise.resolve('denied');
          }
          static get permission() {
            return 'denied';
          }
        };
      }

      // Ajouter des styles pour réduire les distractions visuelles
      const focusStyle = document.createElement('style');
      focusStyle.id = 'focus-mode-styles';
      focusStyle.textContent = `
        /* Réduire les animations */
        *, *::before, *::after {
          animation-duration: 0.1s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.1s !important;
        }
        
        /* Atténuer les notifications visuelles */
        .notification-badge,
        .unread-count,
        .badge[class*="unread"],
        [data-testid*="notification"],
        [class*="notification-dot"] {
          opacity: 0.3 !important;
        }
        
        /* Indicateur mode focus */
        body::before {
          content: "🎯 MODE FOCUS ACTIF";
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(147, 51, 234, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          z-index: 10000;
          backdrop-filter: blur(10px);
        }
      `;
      document.head.appendChild(focusStyle);

      // Bloquer l'ouverture de nouvelles fenêtres
      window.originalWindowOpen = window.open;
      window.open = (url, name, specs) => {
        console.log('🚫 Nouvelle fenêtre bloquée en mode focus:', url);
        smartNotify('INFO', 'Ouverture de fenêtre bloquée en mode focus');
        return null;
      };

      setIsFocusModeActive(true);
      smartNotify('SUCCESS', '🔕 Mode Focus activé - Notifications bloquées');
      
    } catch (error) {
      console.error('Erreur activation blocage notifications:', error);
      smartNotify('INFO', 'Mode Focus partiellement activé');
    }
  }, [smartNotify]);

  const deactivateNotificationBlocking = useCallback(() => {
    try {
      // Restaurer les fonctions JavaScript
      if (window.originalAlert) {
        window.alert = window.originalAlert;
        delete window.originalAlert;
      }
      
      if (window.originalConfirm) {
        window.confirm = window.originalConfirm;
        delete window.originalConfirm;
      }
      
      if (window.originalPrompt) {
        window.prompt = window.originalPrompt;
        delete window.originalPrompt;
      }
      
      if (window.originalNotificationConstructor) {
        window.Notification = window.originalNotificationConstructor;
        delete window.originalNotificationConstructor;
      }
      
      if (window.originalWindowOpen) {
        window.open = window.originalWindowOpen;
        delete window.originalWindowOpen;
      }
      
      // Retirer les styles focus
      const focusStyle = document.getElementById('focus-mode-styles');
      if (focusStyle) focusStyle.remove();
      
      setIsFocusModeActive(false);
      smartNotify('INFO', '🔔 Mode Focus désactivé - Notifications restaurées');
      
    } catch (error) {
      console.error('Erreur désactivation blocage notifications:', error);
      smartNotify('INFO', 'Mode Focus désactivé');
    }
  }, [smartNotify]);

  // Charger la session active au démarrage
  const loadActiveSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/sessions/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.activeSession) {
          setActiveSession(data.activeSession);
          setCurrentTime(data.activeSession.tempsEcoule || 0);
          setIsRunning(data.activeSession.timerActif || false);
          setIsPaused(data.activeSession.timerPause || false);
          
          // Restaurer l'état du mode focus si nécessaire
          if (data.activeSession.notificationsBloquees) {
            setIsFocusModeActive(true);
          }
        }
      }
    } catch (error) {
      console.error('Échec chargement session active:', error);
    }
  }, []);

  // Effet de chargement initial
  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  // Fonction pour démarrer une session
  const startSession = useCallback(async (taskId, currentFocusSettings) => {
    if (!taskId || !isValidObjectId(taskId)) {
      smartNotify('ERROR', 'ID de tâche invalide');
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        smartNotify('ERROR', 'Veuillez vous reconnecter');
        return false;
      }

      const payload = {
        taskIds: [taskId],
        dureeEstimee: currentFocusSettings.activerPomodoro ? currentFocusSettings.tempsTravail : undefined
      };

      const response = await fetch(`${API_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.msg || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.session) {
        setActiveSession(data.session);
        setCurrentTime(data.session.tempsEcoule || 0);
        setIsRunning(true);
        setIsPaused(false);
        
        // Activer le mode focus si demandé
        if (currentFocusSettings.activerFocus) {
          setFocusSettings(currentFocusSettings);
          // Petit délai pour que la session soit bien établie
          setTimeout(() => {
            activateFocusMode();
          }, 500);
        }
        
        smartNotify('SUCCESS', 'Session démarrée avec succès');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Échec démarrage session:', error);
      smartNotify('ERROR', `Erreur: ${error.message}`);
      return false;
    }
  }, [smartNotify]);

  // Fonction pour activer le mode focus
  const activateFocusMode = useCallback(async () => {
    if (!activeSession) {
      smartNotify('ERROR', 'Aucune session active');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Choisir l'endpoint selon le mode Pomodoro
      const endpoint = focusSettings.activerPomodoro 
        ? `${API_URL}/sessions/${activeSession._id}/chronodoro`
        : `${API_URL}/sessions/${activeSession._id}/focus`;
      
      const body = focusSettings.activerPomodoro 
        ? {
            dureeCycleMinutes: focusSettings.tempsTravail,
            nombreCycles: focusSettings.nombreCycles
          }
        : {
            dureeMinutes: null
          };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.session) {
        setActiveSession(data.session);
        setIsRunning(true);
        setIsPaused(false);
        setShowFocusModal(false);
        
        // Activer le blocage des notifications si demandé
        if (focusSettings.activerNotifications) {
          await activateNotificationBlocking();
        }
        
        const message = focusSettings.activerPomodoro 
          ? `🎯 Mode Focus + Pomodoro activé ! (${focusSettings.tempsTravail}min x ${focusSettings.nombreCycles} cycles)`
          : '🎯 Mode Focus activé !';
        smartNotify('SUCCESS', message);

        // Reset des paramètres focus
        setFocusSettings({
          activerFocus: false,
          activerNotifications: false,
          activerPomodoro: false,
          tempsTravail: 25,
          tempsPauseCourte: 5,
          tempsPauseLongue: 15,
          nombreCycles: 4
        });
      }
      
    } catch (error) {
      console.error('Erreur activation mode focus:', error);
      smartNotify('ERROR', `Erreur: ${error.message}`);
    }
  }, [activeSession, focusSettings, smartNotify, activateNotificationBlocking]);

  // Fonction pour arrêter une session
  const stopSession = useCallback(async (action = 'complete') => {
    if (!activeSession) return;

    try {
      // Désactiver le blocage des notifications d'abord
      if (isFocusModeActive || activeSession.notificationsBloquees) {
        deactivateNotificationBlocking();
      }

      const duration = Math.floor(currentTime / 60);
      const taskTitle = activeSession.taskIds?.[0]?.titre || 'Session';
      const token = localStorage.getItem('token');
      
      // Appel API pour arrêter la session
      if (token && activeSession._id && isValidObjectId(activeSession._id)) {
        await fetch(`${API_URL}/sessions/${activeSession._id}/stop`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action,
            tempsEcoule: currentTime
          })
        });
      }
      
      // Notification selon l'action
      if (action === 'complete') {
        smartNotify('SUCCESS', `Session terminée - ${taskTitle} (${duration} minutes)`);
        
        // Achievement pour longues sessions
        if (duration >= 25) {
          setTimeout(() => {
            smartNotify('ACHIEVEMENT', `🏆 Session productive de ${duration} minutes !`);
          }, 1500);
        }
      } else {
        smartNotify('INFO', 'Session annulée');
      }
      
    } catch (error) {
      console.error('Erreur arrêt session:', error);
      smartNotify('ERROR', 'Erreur lors de l\'arrêt de la session');
    } finally {
      // Nettoyer l'état local dans tous les cas
      setActiveSession(null);
      setCurrentTime(0);
      setIsRunning(false);
      setIsPaused(false);
      setIsFocusModeActive(false);
    }
  }, [activeSession, currentTime, isFocusModeActive, smartNotify, deactivateNotificationBlocking]);

  // Fonction pour mettre en pause une session
  const pauseSession = useCallback(async () => {
    if (!activeSession) return;

    try {
      const token = localStorage.getItem('token');
      
      if (activeSession.focusActif && token && isValidObjectId(activeSession._id)) {
        // Session avec focus - utiliser l'API
        await fetch(`${API_URL}/sessions/${activeSession._id}/timer`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'pause' })
        });
      }
      
      // Mettre à jour l'état local
      setIsPaused(true);
      setIsRunning(false);
      
      // Synchroniser le temps avant la pause
      await syncTimeWithBackend(currentTime);
      
      smartNotify('INFO', 'Session en pause');
      
    } catch (error) {
      console.error('Erreur pause session:', error);
      // Continuer avec la pause locale même en cas d'erreur réseau
      setIsPaused(true);
      setIsRunning(false);
      smartNotify('INFO', 'Session en pause (mode local)');
    }
  }, [activeSession, currentTime, smartNotify, syncTimeWithBackend]);

  // Fonction pour reprendre une session
  const resumeSession = useCallback(async () => {
    if (!activeSession) return;

    try {
      const token = localStorage.getItem('token');
      
      if (activeSession.focusActif && token && isValidObjectId(activeSession._id)) {
        // Session avec focus - utiliser l'API
        await fetch(`${API_URL}/sessions/${activeSession._id}/timer`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'resume' })
        });
      }
      
      // Mettre à jour l'état local
      setIsPaused(false);
      setIsRunning(true);
      lastUpdateRef.current = Date.now();
      
      smartNotify('SUCCESS', 'Session reprise');
      
    } catch (error) {
      console.error('Erreur reprise session:', error);
      // Continuer avec la reprise locale même en cas d'erreur réseau
      setIsPaused(false);
      setIsRunning(true);
      lastUpdateRef.current = Date.now();
      smartNotify('SUCCESS', 'Session reprise (mode local)');
    }
  }, [activeSession, smartNotify]);

  // Fonction pour désactiver le mode focus
  const deactivateFocusMode = useCallback(() => {
    deactivateNotificationBlocking();
  }, [deactivateNotificationBlocking]);

  // Fonction pour actualiser la session
  const refreshSession = useCallback(async () => {
    await loadActiveSession();
  }, [loadActiveSession]);

  // Valeur du contexte
  const value = {
    // États
    activeSession,
    currentTime,
    isRunning,
    isPaused,
    isFocusModeActive,
    
    // Configuration Focus
    focusSettings,
    showFocusModal,
    setShowFocusModal,
    setFocusSettings,
    
    // Actions de session
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    
    // Actions Focus
    activateFocusMode,
    deactivateFocusMode,
    
    // Utilitaires
    smartNotify,
    refreshSession,
    syncTimeWithBackend
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Hook spécialisé pour les notifications de session
export const useSessionNotifications = () => {
  const { smartNotify } = useSession();
  
  return {
    notifySessionStart: useCallback((taskTitle, duration) => {
      const message = duration 
        ? `🚀 Session démarrée: ${taskTitle} (${duration}min)`
        : `🚀 Session démarrée: ${taskTitle}`;
      smartNotify('SUCCESS', message);
    }, [smartNotify]),
    
    notifySessionEnd: useCallback((duration, taskTitle) => {
      smartNotify('SUCCESS', `✅ Session terminée: ${taskTitle} (${duration}min)`);
    }, [smartNotify]),
    
    notifySessionPaused: useCallback(() => {
      smartNotify('INFO', '⏸️ Session en pause');
    }, [smartNotify]),
    
    notifyBreakStarted: useCallback((duration) => {
      smartNotify('INFO', `☕ Pause démarrée (${duration}min)`);
    }, [smartNotify]),
    
    notifyBreakEnded: useCallback(() => {
      smartNotify('SUCCESS', '🔥 Pause terminée - Retour au travail !');
    }, [smartNotify]),
    
    notifyAchievement: useCallback((message) => {
      smartNotify('ACHIEVEMENT', message, 6000);
    }, [smartNotify]),

    notifyPomodoroComplete: useCallback((cycleNumber, totalCycles) => {
      if (cycleNumber >= totalCycles) {
        smartNotify(
          'ACHIEVEMENT', 
          `🏆 Série Pomodoro terminée ! ${totalCycles} cycles complétés`,
          8000
        );
      } else {
        smartNotify('SUCCESS', `✅ Cycle ${cycleNumber}/${totalCycles} terminé !`);
      }
    }, [smartNotify])
  };
};

export default SessionProvider;