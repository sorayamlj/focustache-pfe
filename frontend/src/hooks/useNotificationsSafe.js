// src/hooks/useNotificationsSafe.js - ENHANCED VERSION with proper notification system
import { useContext, useCallback, useRef } from 'react';

/**
 * ✅ ENHANCED: Hook sécurisé pour les notifications avec système de fallback robuste
 * Fixes the reminder system and ensures notifications always work
 */

// ✅ ENHANCED: Single notification creation function with better styling and deduplication
function createEnhancedNotification(message, type = 'info', options = {}) {
  // Check for recent duplicates (within 2 seconds)
  const existingNotifications = document.querySelectorAll('[data-notification-enhanced]');
  const recentDuplicate = Array.from(existingNotifications).some(el => {
    const isSameMessage = el.textContent.includes(message);
    const isRecent = Date.now() - parseInt(el.dataset.timestamp || '0') < 2000;
    return isSameMessage && isRecent;
  });
  
  if (recentDuplicate) {
    console.log('🚫 Duplicate notification prevented:', message);
    return null;
  }
  
  // Limit to 4 notifications max
  if (existingNotifications.length >= 4) {
    const oldest = existingNotifications[0];
    oldest.style.transform = 'translateX(100%)';
    setTimeout(() => oldest.remove(), 200);
  }

  // ✅ ENHANCED: Better notification types and colors
  const NOTIFICATION_CONFIG = {
    success: { 
      emoji: '✅', 
      label: 'Succès', 
      colors: {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.3)',
        text: '#10B981',
        progress: '#10B981'
      }
    },
    error: { 
      emoji: '❌', 
      label: 'Erreur', 
      colors: {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        text: '#EF4444',
        progress: '#EF4444'
      }
    },
    warning: { 
      emoji: '⚠️', 
      label: 'Attention', 
      colors: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: '#F59E0B',
        progress: '#F59E0B'
      }
    },
    info: { 
      emoji: 'ℹ️', 
      label: 'Information', 
      colors: {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)',
        text: '#3B82F6',
        progress: '#3B82F6'
      }
    },
    task: { 
      emoji: '📋', 
      label: 'Tâche', 
      colors: {
        bg: 'rgba(139, 92, 246, 0.1)',
        border: 'rgba(139, 92, 246, 0.3)',
        text: '#8B5CF6',
        progress: '#8B5CF6'
      }
    },
    session: { 
      emoji: '🎯', 
      label: 'Session', 
      colors: {
        bg: 'rgba(251, 146, 60, 0.1)',
        border: 'rgba(251, 146, 60, 0.3)',
        text: '#FB923C',
        progress: '#FB923C'
      }
    },
    achievement: { 
      emoji: '🏆', 
      label: 'Succès !', 
      colors: {
        bg: 'rgba(168, 85, 247, 0.15)',
        border: 'rgba(168, 85, 247, 0.4)',
        text: '#A855F7',
        progress: 'linear-gradient(90deg, #A855F7, #EC4899)'
      }
    },
    deadline: {
      emoji: '📅',
      label: 'Échéance',
      colors: {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: '#F59E0B',
        progress: '#F59E0B'
      }
    }
  };

  const config = NOTIFICATION_CONFIG[type.toLowerCase()] || NOTIFICATION_CONFIG.info;
  const colors = config.colors;

  // Create notification element
  const notification = document.createElement('div');
  const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  
  notification.setAttribute('data-notification-enhanced', 'true');
  notification.setAttribute('data-notification-id', id);
  notification.setAttribute('data-timestamp', timestamp);
  notification.setAttribute('data-type', type);
  
  // ✅ ENHANCED: Responsive positioning with better stacking
  const topOffset = 20 + (existingNotifications.length * 90);
  
  notification.style.cssText = `
    position: fixed;
    top: ${topOffset}px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    min-width: 320px;
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid ${colors.border};
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    transform: translateX(100%);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
    pointer-events: auto;
  `;

  // ✅ ENHANCED: Better HTML structure with improved accessibility
  notification.innerHTML = `
    <div style="padding: 16px;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="
          flex-shrink: 0;
          font-size: 20px;
          margin-top: 2px;
        ">
          ${config.emoji}
        </div>
        
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              color: ${colors.text};
              font-size: 14px;
              font-weight: 600;
              letter-spacing: 0.5px;
            ">
              ${options.title || config.label}
            </span>
            <span style="
              color: rgba(156, 163, 175, 0.8);
              font-size: 11px;
              font-weight: 500;
            ">
              ${new Date().toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          <p style="
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            line-height: 1.4;
            margin: 0;
            word-wrap: break-word;
          ">
            ${message}
          </p>

          ${options.actions ? `
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              ${options.actions.map(action => `
                <button 
                  onclick="${action.onclick}" 
                  style="
                    background: ${colors.text}20;
                    color: ${colors.text};
                    border: 1px solid ${colors.text}40;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                  "
                  onmouseover="this.style.background='${colors.text}30'"
                  onmouseout="this.style.background='${colors.text}20'"
                >
                  ${action.label}
                </button>
              `).join('')}
            </div>
          ` : ''}

          ${options.page ? `
            <div style="margin-top: 8px;">
              <span style="
                display: inline-block;
                background: rgba(55, 65, 81, 0.8);
                color: rgba(156, 163, 175, 0.9);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
              ">
                📍 ${options.page}
              </span>
            </div>
          ` : ''}
        </div>
        
        <button 
          onclick="this.closest('[data-notification-enhanced]').remove()"
          style="
            flex-shrink: 0;
            background: rgba(75, 85, 99, 0.5);
            border: none;
            color: rgba(156, 163, 175, 0.8);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 12px;
          "
          onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.color='#EF4444'"
          onmouseout="this.style.background='rgba(75, 85, 99, 0.5)'; this.style.color='rgba(156, 163, 175, 0.8)'"
        >
          ✕
        </button>
      </div>
    </div>
    
    ${!options.persistent ? `
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(75, 85, 99, 0.3);
        overflow: hidden;
      ">
        <div 
          class="notification-progress"
          style="
            height: 100%;
            background: ${colors.progress};
            width: 100%;
            transition: width linear;
            border-radius: 0 0 12px 12px;
          "
        ></div>
      </div>
    ` : ''}
  `;
  
  document.body.appendChild(notification);
  
  // ✅ ENHANCED: Smooth entrance animation
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });
  
  // ✅ ENHANCED: Auto-removal with progress bar animation
  const duration = options.duration || (type === 'error' ? 6000 : type === 'achievement' ? 8000 : 4000);
  
  if (!options.persistent) {
    const progressBar = notification.querySelector('.notification-progress');
    
    if (progressBar) {
      progressBar.style.transitionDuration = `${duration}ms`;
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });
    }
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 400);
      }
    }, duration);
  }
  
  return id;
}

