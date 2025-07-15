// Layout.jsx - VERSION ORIGINALE CORRIGÉE (juste sans Mode Focus et sans doublons)
import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Timer, 
  BarChart3, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X,
  Play,
  BookOpen,
  Settings,
  Moon,
  Sun,
  MoreHorizontal,
  Bell,
  BellOff
} from 'lucide-react';
import ProfileComponent from './Profile.jsx';

// ===============================
// SYSTÈME DE NOTIFICATIONS UNIFIÉ 
// ===============================

const NOTIFICATION_TYPES = {
  success: { emoji: '✅', label: 'Succès', color: 'green' },
  error: { emoji: '❌', label: 'Erreur', color: 'red' },
  warning: { emoji: '⚠️', label: 'Attention', color: 'yellow' },
  info: { emoji: 'ℹ️', label: 'Information', color: 'blue' },
  task: { emoji: '📋', label: 'Tâche', color: 'purple' },
  session: { emoji: '🎯', label: 'Session', color: 'orange' },
  achievement: { emoji: '🏆', label: 'Succès !', color: 'gold' }
};

const getNotificationColors = (type, isDark) => {
  const colors = {
    green: { 
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-100', 
      border: isDark ? 'border-emerald-500/30' : 'border-emerald-300', 
      text: isDark ? 'text-emerald-400' : 'text-emerald-700', 
      progress: isDark ? 'bg-emerald-500' : 'bg-emerald-600' 
    },
    blue: { 
      bg: isDark ? 'bg-blue-500/10' : 'bg-blue-100', 
      border: isDark ? 'border-blue-500/30' : 'border-blue-300', 
      text: isDark ? 'text-blue-400' : 'text-blue-700', 
      progress: isDark ? 'bg-blue-500' : 'bg-blue-600' 
    },
    yellow: { 
      bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-100', 
      border: isDark ? 'border-yellow-500/30' : 'border-yellow-300', 
      text: isDark ? 'text-yellow-400' : 'text-yellow-700', 
      progress: isDark ? 'bg-yellow-500' : 'bg-yellow-600' 
    },
    red: { 
      bg: isDark ? 'bg-red-500/10' : 'bg-red-100', 
      border: isDark ? 'border-red-500/30' : 'border-red-300', 
      text: isDark ? 'text-red-400' : 'text-red-700', 
      progress: isDark ? 'bg-red-500' : 'bg-red-600' 
    },
    purple: { 
      bg: isDark ? 'bg-purple-500/10' : 'bg-purple-100', 
      border: isDark ? 'border-purple-500/30' : 'border-purple-300', 
      text: isDark ? 'text-purple-400' : 'text-purple-700', 
      progress: isDark ? 'bg-purple-500' : 'bg-purple-600' 
    },
    orange: { 
      bg: isDark ? 'bg-orange-500/10' : 'bg-orange-100', 
      border: isDark ? 'border-orange-500/30' : 'border-orange-300', 
      text: isDark ? 'text-orange-400' : 'text-orange-700', 
      progress: isDark ? 'bg-orange-500' : 'bg-orange-600' 
    },
    gold: { 
      bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-200', 
      border: isDark ? 'border-yellow-400/50' : 'border-yellow-400', 
      text: isDark ? 'text-yellow-300' : 'text-yellow-800', 
      progress: isDark ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-orange-600' 
    }
  };
  return colors[type] || colors.blue;
};

// CONTEXTE NOTIFICATIONS UNIFIÉ
const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Retour fallback sécurisé
    return {
      notify: () => console.log('Notification system not initialized'),
      notifySuccess: () => {},
      notifyError: () => {},
      notifyWarning: () => {},
      notifyInfo: () => {},
      notifyTask: () => {},
      notifySession: () => {},
      notifyAchievement: () => {},
      notifyDeadline: () => {},
      notifySessionComplete: () => {},
      removeActiveNotification: () => {},
      clearAllNotifications: () => {},
      activeNotifications: []
    };
  }
  return context;
};

