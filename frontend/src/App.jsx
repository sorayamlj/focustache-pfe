// src/App.jsx - VERSION COMPLÈTE
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginUnified from './components/Login';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Timer from './components/Timer';
import Stats from './components/Stats';
import Calendar from './components/Calendar';
import Layout from './components/Layout';
import Session from './components/Session';
import Notes from './components/Notes';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        // Vérifier que le token est encore valide
        const response = await fetch('http://localhost:5000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // Token invalide, nettoyer le localStorage
          handleLogout();
        }
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      // En cas d'erreur réseau, garder l'état local si possible
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (parseError) {
          handleLogout();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setAppError(null);
  };

  // Fonction de login (appelée depuis le composant Login)
  const handleLogin = (userData, token) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setAppError(null);
    } catch (error) {
      console.error('Erreur lors du login:', error);
      setAppError('Erreur lors de la connexion');
    }
  };

  // Gestion d'erreur globale
  const handleGlobalError = (error) => {
    console.error('Erreur globale:', error);
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      handleLogout();
    } else {
      setAppError(error.message);
    }
  };

  // Composant de chargement amélioré
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo animé */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl animate-ping opacity-20"></div>
        </div>
        
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        
        {/* Texte */}
        <div className="text-center">
          <p className="text-slate-400 text-lg font-medium mb-2">Chargement de FocusTâche...</p>
          <p className="text-slate-500 text-sm">Préparation de votre espace de travail</p>
        </div>
        
        {/* Points de progression */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  // Composant d'erreur globale
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
        
        <div className="flex gap-4">
          <button 
            onClick={onRetry}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
      </div>
    </div>
  );

  // Composant de route protégée
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
        onRetry={() => {
          setAppError(null);
          window.location.reload();
        }}
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
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              {/* Routes principales */}
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
                path="/timer" 
                element={
                  <ProtectedRoute>
                    <Timer onError={handleGlobalError} />
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
              
              {/* Routes de redirection et 404 */}
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        )}
      </div>
    </Router>
  );
};

export default App;