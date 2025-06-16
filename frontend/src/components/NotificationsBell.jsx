import React, { useState, useEffect } from 'react';

const NotificationsBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Actualiser les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.counts.total);
      }
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'shared': return '👥';
      case 'overdue': return '⚠️';
      case 'due_today': return '📅';
      case 'completed': return '✅';
      case 'updated': return '📝';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'shared': return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
      case 'overdue': return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'due_today': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
      case 'completed': return 'bg-green-500/10 border-green-500/20 text-green-300';
      case 'updated': return 'bg-purple-500/10 border-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-300';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInHours = (now - notifDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return notifDate.toLocaleDateString('fr-FR');
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200"
      >
        <span className="text-xl">🔔</span>
        
        {/* Badge de notification */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Marquer comme lues
                </button>
              )}
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Actualisation...
              </div>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-2">🔕</div>
                <p className="text-slate-400 text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-4 hover:bg-white/5 transition-colors ${getNotificationColor(notification.type)} border-l-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(notification.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Optionnel: naviguer vers une page de notifications complète
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay pour fermer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationsBell;