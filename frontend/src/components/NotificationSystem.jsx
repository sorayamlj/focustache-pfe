import React, { useState, useCallback, useEffect } from 'react';
import { X, Check, AlertTriangle, Info, Share, Edit, Plus, Clock, Users, Calendar, Bell, BellRing } from 'lucide-react';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [tasks, setTasks] = useState([
    {
      _id: '1',
      titre: 'Rapport mensuel',
      dateEcheance: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 jours en retard
      statut: 'à faire',
      priorite: 'haute'
    },
    {
      _id: '2',
      titre: 'Présentation client',
      dateEcheance: new Date().toISOString(), // Aujourd'hui
      statut: 'à faire',
      priorite: 'haute'
    },
    {
      _id: '3',
      titre: 'Réunion équipe',
      dateEcheance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      statut: 'à faire',
      priorite: 'moyenne'
    },
    {
      _id: '4',
      titre: 'Formation React',
      dateEcheance: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Dans 3 jours
      statut: 'à faire',
      priorite: 'haute'
    },
    {
      _id: '5',
      titre: 'Révision projet',
      dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
      statut: 'à faire',
      priorite: 'basse'
    }
  ]);

  // Types de notifications avec leurs styles
  const notificationTypes = {
    success: {
      bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
      icon: Check,
      borderColor: 'border-green-400',
      textColor: 'text-green-50'
    },
    error: {
      bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
      icon: X,
      borderColor: 'border-red-400',
      textColor: 'text-red-50'
    },
    warning: {
      bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
      icon: AlertTriangle,
      borderColor: 'border-orange-400',
      textColor: 'text-orange-50'
    },
    info: {
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: Info,
      borderColor: 'border-blue-400',
      textColor: 'text-blue-50'
    },
    task: {
      bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      icon: Clock,
      borderColor: 'border-purple-400',
      textColor: 'text-purple-50'
    },
    share: {
      bgColor: 'bg-gradient-to-r from-teal-500 to-teal-600',
      icon: Share,
      borderColor: 'border-teal-400',
      textColor: 'text-teal-50'
    },
    reminder: {
      bgColor: 'bg-gradient-to-r from-amber-500 to-amber-600',
      icon: Bell,
      borderColor: 'border-amber-400',
      textColor: 'text-amber-50'
    },
    deadline: {
      bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
      icon: BellRing,
      borderColor: 'border-red-400',
      textColor: 'text-red-50'
    }
  };

  // Fonction pour ajouter une notification
  const addNotification = useCallback((options) => {
    const notification = {
      id: nextId,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      timestamp: new Date(),
      persistent: options.persistent || false,
      actions: options.actions || [],
      metadata: options.metadata || {},
      isRead: false,
      ...options
    };

    setNotifications(prev => [notification, ...prev]);
    setNextId(prev => prev + 1);

    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.type === 'error' ? 8000 : 5000);
    }

    return notification.id;
  }, [nextId]);

  // Fonction pour supprimer une notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Marquer comme lu
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  // Système de rappels d'échéances
  const checkDeadlines = useCallback(() => {
    if (!tasks || tasks.length === 0) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    tasks.forEach(task => {
      if (task.statut === 'terminée' || !task.dateEcheance) return;
      
      const deadline = new Date(task.dateEcheance);
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Créer une clé unique pour éviter les notifications en double
      const notificationKey = `reminder-${task._id}-${today.toISOString().split('T')[0]}`;
      const hasNotifiedToday = localStorage.getItem(notificationKey);
      
      if (!hasNotifiedToday) {
        if (daysUntilDeadline < 0) {
          // Tâche en retard
          const daysOverdue = Math.abs(daysUntilDeadline);
          addNotification({
            type: 'deadline',
            title: '🚨 Tâche en retard',
            message: `"${task.titre}" était due il y a ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
            persistent: true,
            metadata: { taskId: task._id, taskTitle: task.titre, daysOverdue },
            actions: [
              { 
                label: 'Voir tâche', 
                onClick: () => console.log(`Voir tâche ${task._id}`), 
                icon: Edit 
              },
              { 
                label: 'Marquer terminée', 
                onClick: () => {
                  console.log(`Marquer terminée ${task._id}`);
                  // Simuler la completion
                  setTasks(prev => prev.map(t => 
                    t._id === task._id ? { ...t, statut: 'terminée' } : t
                  ));
                }, 
                icon: Check 
              }
            ]
          });
          localStorage.setItem(notificationKey, 'overdue');
        } else if (daysUntilDeadline === 0) {
          // Due aujourd'hui
          addNotification({
            type: 'warning',
            title: '⏰ Échéance aujourd\'hui',
            message: `"${task.titre}" doit être terminée aujourd'hui`,
            persistent: true,
            metadata: { taskId: task._id, taskTitle: task.titre },
            actions: [
              { 
                label: 'Voir tâche', 
                onClick: () => console.log(`Voir tâche ${task._id}`), 
                icon: Edit 
              },
              { 
                label: 'Reporter', 
                onClick: () => console.log(`Reporter tâche ${task._id}`), 
                icon: Calendar 
              }
            ]
          });
          localStorage.setItem(notificationKey, 'today');
        } else if (daysUntilDeadline === 1) {
          // Due demain
          addNotification({
            type: 'reminder',
            title: '📅 Échéance demain',
            message: `"${task.titre}" doit être terminée demain`,
            persistent: false,
            metadata: { taskId: task._id, taskTitle: task.titre },
            actions: [
              { 
                label: 'Voir tâche', 
                onClick: () => console.log(`Voir tâche ${task._id}`), 
                icon: Edit 
              }
            ]
          });
          localStorage.setItem(notificationKey, 'tomorrow');
        } else if (daysUntilDeadline <= 3 && task.priorite === 'haute') {
          // Tâche prioritaire dans les 3 jours
          addNotification({
            type: 'warning',
            title: '🔥 Tâche prioritaire',
            message: `"${task.titre}" (priorité haute) doit être terminée dans ${daysUntilDeadline} jours`,
            persistent: false,
            metadata: { taskId: task._id, taskTitle: task.titre, priority: task.priorite },
            actions: [
              { 
                label: 'Planifier', 
                onClick: () => console.log(`Planifier ${task._id}`), 
                icon: Calendar 
              }
            ]
          });
          localStorage.setItem(notificationKey, 'priority');
        } else if (daysUntilDeadline <= 7) {
          // Due dans la semaine
          addNotification({
            type: 'info',
            title: '📋 Rappel d\'échéance',
            message: `"${task.titre}" doit être terminée dans ${daysUntilDeadline} jours`,
            persistent: false,
            metadata: { taskId: task._id, taskTitle: task.titre },
            actions: [
              { 
                label: 'Voir tâche', 
                onClick: () => console.log(`Voir tâche ${task._id}`), 
                icon: Edit 
              }
            ]
          });
          localStorage.setItem(notificationKey, 'week');
        }
      }
    });
  }, [tasks, addNotification]);

  // Vérifier les échéances au montage et toutes les heures
  useEffect(() => {
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000); // Toutes les heures
    return () => clearInterval(interval);
  }, [checkDeadlines]);

  // Nettoyer les anciennes notifications stockées
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

  // Nettoyer une fois par jour
  useEffect(() => {
    const lastCleanup = localStorage.getItem('lastNotificationCleanup');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastCleanup !== today) {
      clearOldNotifications();
      localStorage.setItem('lastNotificationCleanup', today);
    }
  }, [clearOldNotifications]);

  // Composant Notification individuelle
  const NotificationItem = ({ notification }) => {
    const config = notificationTypes[notification.type] || notificationTypes.info;
    const Icon = config.icon;
    
    const handleAction = (action) => {
      if (action.onClick) {
        action.onClick();
      }
      if (action.closeAfter !== false) {
        removeNotification(notification.id);
      }
    };

    const formatTimeAgo = (timestamp) => {
      const diff = Date.now() - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      
      if (minutes < 1) return 'À l\'instant';
      if (minutes < 60) return `${minutes}min`;
      if (hours < 24) return `${hours}h`;
      return new Date(timestamp).toLocaleDateString();
    };

    return (
      <div className={`
        relative overflow-hidden rounded-xl shadow-xl backdrop-blur-sm
        ${config.bgColor} ${config.textColor}
        border ${config.borderColor} border-opacity-30
        transform transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-2xl
        ${notification.isRead ? 'opacity-75' : 'opacity-100'}
      `}>
        {/* Barre de progression pour les notifications temporaires */}
        {!notification.persistent && (
          <div className="absolute top-0 left-0 h-1 bg-white/30 animate-pulse"></div>
        )}
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icône */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Icon size={16} className="text-white" />
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm leading-tight">
                    {notification.title}
                  </h4>
                  <p className="text-white/90 text-sm mt-1 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {/* Métadonnées spécifiques aux rappels */}
                  {notification.metadata.taskTitle && (
                    <div className="mt-2 text-xs text-white/70">
                      Tâche: {notification.metadata.taskTitle}
                      {notification.metadata.priority && (
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          notification.metadata.priority === 'haute' ? 'bg-red-500/30' :
                          notification.metadata.priority === 'moyenne' ? 'bg-yellow-500/30' :
                          'bg-green-500/30'
                        }`}>
                          {notification.metadata.priority}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bouton fermer */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 
                           flex items-center justify-center transition-colors group"
                  title="Fermer"
                >
                  <X size={12} className="text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(action)}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 
                               text-white text-xs font-medium rounded-lg
                               transition-all duration-200 hover:scale-105
                               flex items-center gap-1"
                    >
                      {action.icon && <action.icon size={12} />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs text-white/60 flex items-center gap-1">
                <Clock size={10} />
                {formatTimeAgo(notification.timestamp)}
              </div>
            </div>
          </div>
        </div>

        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                        transform -skew-x-12 -translate-x-full animate-pulse"></div>
      </div>
    );
  };

  // Fonctions de démonstration pour créer différents types de notifications
  const demoNotifications = {
    taskCreated: () => addNotification({
      type: 'success',
      title: '✅ Tâche créée',
      message: '"Réviser le rapport mensuel" a été ajoutée avec succès',
      metadata: { taskTitle: 'Réviser le rapport mensuel' },
      actions: [
        { label: 'Voir', onClick: () => console.log('Voir tâche'), icon: Edit },
        { label: 'Modifier', onClick: () => console.log('Modifier tâche'), icon: Edit }
      ]
    }),

    taskModified: () => addNotification({
      type: 'info',
      title: '📝 Tâche modifiée',
      message: 'Les détails de "Réunion équipe" ont été mis à jour',
      metadata: { taskTitle: 'Réunion équipe' },
      actions: [
        { label: 'Voir changements', onClick: () => console.log('Voir changements'), icon: Info }
      ]
    }),

    taskShared: () => addNotification({
      type: 'share',
      title: '🔗 Tâche partagée',
      message: '"Projet Q3" a été partagée avec 3 collaborateurs',
      metadata: { taskTitle: 'Projet Q3', sharedWith: 3 },
      actions: [
        { label: 'Gérer accès', onClick: () => console.log('Gérer accès'), icon: Users },
        { label: 'Voir tâche', onClick: () => console.log('Voir tâche'), icon: Edit }
      ]
    }),

    manualOverdue: () => addNotification({
      type: 'deadline',
      title: '⚠️ Tâche en retard',
      message: '"Rapport mensuel" était due il y a 2 jours',
      persistent: true,
      metadata: { taskTitle: 'Rapport mensuel', daysOverdue: 2 },
      actions: [
        { label: 'Voir tâche', onClick: () => console.log('Voir tâche'), icon: Edit },
        { label: 'Marquer terminée', onClick: () => console.log('Marquer terminée'), icon: Check }
      ]
    }),

    manualDueToday: () => addNotification({
      type: 'warning',
      title: '🚨 Échéance aujourd\'hui',
      message: '"Présentation client" doit être terminée aujourd\'hui',
      persistent: true,
      metadata: { taskTitle: 'Présentation client' },
      actions: [
        { label: 'Voir tâche', onClick: () => console.log('Voir tâche'), icon: Edit },
        { label: 'Reporter', onClick: () => console.log('Reporter'), icon: Clock }
      ]
    }),

    collaborationInvite: () => addNotification({
      type: 'info',
      title: '👥 Invitation reçue',
      message: 'Marie vous a invité à collaborer sur "Budget 2024"',
      persistent: true,
      actions: [
        { label: 'Accepter', onClick: () => console.log('Accepter'), icon: Check },
        { label: 'Refuser', onClick: () => console.log('Refuser'), icon: X },
        { label: 'Voir détails', onClick: () => console.log('Voir détails'), icon: Info }
      ]
    }),

    checkAllDeadlines: () => {
      // Forcer la vérification des échéances
      localStorage.clear(); // Reset pour permettre de nouvelles notifications
      checkDeadlines();
    }
  };

  // Statistiques des tâches
  const getTaskStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const overdue = tasks.filter(task => 
      task.statut !== 'terminée' && 
      task.dateEcheance && 
      new Date(task.dateEcheance) < today
    ).length;
    
    const dueToday = tasks.filter(task => 
      task.statut !== 'terminée' && 
      task.dateEcheance && 
      new Date(task.dateEcheance).toDateString() === today.toDateString()
    ).length;
    
    const dueTomorrow = tasks.filter(task => {
      if (task.statut === 'terminée' || !task.dateEcheance) return false;
      const taskDate = new Date(task.dateEcheance);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return taskDate.toDateString() === tomorrow.toDateString();
    }).length;
    
    const highPriorityUpcoming = tasks.filter(task => {
      if (task.statut === 'terminée' || !task.dateEcheance || task.priorite !== 'haute') return false;
      const taskDate = new Date(task.dateEcheance);
      const daysUntil = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 3;
    }).length;

    return { overdue, dueToday, dueTomorrow, highPriorityUpcoming };
  };

  const taskStats = getTaskStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Système de Notifications avec Rappels
          </h1>
          <p className="text-slate-400">
            Notifications modernes avec rappels automatiques d'échéances
          </p>
        </div>

        {/* Stats des tâches */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{taskStats.overdue}</div>
            <div className="text-red-300 text-sm">En retard</div>
          </div>
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{taskStats.dueToday}</div>
            <div className="text-orange-300 text-sm">Dues aujourd'hui</div>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{taskStats.dueTomorrow}</div>
            <div className="text-yellow-300 text-sm">Dues demain</div>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{taskStats.highPriorityUpcoming}</div>
            <div className="text-purple-300 text-sm">Prioritaires (3j)</div>
          </div>
        </div>

        {/* Boutons de démonstration */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus size={20} />
            Créer des notifications
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={demoNotifications.taskCreated}
              className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg 
                       transition-colors text-sm font-medium"
            >
              ✅ Tâche créée
            </button>
            <button
              onClick={demoNotifications.taskModified}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                       transition-colors text-sm font-medium"
            >
              📝 Tâche modifiée
            </button>
            <button
              onClick={demoNotifications.taskShared}
              className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg 
                       transition-colors text-sm font-medium"
            >
              🔗 Tâche partagée
            </button>
            <button
              onClick={demoNotifications.manualOverdue}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                       transition-colors text-sm font-medium"
            >
              ⚠️ En retard
            </button>
            <button
              onClick={demoNotifications.manualDueToday}
              className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg 
                       transition-colors text-sm font-medium"
            >
              🚨 Due aujourd'hui
            </button>
            <button
              onClick={demoNotifications.collaborationInvite}
              className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg 
                       transition-colors text-sm font-medium"
            >
              👥 Invitation
            </button>
          </div>
          
          {/* Bouton spécial pour forcer la vérification des rappels */}
          <div className="mt-4 pt-4 border-t border-slate-600">
            <button
              onClick={demoNotifications.checkAllDeadlines}
              className="w-full p-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 
                       text-white rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <BellRing size={16} />
              🔔 Vérifier les rappels d'échéances
            </button>
            <p className="text-slate-400 text-xs mt-2 text-center">
              Force la vérification des échéances pour toutes les tâches
            </p>
          </div>
        </div>

        {/* Zone des notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bell size={20} />
              Notifications ({notifications.length})
            </h2>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                <Bell size={24} />
              </div>
              <p>Aucune notification pour le moment</p>
              <p className="text-sm mt-1">Les rappels d'échéances apparaîtront automatiquement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Légende des types de rappels */}
        <div className="mt-8 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Info size={16} />
            Types de rappels automatiques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-300">Tâches en retard (persistant)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-slate-300">Échéance aujourd'hui (persistant)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-slate-300">Échéance demain</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-slate-300">Tâches prioritaires (≤ 3 jours)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-300">Échéances dans la semaine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-slate-300">Nettoyage automatique quotidien</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-600">
            <p className="text-xs text-slate-400">
              💡 Les rappels se déclenchent automatiquement selon les échéances. 
              Une même tâche ne génère qu'un rappel par jour pour éviter le spam.
            </p>
          </div>
        </div>

        {/* Section des tâches de démonstration */}
        <div className="mt-8 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Calendar size={16} />
            Tâches de démonstration
          </h3>
          <div className="space-y-2">
            {tasks.map(task => {
              const now = new Date();
              const deadline = new Date(task.dateEcheance);
              const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              let statusColor = 'text-slate-400';
              let statusText = `Dans ${daysUntil} jours`;
              
              if (daysUntil < 0) {
                statusColor = 'text-red-400';
                statusText = `En retard (${Math.abs(daysUntil)} jours)`;
              } else if (daysUntil === 0) {
                statusColor = 'text-orange-400';
                statusText = 'Aujourd\'hui';
              } else if (daysUntil === 1) {
                statusColor = 'text-yellow-400';
                statusText = 'Demain';
              }

              return (
                <div key={task._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.priorite === 'haute' ? 'bg-red-500' :
                      task.priorite === 'moyenne' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-white font-medium">{task.titre}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.statut === 'terminée' ? 'bg-green-500/20 text-green-400' :
                      task.statut === 'en cours' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {task.statut}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${statusColor}`}>
                      {statusText}
                    </span>
                    {task.statut !== 'terminée' && (
                      <button
                        onClick={() => {
                          setTasks(prev => prev.map(t => 
                            t._id === task._id ? { ...t, statut: t.statut === 'terminée' ? 'à faire' : 'terminée' } : t
                          ));
                          if (task.statut !== 'terminée') {
                            addNotification({
                              type: 'success',
                              title: '🎉 Tâche terminée !',
                              message: `Félicitations ! "${task.titre}" a été marquée comme terminée.`,
                              persistent: false
                            });
                          }
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded"
                        title="Marquer comme terminée"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;