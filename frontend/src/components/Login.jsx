// src/components/Login.jsx - VERSION SIMPLIFIÉE
import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [studentInfo, setStudentInfo] = useState({
    university: '',
    faculty: '',
    city: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Universités marocaines
  const universities = [
    'Université Mohammed V Rabat',
    'Université Hassan II Casablanca',
    'Université Cadi Ayyad Marrakech',
    'Université Sidi Mohamed Ben Abdellah Fès',
    'Université Mohammed Premier Oujda',
    'Université Ibn Tofail Kenitra',
    'Université Abdelmalek Essaadi Tétouan',
    'Université Moulay Ismail Meknès',
    'Al Akhawayn University',
    'Université Internationale de Rabat (UIR)',
    'EMSI'
  ];

  const cities = ['Rabat', 'Casablanca', 'Marrakech', 'Fès', 'Oujda', 'Kenitra', 'Tétouan', 'Meknès', 'Agadir', 'Tanger'];

  // ✅ VALIDATION EMAIL CÔTÉ FRONTEND
  const validateEmailSimple = (email) => {
    if (!email) return { isValid: false, reason: 'Email requis', type: null };

    const emailLower = email.toLowerCase().trim();
    
    // Format de base
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return { isValid: false, reason: 'Format d\'email invalide', type: null };
    }

    // Gmail accepté
    if (emailLower.endsWith('@gmail.com')) {
      return { isValid: true, type: 'gmail', reason: 'Gmail détecté' };
    }

    // Universités marocaines
    const universityDomains = [
      '.ac.ma', '@aui.ma', '@emsi.ma', '@uir.ac.ma'
    ];
    
    const isUniversity = universityDomains.some(domain => emailLower.includes(domain));
    if (isUniversity) {
      return { isValid: true, type: 'university', reason: 'Email universitaire détecté' };
    }

    return { 
      isValid: false, 
      reason: 'Seuls Gmail et emails universitaires marocains acceptés',
      type: null
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // ✅ VALIDATION EMAIL
    const emailCheck = validateEmailSimple(email);
    if (!emailCheck.isValid) {
      setMessage(`❌ ${emailCheck.reason}`);
      setIsLoading(false);
      return;
    }

    try {
      const url = isRegisterMode ? 
        'http://localhost:5000/api/auth/register' : 
        'http://localhost:5000/api/auth/login';
      
      const body = isRegisterMode ? 
        { nom, email, password, studentInfo } : 
        { email, password };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg);
        
        // Connexion automatique après inscription/connexion réussie
        setTimeout(() => {
          onLogin(data.user, data.token);
        }, 1500);
      } else {
        setMessage(data.msg || `Erreur ${isRegisterMode ? "d'inscription" : 'de connexion'}`);
      }
    } catch (error) {
      setMessage('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNom('');
    setStudentInfo({ university: '', faculty: '', city: '' });
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setMessage('');
    resetForm();
  };

  // Obtenir l'état de l'email
  const emailStatus = validateEmailSimple(email);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'center'
      }}>
        
        {/* Section gauche - Présentation */}
        <div style={{ padding: '40px' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#2563eb',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                FT
              </div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                margin: '0',
                background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                FocusTâche
              </h1>
            </div>
            <p style={{
              fontSize: '18px',
              color: '#94a3b8',
              margin: '0'
            }}>
              🇲🇦 Gestion de tâches pour étudiants marocains
            </p>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '20px',
              lineHeight: '1.3'
            }}>
              Organisez vos études universitaires facilement
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#cbd5e1',
              lineHeight: '1.6'
            }}>
              Gérez vos cours, TD, TP, devoirs, révisions et projets.
              Simple, efficace et adapté aux universités marocaines.
            </p>
          </div>

      
        </div>

        {/* Section droite - Formulaire */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#1e293b',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '8px'
              }}>
                {isRegisterMode ? 'Inscription' : 'Connexion'}
              </h2>
              <p style={{
                color: '#94a3b8',
                fontSize: '14px'
              }}>
                {isRegisterMode ? 'Créez votre compte étudiant' : 'Accédez à votre espace'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Champs inscription */}
              {isRegisterMode && (
                <>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required={isRegisterMode}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder="Nom complet"
                  />

                  {/* CNE - Supprimé */}

                  <select
                    value={studentInfo.university}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, university: e.target.value }))}
                    required={isRegisterMode}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="" style={{ color: '#000' }}>Université</option>
                    {universities.map(uni => (
                      <option key={uni} value={uni} style={{ color: '#000' }}>{uni}</option>
                    ))}
                  </select>

          

            
                </>
              )}

              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${emailStatus.isValid ? '#16a34a' : 
                    email ? '#dc2626' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Email (Gmail ou universitaire)"
              />

              {/* ✅ INDICATEUR EMAIL */}
              {email && (
                <div style={{
                  fontSize: '12px',
                  marginBottom: '16px',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: emailStatus.isValid ? 
                    'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: emailStatus.isValid ? '#10b981' : '#ef4444'
                }}>
                  {emailStatus.isValid ? 
                    `✅ ${emailStatus.reason}` : 
                    `❌ ${emailStatus.reason}`
                  }
                </div>
              )}

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Mot de passe"
              />

              <button
                type="submit"
                disabled={isLoading || (email && !emailStatus.isValid)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: (isLoading || (email && !emailStatus.isValid)) ? 
                    '#4b5563' : 'linear-gradient(135deg, #2563eb, #0891b2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (isLoading || (email && !emailStatus.isValid)) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || (email && !emailStatus.isValid)) ? 0.7 : 1
                }}
              >
                {isLoading ? 
                  (isRegisterMode ? 'Inscription...' : 'Connexion...') : 
                  (isRegisterMode ? 'S\'inscrire' : 'Se connecter')
                }
              </button>
            </form>

            {message && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: message.includes('succès') || message.includes('réussie') || message.includes('🎓') || message.includes('📧') ?
                  'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${message.includes('succès') || message.includes('réussie') || message.includes('🎓') || message.includes('📧') ?
                  'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                color: message.includes('succès') || message.includes('réussie') || message.includes('🎓') || message.includes('📧') ? '#6ee7b7' : '#fca5a5',
                textAlign: 'center',
                fontSize: '13px'
              }}>
                {message}
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{
                color: '#94a3b8',
                fontSize: '14px'
              }}>
                {isRegisterMode ? 'Déjà inscrit ?' : 'Nouveau sur FocusTâche ?'}{' '}
                <span 
                  onClick={toggleMode}
                  style={{ 
                    color: '#3b82f6', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isRegisterMode ? 'Se connecter' : 'S\'inscrire'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>
        {`
          @media (max-width: 1024px) {
            div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
              gap: 40px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;