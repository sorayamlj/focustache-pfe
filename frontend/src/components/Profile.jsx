// src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { profileApi } from '../services/profileApi';

const Profile = ({ user }) => {
  const { theme, toggleTheme } = useTheme();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
    school: user?.school || '',
    level: user?.level || '',
    subjects: user?.subjects || [],
    goals: user?.goals || [],
    preferences: {
      notifications: true,
      emailNotifications: true,
      soundEnabled: true,
      language: 'fr',
      timezone: 'Europe/Paris',
      pomodoroLength: 25,
      shortBreak: 5,
      longBreak: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false
    },
    stats: {
      totalTasks: 0,
      completedTasks: 0,
      totalFocusTime: 0,
      streak: 0,
      level: 1,
      experience: 0
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const data = await profileApi.getProfile();
      setProfileData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await profileApi.updateProfile(profileData);
      setMessage('Profil mis à jour avec succès !');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erreur lors de la mise à jour');
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const addSubject = (subject) => {
    if (subject && !profileData.subjects.includes(subject)) {
      setProfileData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subject]
      }));
    }
  };

  const removeSubject = (subject) => {
    setProfileData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const addGoal = (goal) => {
    if (goal && !profileData.goals.includes(goal)) {
      setProfileData(prev => ({
        ...prev,
        goals: [...prev.goals, goal]
      }));
    }
  };

  const removeGoal = (goal) => {
    setProfileData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g !== goal)
    }));
  };

  // Icônes
  const UserIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const CogIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const SaveIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const tabs = [
    { id: 'profile', label: 'Profil', icon: <UserIcon /> },
    { id: 'preferences', label: 'Préférences', icon: <CogIcon /> },
    { id: 'stats', label: 'Statistiques', icon: <ChartIcon /> }
  ];

  const baseClasses = theme === 'dark' 
    ? 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white'
    : 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900';

  const cardClasses = theme === 'dark'
    ? 'bg-slate-800/80 backdrop-blur-xl border border-slate-600/20'
    : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl';

  const inputClasses = theme === 'dark'
    ? 'bg-slate-700/50 border-slate-600/30 text-white placeholder-slate-400'
    : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500';

  return (
    <div className={baseClasses}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mon Profil</h1>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
                Gérez vos informations personnelles et préférences
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Toggle Mode Sombre/Clair */}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-slate-700/20 text-slate-700 hover:bg-slate-700/30'
                }`}
              >
                {theme === 'dark' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              {/* Bouton Edit/Save */}
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isEditing
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : isEditing ? (
                  <>
                    <SaveIcon />
                    Sauvegarder
                  </>
                ) : (
                  <>
                    <EditIcon />
                    Modifier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Message de succès/erreur */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.includes('succès') 
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Navigation par onglets */}
        <div className="mb-8">
          <div className={`flex space-x-1 ${cardClasses} rounded-2xl p-2`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="space-y-8">
          {/* Onglet Profil */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Informations personnelles */}
              <div className="lg:col-span-2">
                <div className={`${cardClasses} rounded-3xl p-8`}>
                  <h2 className="text-2xl font-bold mb-6">Informations personnelles</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClasses} transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500`}
                        placeholder="Votre nom complet"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClasses} transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500`}
                        placeholder="votre@email.com"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        École/Université
                      </label>
                      <input
                        type="text"
                        value={profileData.school}
                        onChange={(e) => handleInputChange('school', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClasses} transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500`}
                        placeholder="Nom de votre établissement"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        Niveau d'études
                      </label>
                      <select
                        value={profileData.level}
                        onChange={(e) => handleInputChange('level', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClasses} transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500`}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="college">Collège</option>
                        <option value="lycee">Lycée</option>
                        <option value="licence">Licence</option>
                        <option value="master">Master</option>
                        <option value="doctorat">Doctorat</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className={`block text-sm font-semibold mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      Biographie
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border ${inputClasses} transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none`}
                      placeholder="Parlez-nous de vous..."
                    />
                  </div>
                </div>
              </div>

              {/* Avatar et statistiques rapides */}
              <div className="space-y-6">
                {/* Avatar */}
                <div className={`${cardClasses} rounded-3xl p-8 text-center`}>
                  <div className="relative inline-block mb-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                        <EditIcon />
                      </button>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{profileData.name || 'Utilisateur'}</h3>
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
                    {profileData.level || 'Niveau non défini'}
                  </p>
                </div>

                {/* Statistiques rapides */}
                <div className={`${cardClasses} rounded-3xl p-8`}>
                  <h3 className="text-lg font-bold mb-4">Statistiques</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>Niveau</span>
                      <span className="font-bold">{profileData.stats.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>Série</span>
                      <span className="font-bold">{profileData.stats.streak} jours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>Tâches terminées</span>
                      <span className="font-bold">{profileData.stats.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>Temps de focus</span>
                      <span className="font-bold">{Math.floor(profileData.stats.totalFocusTime / 60)}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Préférences */}
          {activeTab === 'preferences' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Notifications */}
              <div className={`${cardClasses} rounded-3xl p-8`}>
                <h3 className="text-xl font-bold mb-6">Notifications</h3>
                <div className="space-y-4">
                  {[
                    { key: 'notifications', label: 'Notifications push' },
                    { key: 'emailNotifications', label: 'Notifications email' },
                    { key: 'soundEnabled', label: 'Sons activés' }
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between">
                      <span>{pref.label}</span>
                      <button
                        onClick={() => handlePreferenceChange(pref.key, !profileData.preferences[pref.key])}
                        disabled={!isEditing}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          profileData.preferences[pref.key]
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                            : theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                          profileData.preferences[pref.key] ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paramètres Pomodoro */}
              <div className={`${cardClasses} rounded-3xl p-8`}>
                <h3 className="text-xl font-bold mb-6">Paramètres Pomodoro</h3>
                <div className="space-y-4">
                  {[
                    { key: 'pomodoroLength', label: 'Durée Pomodoro (min)', min: 15, max: 60 },
                    { key: 'shortBreak', label: 'Pause courte (min)', min: 3, max: 15 },
                    { key: 'longBreak', label: 'Pause longue (min)', min: 10, max: 30 }
                  ].map((setting) => (
                    <div key={setting.key}>
                      <label className={`block text-sm font-semibold mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        {setting.label}
                      </label>
                      <input
                        type="range"
                        min={setting.min}
                        max={setting.max}
                        value={profileData.preferences[setting.key]}
                        onChange={(e) => handlePreferenceChange(setting.key, parseInt(e.target.value))}
                        disabled={!isEditing}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-slate-400 mt-1">
                        <span>{setting.min}</span>
                        <span className="font-bold">{profileData.preferences[setting.key]}</span>
                        <span>{setting.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Statistiques */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`${cardClasses} rounded-3xl p-8`}>
                <h3 className="text-xl font-bold mb-6">Progression</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Expérience</span>
                      <span>{profileData.stats.experience}/1000 XP</span>
                    </div>
                    <div className={`w-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-3`}>
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(profileData.stats.experience / 1000) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100/50'} rounded-xl p-4 text-center`}>
                      <div className="text-2xl font-bold text-blue-500">{profileData.stats.completedTasks}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Tâches terminées</div>
                    </div>
                    <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100/50'} rounded-xl p-4 text-center`}>
                      <div className="text-2xl font-bold text-purple-500">{profileData.stats.streak}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Jours consécutifs</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${cardClasses} rounded-3xl p-8`}>
                <h3 className="text-xl font-bold mb-6">Temps de focus</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">
                    {Math.floor(profileData.stats.totalFocusTime / 60)}h {profileData.stats.totalFocusTime % 60}m
                  </div>
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
                    Temps total de concentration
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;