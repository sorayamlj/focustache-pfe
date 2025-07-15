// src/App.jsx - VERSION CORRIGÉE AVEC NOUVEAU LAYOUT
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './services/SessionContext';
import LoginUnified from './components/Login';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Stats from './components/Stats';
import Calendar from './components/Calendar';
import LayoutWithProviders from './components/Layout'; // ✅ Nouveau Layout
import Session from './components/Session';
import Notes from './components/Notes';
import Profile from './components/Profile';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);

  // Validation token
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Format token invalide');
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < (currentTime + 300)) {
        console.log('Token expiré ou expire bientôt');
        return false;
      }
      
      console.log('Token valide jusqu\'au:', new Date(payload.exp * 1000));
      return true;
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return false;
    }
  };

  // Vérification authentification
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Vérification authentification...');
      console.log('Token trouvé:', !!token);
      console.log('User data trouvé:', !!userData);
      
      if (token && userData && isTokenValid(token)) {
        console.log('Token valide côté client');
        
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(10000)
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Token validé côté serveur');
            
            const serverUser = result.user || result;
            setUser(serverUser);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(serverUser));
            
          } else if (response.status === 401) {
            console.log('Token rejeté par le serveur (401)');
            handleLogout();
          } else if (response.status === 404) {
            console.log('Route /me introuvable (404) - Tentative avec /profile');
            await tryProfileRoute(token, userData);
          } else {
            throw new Error(`Erreur serveur: ${response.status}`);
          }
        } catch (networkError) {
          console.log('Erreur réseau:', networkError.message);
          
          if (networkError.name === 'AbortError') {
            console.log('Timeout de connexion');
          }
          
          if (isTokenValid(token)) {
            console.log('Utilisation du cache local en mode hors ligne');
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            handleLogout();
          }
        }
      } else {
        console.log('Pas de token valide ou données manquantes');
        handleLogout();
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback vers /profile
  const tryProfileRoute = async (token, userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Token validé via /profile');
        const serverUser = result.user || result;
        setUser(serverUser);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(serverUser));
      } else {
        throw new Error('Route profile aussi inaccessible');
      }
    } catch (error) {
      console.log('Fallback /profile échoué, utilisation cache local');
      
      if (isTokenValid(token)) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        handleLogout();
      }
    }
  };

  // Logout
  const handleLogout = () => {
    console.log('Déconnexion en cours...');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('focustache_token');
    localStorage.removeItem('focustache_user');
    localStorage.removeItem('theme'); // ✅ Nettoyer aussi le thème
    
    setIsAuthenticated(false);
    setUser(null);
    setAppError(null);
    
    console.log('Déconnexion terminée');
  };

  // Login
  const handleLogin = (userData, token) => {
    try {
      console.log('Connexion en cours:', userData);
      
      if (!token || !userData) {
        throw new Error('Token ou données utilisateur manquants');
      }

      if (!isTokenValid(token)) {
        throw new Error('Token reçu invalide');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setAppError(null);
      
      console.log('Connexion réussie et persistée');
    } catch (error) {
      console.error('Erreur lors du login:', error);
      setAppError(`Erreur lors de la connexion: ${error.message}`);
    }
  };

  // Mise à jour utilisateur
  const handleUserUpdate = (updatedUser) => {
    console.log('Mise à jour utilisateur dans App:', updatedUser);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Gestion d'erreur globale
  const handleGlobalError = (error) => {
    console.error('Erreur globale:', error);
    
    if (error.message.includes('401') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('Token invalide')) {
      console.log('Erreur d\'authentification détectée');
      handleLogout();
    } else if (error.message.includes('Network') || 
               error.message.includes('fetch')) {
      console.log('Erreur réseau détectée - pas de déconnexion');
      setAppError('Problème de connexion réseau. Vérifiez votre connexion.');
    } else {
      setAppError(error.message);
    }
  };

  // Reconnexion automatique
  const attemptReconnection = async () => {
    console.log('Tentative de reconnexion...');
    setAppError(null);
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await checkAuthentication();
  };

  // Écouter les changements de connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connexion rétablie');
      if (isAuthenticated && appError?.includes('réseau')) {
        attemptReconnection();
      }
    };

    const handleOffline = () => {
      console.log('Connexion perdue');
      setAppError('Mode hors ligne - fonctionnalités limitées');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, appError]);

  // Composant de chargement
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-2xl animate-ping opacity-20"></div>
        </div>
        
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-green-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        
        <div className="text-center">
          <p className="text-slate-400 text-lg font-medium mb-2">Chargement de FocusTâche...</p>
          <p className="text-slate-500 text-sm">Vérification de votre authentification</p>
          <p className="text-slate-600 text-xs mt-2">Session persistante activée</p>
        </div>
        
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  // ErrorBoundary avec reconnexion
  const ErrorBoundary = ({ error, onRetry, onLogout }) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 p-4 bg-red-500/20 rounded-full">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.858 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">Oups ! Une erreur s'est produite</h2>
        <p className="text-red-300 mb-6">{error}</p>
        
        {error.includes('réseau') && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              Vérifiez votre connexion internet ou que le serveur est démarré sur le port 5000
            </p>
          </div>
        )}
        
        <div className="flex gap-4">
          <button 
            onClick={onRetry}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Réessayer
          </button>
          <button 
            onClick={onLogout}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Se déconnecter
          </button>
        </div>
        
        {error.includes('réseau') && (
          <p className="text-slate-500 text-xs mt-4">
            Nouvelle tentative automatique dans quelques secondes...
          </p>
        )}
      </div>
    </div>
  );

  // Route protégée
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // États de chargement et d'erreur
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (appError) {
    return (
      <ErrorBoundary 
        error={appError} 
        onRetry={attemptReconnection}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-slate-900">
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<LoginUnified onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <SessionProvider>
            <LayoutWithProviders 
              user={user} 
              onLogout={handleLogout}
              onUserUpdate={handleUserUpdate}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard user={user} onError={handleGlobalError} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/tasks" 
                  element={
                    <ProtectedRoute>
                      <TaskList onError={handleGlobalError} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/sessions" 
                  element={
                    <ProtectedRoute>
                      <Session onError={handleGlobalError} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/notes" 
                  element={
                    <ProtectedRoute>
                      <Notes onError={handleGlobalError} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile user={user} onUserUpdate={handleUserUpdate} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/stats" 
                  element={
                    <ProtectedRoute>
                      <Stats onError={handleGlobalError} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/calendar" 
                  element={
                    <ProtectedRoute>
                      <Calendar onError={handleGlobalError} />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </LayoutWithProviders>
          </SessionProvider>
        )}
      </div>
    </Router>
  );
};

export default App;