// src/components/Login.jsx - VERSION AVEC INSCRIPTION
import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState(''); // Pour l'inscription
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false); // État pour basculer

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const url = isRegisterMode ? 
        'http://127.0.0.1:5000/api/auth/register' : 
        'http://127.0.0.1:5000/api/auth/login';
      
      const body = isRegisterMode ? 
        { nom, email, password } : 
        { email, password };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegisterMode) {
          setMessage('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          // Basculer vers le mode connexion après inscription réussie
          setTimeout(() => {
            setIsRegisterMode(false);
            setMessage('');
            setNom('');
          }, 2000);
        } else {
          setMessage('Connexion réussie !');
          onLogin(data.user, data.token);
        }
      } else {
       setMessage(data.msg || `Erreur ${isRegisterMode ? "d'inscription" : 'de connexion'}`);

      }
    } catch (error) {
      setMessage('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setMessage('');
    setEmail('');
    setPassword('');
    setNom('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '0',
      margin: '0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      {/* Container principal avec largeur contrôlée */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        gap: '80px',
        padding: '40px'
      }}>
        
        {/* Section gauche - Présentation */}
        <div style={{
          padding: '60px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Logo et titre */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                backgroundColor: '#2563eb',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: '700',
                color: 'white'
              }}>
                F
              </div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                margin: '0',
                background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}>
                FocusTâche
              </h1>
            </div>
            <p style={{
              fontSize: '20px',
              color: '#94a3b8',
              margin: '0',
              fontWeight: '400'
            }}>
              La gestion de tâches pour étudiants
            </p>
          </div>

          {/* Description principale */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '24px',
              lineHeight: '1.25',
              letterSpacing: '-0.01em'
            }}>
              Organisez vos études, maximisez votre productivité et atteignez vos objectifs académiques
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#cbd5e1',
              lineHeight: '1.6',
              marginBottom: '0',
              fontWeight: '400'
            }}>
              Notre plateforme conçue spécialement pour les étudiants vous aide à gérer vos projets, révisions et deadlines de manière efficace.
            </p>
          </div>

          {/* Fonctionnalités */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '48px'
          }}>
            {[
              {
                title: 'Collaboration en équipe',
                desc: 'Partagez vos tâches avec vos collègues et travaillez ensemble'
              },
              {
                title: 'Notifications intelligentes',
                desc: 'Recevez des rappels par email et dans l\'application'
              },
              {
                title: 'Statistiques détaillées',
                desc: 'Analysez votre productivité par matière et par jour'
              },
              {
                title: 'Export PDF',
                desc: 'Exportez vos données vers Google Drive automatiquement'
              }
            ].map((feature, index) => (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  lineHeight: '1.5',
                  margin: '0',
                  fontWeight: '400'
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Statistiques */}
          <div style={{
            display: 'flex',
            gap: '40px',
            padding: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#3b82f6',
                lineHeight: '1',
                marginBottom: '8px'
              }}>
                500+
              </div>
              <div style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                Étudiants actifs
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#10b981',
                lineHeight: '1',
                marginBottom: '8px'
              }}>
                25h
              </div>
              <div style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                Temps économisé
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#10b981',
                lineHeight: '1',
                marginBottom: '8px'
              }}>
                94%
              </div>
              <div style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                Satisfaction
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire de connexion/inscription */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#1e293b',
            padding: '48px',
            borderRadius: '20px',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '12px',
                letterSpacing: '-0.01em'
              }}>
                {isRegisterMode ? 'Inscription' : 'Connexion'}
              </h2>
              <p style={{
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: '400'
              }}>
                {isRegisterMode ? 'Créez votre compte étudiant' : 'Connectez-vous à votre espace'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Champ Nom - seulement en mode inscription */}
              {isRegisterMode && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    color: '#cbd5e1',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required={isRegisterMode}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      fontWeight: '400'
                    }}
                    placeholder="Votre nom complet"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: '#cbd5e1',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  Adresse Gmail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontWeight: '400'
                  }}
                  placeholder="votre-email@gmail.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: '#cbd5e1',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontWeight: '400'
                  }}
                  placeholder={isRegisterMode ? 'Choisissez un mot de passe' : 'Votre mot de passe'}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isRegisterMode ? 
                    'linear-gradient(135deg, #10b981, #059669)' : 
                    'linear-gradient(135deg, #2563eb, #0891b2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  transform: isLoading ? 'none' : 'scale(1)',
                  boxShadow: isRegisterMode ? 
                    '0 8px 25px 0 rgba(16, 185, 129, 0.3)' : 
                    '0 8px 25px 0 rgba(37, 99, 235, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = isRegisterMode ? 
                      '0 12px 30px 0 rgba(16, 185, 129, 0.4)' : 
                      '0 12px 30px 0 rgba(37, 99, 235, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = isRegisterMode ? 
                      '0 8px 25px 0 rgba(16, 185, 129, 0.3)' : 
                      '0 8px 25px 0 rgba(37, 99, 235, 0.3)';
                  }
                }}
              >
                {isLoading ? 
                  (isRegisterMode ? 'Création...' : 'Connexion...') : 
                  (isRegisterMode ? 'Créer mon compte' : 'Se connecter')
                }
              </button>
            </form>

            {message && (
              <div style={{
                marginTop: '24px',
                padding: '16px 20px',
                borderRadius: '10px',
                backgroundColor: message.includes('réussie') || message.includes('succès') ?
                  'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${message.includes('réussie') || message.includes('succès') ?
                  'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                color: message.includes('réussie') || message.includes('succès') ? '#6ee7b7' : '#fca5a5',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: '500'
              }}>
                {message}
              </div>
            )}

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{
                color: '#94a3b8',
                fontSize: '15px',
                marginBottom: '20px',
                fontWeight: '400'
              }}>
                {isRegisterMode ? 'Déjà un compte ?' : 'Nouveau sur FocusTâche ?'}{' '}
                <span 
                  onClick={toggleMode}
                  style={{ 
                    color: '#3b82f6', 
                    cursor: 'pointer',
                    fontWeight: '500',
                    textDecoration: 'underline'
                  }}
                >
                  {isRegisterMode ? 'Se connecter' : 'Créer un compte'}
                </span>
              </p>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.15)'
              }}>
                <p style={{
                  color: '#93c5fd',
                  fontSize: '14px',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '500'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  Authentification sécurisée via Gmail uniquement
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version mobile - responsive */}
      <style>
        {`
          @media (max-width: 1024px) {
            .login-container {
              grid-template-columns: 1fr !important;
              gap: 40px !important;
              padding: 20px !important;
            }
            
            .login-left {
              text-align: center !important;
            }
            
            .features-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;