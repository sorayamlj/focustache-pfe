// src/components/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { notificationsApi } from '../services/notificationsApi';

const Notifications = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      // Données mockées pour demo
      setNotifications([
        {
          id: 1,
          type: 'task_reminder',
          title: 'Rappel de tâche',
          message: 'La tâche "Mathématiques - Chapitre 5" est due dans 2 heures',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          isRead: false,
          priority: 'high',
          actionUrl: '/tasks/123'
        },
        {
          id: 2,
          type: 'session_complete',
          title: 'Session terminée',
          message: 'Félicitations ! Vous avez terminé une session de focus de 25 minutes',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
          isRead: false,
          priority: 'medium'
        },
        {
          id: 3,
          type: 'streak_milestone',
          title: 'Série de 7 jours !',
          message: 'Incroyable ! Vous avez maintenu votre série pendant 7 jours consécutifs',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          isRead: true,
          priority: 'low'
        },
        {
          id: 4,
          type: 'deadline_approaching',
          title: 'Échéance proche',
          message: 'Le projet "Présentation Histoire" est dû demain',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3h ago
          isRead: false,
          priority: 'high',
          actionUrl: '/tasks/456'
        },
        {
          id: 5,
          type: 'achievement',
          title: 'Nouvel accomplissement',
          message: 'Vous avez débloqué le badge "Maître du Focus" !',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6h ago
          isRead: true,
          priority: 'medium'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Erreur marquage lu:', error);
      // Mise à jour locale pour demo
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
      // Mise à jour locale pour demo
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      // Suppression locale pour demo
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Erreur suppression toutes notifications:', error);
      // Suppression locale pour demo
      setNotifications([]);
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `il y a ${minutes} min`;
    } else if (hours < 24) {
      return `il y a ${hours}h`;
    } else {
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_reminder':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'session_complete':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'streak_milestone':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        );
      case 'deadline_approaching':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.858 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'achievement':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          </svg>
        );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'from-red-500 to-red-600';
      case 'medium':
        return 'from-yellow-500 to-orange-500';
      case 'low':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const baseClasses = theme === 'dark' 
    ? 'bg-slate-800/95 border-slate-600/30 text-white'
    : 'bg-white/95 border-gray-200/50 text-gray-900';

  const cardClasses = theme === 'dark'
    ? 'bg-slate-700/50 border-slate-600/30'
    : 'bg-white/50 border-gray-200/50';

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md ${baseClasses} backdrop-blur-xl border-l shadow-2xl z-50 transform transition-transform duration-300`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-600/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                {unreadCount > 0 && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filtres et actions */}
          <div className="p-4 border-b border-slate-600/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-1">
                {['all', 'unread', 'read'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      filter === filterType
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : theme === 'dark'
                          ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {filterType === 'all' ? 'Toutes' : filterType === 'unread' ? 'Non lues' : 'Lues'}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`text-sm font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    Tout marquer comme lu
                  </button>
                )}
                
                <button
                  onClick={clearAllNotifications}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                      : 'text-red-600 hover:bg-red-100 hover:text-red-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : getFilteredNotifications().length === 0 ? (
              <div className="text-center py-12">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100'
                }`}>
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                </div>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
                  {filter === 'unread' ? 'Aucune notification non lue' : 
                   filter === 'read' ? 'Aucune notification lue' : 
                   'Aucune notification'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {getFilteredNotifications().map((notification) => (
                  <div
                    key={notification.id}
                    className={`${cardClasses} border rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] ${
                      !notification.isRead ? 'ring-2 ring-blue-500/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${getPriorityColor(notification.priority)} text-white flex-shrink-0`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold ${!notification.isRead ? 'text-blue-400' : ''}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className={`p-1 rounded transition-colors ${
                                theme === 'dark' 
                                  ? 'text-slate-400 hover:text-red-400'
                                  : 'text-gray-400 hover:text-red-600'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <button
                                onClick={() => {
                                  window.location.href = notification.actionUrl;
                                  markAsRead(notification.id);
                                }}
                                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                Voir →
                              </button>
                            )}
                            
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;