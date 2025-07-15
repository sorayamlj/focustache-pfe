import { useEffect, useCallback } from 'react';

export const useDeadlineReminders = (tasks = []) => {
  // Système de notifications simple qui utilise le système global si disponible
  const showNotification = useCallback((type, title, message, persistent = false) => {
    if (window.addTaskNotification) {
      window.addTaskNotification({
        type,
        title,
        message,
        persistent
      });
    } else {
      // Fallback si le système de notifications n'est pas disponible
      console.log(`${type.toUpperCase()}: ${title} - ${message}`);
      if (type === 'error' || type === 'warning') {
        // Optionnel: utiliser une notification browser native pour les alertes importantes
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, []);

  const showWarning = useCallback((title, message, persistent = false) => {
    showNotification('warning', title, message, persistent);
  }, [showNotification]);

  const showError = useCallback((title, message, persistent = false) => {
    showNotification('error', title, message, persistent);
  }, [showNotification]);

  const showInfo = useCallback((title, message, persistent = false) => {
    showNotification('info', title, message, persistent);
  }, [showNotification]);

  const checkDeadlines = useCallback(() => {
    if (!tasks || tasks.length === 0) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    tasks.forEach(task => {
      if (task.statut === 'terminée' || !task.dateEcheance) return;
      
      const deadline = new Date(task.dateEcheance);
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Create unique key for this task and date to avoid duplicate notifications
      const notificationKey = `reminder-${task._id}-${today.toISOString().split('T')[0]}`;
      const hasNotifiedToday = localStorage.getItem(notificationKey);
      
      if (!hasNotifiedToday) {
        if (daysUntilDeadline < 0) {
          // Overdue
          const daysOverdue = Math.abs(daysUntilDeadline);
          showError(
            '⚠️ Tâche en retard',
            `"${task.titre}" était due il y a ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
            true
          );
          localStorage.setItem(notificationKey, 'overdue');
        } else if (daysUntilDeadline === 0) {
          // Due today
          showWarning(
            '🚨 Échéance aujourd\'hui',
            `"${task.titre}" doit être terminée aujourd'hui`,
            true
          );
          localStorage.setItem(notificationKey, 'today');
        } else if (daysUntilDeadline === 1) {
          // Due tomorrow
          showWarning(
            '⏰ Échéance demain',
            `"${task.titre}" doit être terminée demain`,
            true
          );
          localStorage.setItem(notificationKey, 'tomorrow');
        } else if (daysUntilDeadline <= 3 && task.priorite === 'haute') {
          // High priority task due within 3 days
          showWarning(
            '📋 Tâche prioritaire',
            `"${task.titre}" (priorité haute) doit être terminée dans ${daysUntilDeadline} jours`,
            false
          );
          localStorage.setItem(notificationKey, 'priority');
        } else if (daysUntilDeadline <= 7) {
          // Due within a week
          showInfo(
            '📅 Rappel d\'échéance',
            `"${task.titre}" doit être terminée dans ${daysUntilDeadline} jours`,
            false
          );
          localStorage.setItem(notificationKey, 'week');
        }
      }
    });
  }, [tasks, showWarning, showError, showInfo]);

  // Check deadlines on component mount and every hour
  useEffect(() => {
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, [checkDeadlines]);

  // Also check when tasks change
  useEffect(() => {
    const timeoutId = setTimeout(checkDeadlines, 1000); // Small delay to avoid too frequent checks
    return () => clearTimeout(timeoutId);
  }, [tasks, checkDeadlines]);

  // Fonction pour nettoyer les anciennes notifications stockées (optionnel)
  const clearOldNotifications = useCallback(() => {
    const keys = Object.keys(localStorage);
    const reminderKeys = keys.filter(key => key.startsWith('reminder-'));
    const today = new Date().toISOString().split('T')[0];
    
    reminderKeys.forEach(key => {
      const keyDate = key.split('-').pop();
      if (keyDate !== today) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Nettoyer les anciennes notifications une fois par jour
  useEffect(() => {
    const lastCleanup = localStorage.getItem('lastNotificationCleanup');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastCleanup !== today) {
      clearOldNotifications();
      localStorage.setItem('lastNotificationCleanup', today);
    }
  }, [clearOldNotifications]);

  return { 
    checkDeadlines,
    clearOldNotifications,
    showWarning,
    showError,
    showInfo
  };
};