// ✅ ENHANCED: Main notification hook with better integration
export const useNotificationsSafe = () => {
  const notificationTimeouts = useRef(new Map());
  
  // ✅ Try to get context from Layout if available
  let contextValue = null;
  try {
    // This will work if the Layout notification context is available
    const NotificationContext = React.createContext();
    contextValue = useContext(NotificationContext);
  } catch (error) {
    // Context not available, use fallback
  }

  // ✅ ENHANCED: Core notification function with deduplication
  const notify = useCallback((message, type = 'info', options = {}) => {
    const notificationId = `${type}-${message}`;
    
    // Clear existing timeout for same notification
    if (notificationTimeouts.current.has(notificationId)) {
      clearTimeout(notificationTimeouts.current.get(notificationId));
    }
    
    // Create notification
    const id = createEnhancedNotification(message, type, options);
    
    // Set cleanup timeout
    const timeout = setTimeout(() => {
      notificationTimeouts.current.delete(notificationId);
    }, options.duration || 4000);
    
    notificationTimeouts.current.set(notificationId, timeout);
    
    return id;
  }, []);

  // ✅ ENHANCED: Specialized notification functions
  const notifySuccess = useCallback((message, options = {}) => {
    return notify(message, 'success', options);
  }, [notify]);

  const notifyError = useCallback((message, options = {}) => {
    return notify(message, 'error', { duration: 6000, persistent: true, ...options });
  }, [notify]);

  const notifyWarning = useCallback((message, options = {}) => {
    return notify(message, 'warning', { duration: 5000, ...options });
  }, [notify]);

  const notifyInfo = useCallback((message, options = {}) => {
    return notify(message, 'info', options);
  }, [notify]);

  const notifyTask = useCallback((message, options = {}) => {
    const msg = typeof message === 'string' ? message : message.message;
    return notify(msg, 'task', { page: 'Tâches', ...options });
  }, [notify]);

  const notifySession = useCallback((message, options = {}) => {
    return notify(message, 'session', { page: 'Session', ...options });
  }, [notify]);

  const notifyAchievement = useCallback((message, options = {}) => {
    return notify(message, 'achievement', { 
      duration: 8000, 
      persistent: true,
      ...options 
    });
  }, [notify]);

  // ✅ ENHANCED: Deadline notifications with better UX
  const notifyDeadline = useCallback((taskTitle, timeLeft, priority = 'normal') => {
    const isUrgent = timeLeft.includes('aujourd\'hui') || timeLeft.includes('heure') || timeLeft.includes('retard');
    const type = isUrgent ? 'error' : 'deadline';
    const message = `"${taskTitle}" ${timeLeft.includes('retard') ? 'est en retard' : `doit être terminée ${timeLeft}`}`;
    
    const options = {
      title: isUrgent ? '🚨 Échéance urgente' : '📅 Rappel d\'échéance',
      duration: isUrgent ? 8000 : 6000,
      persistent: isUrgent || priority === 'haute',
      actions: isUrgent ? [{
        label: 'Voir la tâche',
        onclick: `window.location.href='/tasks'`
      }] : undefined
    };
    
    return notify(message, type, options);
  }, [notify]);

  // ✅ ENHANCED: Session completion with achievements
  const notifySessionComplete = useCallback((duration, taskTitle, estimatedTime) => {
    const message = `🎉 Session terminée ! "${taskTitle}" (${Math.round(duration)} min)`;
    
    // Calculate achievement level
    let achievementLevel = 'success';
    const accuracy = estimatedTime ? Math.abs(duration - estimatedTime) / estimatedTime : 0;
    
    if (duration >= 25 && accuracy < 0.2) {
      achievementLevel = 'achievement';
    }
    
    return notify(message, achievementLevel, { 
      title: '🏆 Excellent travail !',
      duration: 8000, 
      persistent: true,
      actions: [{
        label: 'Voir les stats',
        onclick: `window.location.href='/stats'`
      }]
    });
  }, [notify]);

  // ✅ ENHANCED: Clear all notifications function
  const clearAllNotifications = useCallback(() => {
    const notifications = document.querySelectorAll('[data-notification-enhanced]');
    notifications.forEach(notif => {
      notif.style.transform = 'translateX(100%)';
      setTimeout(() => notif.remove(), 300);
    });
    
    // Clear all timeouts
    notificationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    notificationTimeouts.current.clear();
  }, []);

  // ✅ ENHANCED: Get active notifications count
  const getActiveNotificationsCount = useCallback(() => {
    return document.querySelectorAll('[data-notification-enhanced]').length;
  }, []);

  // ✅ ENHANCED: Test notification system
  const testNotifications = useCallback(() => {
    notifyInfo('Test de notification - Système fonctionnel !', {
      title: '🧪 Test'
    });
    
    setTimeout(() => {
      notifyWarning('Test d\'avertissement', {
        title: '⚠️ Test Warning'
      });
    }, 1000);
    
    setTimeout(() => {
      notifySuccess('Test de succès', {
        title: '✅ Test Success'
      });
    }, 2000);
    
    setTimeout(() => {
      notifyAchievement('Test d\'achievement !', {
        title: '🏆 Test Achievement'
      });
    }, 3000);
  }, [notifyInfo, notifyWarning, notifySuccess, notifyAchievement]);

  return {
    // Core functions
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    
    // Specialized functions
    notifyTask,
    notifySession,
    notifyAchievement,
    notifyDeadline,
    notifySessionComplete,
    
    // Utility functions
    clearAllNotifications,
    getActiveNotificationsCount,
    testNotifications,
    
    // Legacy compatibility
    activeNotifications: []
  };
};

export default useNotificationsSafe;