// COMPOSANT NOTIFICATION ITEM
const NotificationItem = ({ notification, onDismiss, isDark }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(notification.duration || 5000);

  const notifType = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
  const colors = getNotificationColors(notifType.color, isDark);

  useEffect(() => {
    const enterTimer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (!notification.persistent && !isLeaving) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 100) {
            handleDismiss();
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [notification.persistent, isLeaving]);

  const handleDismiss = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const progressPercentage = notification.persistent ? 100 : (timeLeft / (notification.duration || 5000)) * 100;
  
  return (
    <div className={`
      notification-item relative max-w-sm w-full transform transition-all duration-300 ease-out
      ${isDark ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm border rounded-xl shadow-lg
      ${colors.border} hover:shadow-xl group
      ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
    `}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-xl flex-shrink-0 mt-0.5">
            {notifType.emoji}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-medium ${colors.text}`}>
                {notification.title || notifType.label}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {new Date().toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
              {notification.message}
            </p>

            {notification.page && (
              <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
                📍 {notification.page}
              </span>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 w-6 h-6 rounded-full transition-colors opacity-60 hover:opacity-100 ${
              isDark ? 'bg-slate-700/50 hover:bg-red-500/20' : 'bg-gray-200/50 hover:bg-red-100'
            } flex items-center justify-center`}
          >
            <X className={`w-3 h-3 ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`} />
          </button>
        </div>
      </div>
      
      {!notification.persistent && (
        <div className={`absolute bottom-0 left-0 h-1 rounded-b-xl overflow-hidden w-full ${
          isDark ? 'bg-slate-700' : 'bg-gray-200'
        }`}>
          <div 
            className={`h-full ${colors.progress} rounded-b-xl transition-all duration-100 ease-linear`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

// CONTENEUR NOTIFICATIONS
const NotificationContainer = ({ notifications, onDismiss, isDark }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {notifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            notification={notification}
            onDismiss={onDismiss}
            isDark={isDark}
          />
        </div>
      ))}
    </div>
  );
};

// PROVIDER NOTIFICATIONS UNIFIÉ
export const NotificationProvider = ({ children, isDarkMode = false }) => {
  const [activeNotifications, setActiveNotifications] = useState([]);
  
  const isDark = isDarkMode;
  
  // ✅ FONCTION PRINCIPALE POUR CRÉER DES NOTIFICATIONS (sans doublons)
  const notify = (message, type = 'info', options = {}) => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      title: options.title,
      page: options.page,
      timestamp: new Date(),
      duration: options.duration || (type === 'error' ? 6000 : 4000),
      persistent: options.persistent || type === 'error',
      read: false
    };
    
    // ✅ Éviter les doublons récents (3 secondes)
    const isDuplicate = activeNotifications.some(n => 
      n.type === type && 
      n.message === message &&
      Date.now() - new Date(n.timestamp).getTime() < 3000
    );
    
    if (!isDuplicate) {
      setActiveNotifications(prev => [...prev, notification].slice(-5)); // Max 5 notifications
    } else {
      console.log('🚫 Notification dupliquée évitée:', message);
    }
    
    return notification.id;
  };

  const removeActiveNotification = (id) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setActiveNotifications([]);
  };

  // FONCTIONS SPÉCIALISÉES POUR CHAQUE TYPE
  const notifySuccess = (message, options = {}) => notify(message, 'success', options);
  const notifyError = (message, options = {}) => notify(message, 'error', options);
  const notifyWarning = (message, options = {}) => notify(message, 'warning', options);
  const notifyInfo = (message, options = {}) => notify(message, 'info', options);
  
  // NOTIFICATIONS CONTEXTUELLES PAR PAGE
  const notifyTask = (message, options = {}) => notify(message, 'task', { ...options, page: 'Tâches' });
  const notifySession = (message, options = {}) => notify(message, 'session', { ...options, page: 'Session' });
  const notifyAchievement = (message, options = {}) => notify(message, 'achievement', { 
    ...options, 
    duration: 8000, 
    persistent: true
  });

  // NOTIFICATIONS SPÉCIFIQUES
  const notifyDeadline = (taskTitle, timeLeft, priority = 'normal') => {
    const isUrgent = timeLeft.includes('aujourd\'hui') || timeLeft.includes('heure');
    const type = isUrgent ? 'warning' : 'info';
    const message = `"${taskTitle}" doit être terminée ${timeLeft}`;
    
    notify(message, type, {
      title: isUrgent ? '🚨 Échéance urgente' : '📅 Rappel d\'échéance',
      page: 'Tâches',
      persistent: isUrgent || priority === 'haute'
    });
  };

  const notifySessionComplete = (duration, taskTitle) => {
    notifyAchievement(
      `🎉 Session terminée ! "${taskTitle}" (${Math.round(duration)}min)`,
      { title: '🏆 Excellent travail !' }
    );
  };

  // CONNEXION AVEC LE SYSTÈME GLOBAL (pour compatibilité)
  useEffect(() => {
    // ✅ Exposer UNE SEULE fonction globalement
    window.addNotification = (type, message, duration) => {
      notify(message, type, { duration });
    };

    window.addTaskNotification = (options) => {
      if (typeof options === 'string') {
        notifyTask(options);
      } else {
        notify(options.message, options.type || 'task', {
          title: options.title,
          page: 'Tâches',
          persistent: options.persistent
        });
      }
    };

    return () => {
      delete window.addTaskNotification;
      delete window.addNotification;
    };
  }, []);
  
  const value = {
    activeNotifications,
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyTask,
    notifySession,
    notifyAchievement,
    notifyDeadline,
    notifySessionComplete,
    removeActiveNotification,
    clearAllNotifications
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={activeNotifications}
        onDismiss={removeActiveNotification}
        isDark={isDark}
      />
    </NotificationContext.Provider>
  );
};

// ===============================
// COMPOSANT LAYOUT PRINCIPAL
// ===============================
const Layout = ({ children, user, onLogout, onUserUpdate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };
  
  const notificationContext = useNotifications();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Vue d\'ensemble' },
    { name: 'Mes Tâches', href: '/tasks', icon: CheckSquare, description: 'Gérer vos tâches' },
    { name: 'Sessions Focus', href: '/sessions', icon: Play, description: 'Sessions Pomodoro' },
    { name: 'Mes Notes', href: '/notes', icon: BookOpen, description: 'Prendre des notes' },
    { name: 'Statistiques', href: '/stats', icon: BarChart3, description: 'Analyser vos performances' },
    { name: 'Calendrier', href: '/calendar', icon: Calendar, description: 'Planifier vos activités' },
  ];

  const getPageTitle = () => {
    if (showProfile) return 'Mon Profil';
    const currentNav = navigation.find(nav => nav.href === currentPath);
    return currentNav?.name || 'Dashboard';
  };

  const getPageIcon = () => {
    if (showProfile) return User;
    const currentNav = navigation.find(nav => nav.href === currentPath);
    return currentNav?.icon || Home;
  };

  const handleNavigation = (path) => {
    setShowProfile(false);
    setSidebarOpen(false);
    navigate(path);
  };

  const handleSettingsClick = () => {
    setShowProfile(true);
    setSidebarOpen(false);
  };

  const handleBackFromProfile = () => {
    setShowProfile(false);
  };

  const handleUserSave = (updatedUser) => {
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    notificationContext.notify('Profil mis à jour avec succès', 'success', { 
      title: '✅ Sauvegarde réussie',
      page: 'Profil' 
    });
  };

  if (showProfile) {
    return (
      <ProfileComponent 
        user={user} 
        onBack={handleBackFromProfile} 
        onSave={handleUserSave}
        darkMode={isDark}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} flex`}>
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-r transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-out`}>
        
        {/* Logo */}
        <div className={`flex items-center gap-3 h-16 px-6 border-b ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-white">FT</span>
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>FocusTâche</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assistant productivité</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href && !showProfile;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                }`}
                title={item.description}
              >
                <div className={`p-2 rounded-lg ${
                  isActive 
                    ? 'bg-indigo-500/20' 
                    : `${isDark ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-200 group-hover:bg-gray-300'}`
                } transition-colors duration-200`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 text-left">
                  <span className="font-semibold">{item.name}</span>
                  <p className={`text-xs mt-0.5 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>{item.description}</p>
                </div>
                
                {isActive && (
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={`p-4 border-t ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <div className={`flex items-center gap-3 p-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          } rounded-xl`}>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={`absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 ${
                isDark ? 'border-gray-800' : 'border-white'
              }`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              } truncate`}>
                {user?.nom || user?.name || 'Utilisateur'}
              </p>
              <p className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              } truncate`}>
                {user?.email || 'email@example.com'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'text-gray-400 hover:text-yellow-400 hover:bg-gray-600' 
                    : 'text-gray-500 hover:text-yellow-600 hover:bg-gray-200'
                }`}
                title={isDark ? 'Mode clair' : 'Mode sombre'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleSettingsClick}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title="Paramètres du profil"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={onLogout}
            className={`w-full mt-3 flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              isDark 
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20' 
                : 'text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200'
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Header */}
        <header className={`${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-b h-16 flex items-center gap-4 px-4 lg:px-6`}>
          
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-lg ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {React.createElement(getPageIcon(), { 
                className: `w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}` 
              })}
            </div>
            <div>
              <h1 className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {getPageTitle()}
              </h1>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'text-gray-400 hover:text-yellow-400 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-yellow-600 hover:bg-gray-100'
              }`}
              title={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleSettingsClick}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Ouvrir les paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// WRAPPER PRINCIPAL AVEC PROVIDER
const LayoutWithProviders = (props) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  return (
    <NotificationProvider isDarkMode={isDark}>
      <Layout {...props} />
    </NotificationProvider>
  );
};

export default LayoutWithProviders;