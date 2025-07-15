// Profile.jsx - Composant Profile sans avatar - Version finale
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  User,
  Save,
  Edit3,
  Trash2,
  X
} from 'lucide-react';

// Composant Profile étendu - VERSION FINALE CORRIGÉE
const ProfileComponent = ({ user, onBack, onSave, darkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.nom || user?.name || '',
    email: user?.email || '',
    university: user?.studentInfo?.university || '',
    });

  // Mettre à jour formData quand user change
  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || user.name || '',
        email: user.email || '',
        university: user.studentInfo?.university || '',
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fonction de sauvegarde corrigée avec debug complet
  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }

      console.log('💾 Sauvegarde profil...');
      console.log('📝 Données à sauver:', formData);

      // Préparer les données à envoyer
      const updateData = {
        nom: formData.nom,
        studentInfo: {
          university: formData.university,
          faculty: formData.faculty,
          city: formData.city,
          academicYear: formData.academicYear,
          bio: formData.bio
        }
      };

      // Ajouter le CNE seulement si c'est un compte Gmail
      if (user?.emailType === 'gmail' && formData.cne) {
        updateData.studentInfo.cne = formData.cne;
      }

      console.log('📦 Données formatées:', updateData);

      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      console.log('📊 Statut réponse:', response.status);
      console.log('📊 Headers réponse:', response.headers.get('content-type'));

      // Lire la réponse comme texte d'abord
      const responseText = await response.text();
      console.log('📄 Réponse brute:', responseText);

      // Essayer de parser en JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ JSON parsé:', data);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        console.error('📄 Contenu reçu:', responseText);
        throw new Error(`Réponse serveur invalide (${response.status}): ${responseText.substring(0, 100)}...`);
      }

      if (response.ok && data.success) {
        console.log('✅ Profil sauvegardé avec succès');
        
        // Appeler la fonction onSave du parent pour mettre à jour l'état global
        if (onSave) {
          onSave(data.user);
        }
        
        setIsEditing(false);
        alert('✅ Profil mis à jour avec succès !');
      } else {
        console.error('❌ Erreur serveur:', data);
        throw new Error(data?.msg || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde profil:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Fonction de suppression de compte
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      return;
    }

    setDeleteLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      console.log('🗑️ Tentative de suppression du compte...');
      console.log('🔑 Token présent:', !!token);
      console.log('🔑 Token (20 premiers chars):', token.substring(0, 20) + '...');
      
      // URL corrigée pour correspondre au serveur backend
      const baseUrl = window.location.origin.replace('5173', '5000');
      const fullUrl = `${baseUrl}/api/auth/delete-account`;
      console.log('🌐 URL appelée:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Statut réponse:', response.status);
      console.log('📊 URL réponse:', response.url);
      console.log('📊 Headers réponse:', response.headers.get('content-type'));

      // Lire la réponse comme texte d'abord
      const responseText = await response.text();
      console.log('📄 Réponse brute:', responseText);

      // Essayer de parser en JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ JSON parsé:', data);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        
        // Si c'est un 200 mais pas de JSON, considérer comme succès
        if (response.status === 200) {
          console.log('✅ Suppression réussie (200 OK sans JSON)');
          
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.clear();
          
          alert('✅ Votre compte a été supprimé avec succès.');
          window.location.href = '/';
          return;
        }
        
        throw new Error(`Réponse serveur invalide (${response.status}): ${responseText}`);
      }

      // Si on a du JSON et que la réponse est OK
      if (response.ok && data) {
        console.log('✅ Suppression réussie avec JSON:', data);
        
        // Supprimer toutes les données locales
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Notification de succès
        alert(`✅ ${data.msg || 'Votre compte a été supprimé avec succès.'}`);
        
        // Redirection
        window.location.href = '/';
      } else {
        // Erreur avec JSON
        console.error('❌ Erreur du serveur:', data);
        throw new Error(data?.msg || `Erreur ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur complète suppression compte:', error);
      
      // Messages d'erreur détaillés
      let errorMessage = 'Erreur lors de la suppression du compte';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le serveur backend est démarré.';
      } else if (error.message.includes('401') || error.message.includes('Token')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      } else if (error.message.includes('404')) {
        errorMessage = 'Route de suppression non trouvée. Vérifiez la configuration du serveur.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Accès refusé. Vérifiez vos permissions.';
      } else {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  // Modal de confirmation de suppression
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className={`${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-xl max-w-md w-full p-6`}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              Supprimer le compte
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Pour confirmer, tapez <span className="font-bold text-red-500">SUPPRIMER</span> :
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER"
                className={`w-full p-3 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
              disabled={deleteLoading}
              className={`flex-1 px-4 py-3 border rounded-lg transition-colors ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                deleteConfirmText === 'SUPPRIMER' && !deleteLoading
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
            >
              {deleteLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Supprimer définitivement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} mb-4`}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Mon Profil</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gérez vos informations personnelles</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'Sauvegarder' : 'Modifier'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profil Principal */}
          <div className="lg:col-span-2">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Informations personnelles</h2>
              
              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formData.nom || 'Utilisateur'}
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formData.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Nom complet</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } ${!isEditing && 'opacity-70'}`}
                    placeholder="Votre nom complet"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className={`w-full p-3 border rounded opacity-50 cursor-not-allowed ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Université</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } ${!isEditing && 'opacity-70'}`}
                    placeholder="Votre université"
                  />
                </div>
              </div>    
              {isEditing && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                      saveLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {saveLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Réinitialiser les données
                      setFormData({
                        nom: user?.nom || user?.name || '',
                        email: user?.email || '',
                        university: user?.studentInfo?.university || '',
                        
                      });
                    }}
                    disabled={saveLoading}
                    className={`px-6 py-3 border rounded-lg transition-colors ${
                      saveLoading 
                        ? 'opacity-50 cursor-not-allowed' 
                        : `${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar avec actions */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Supprimer le compte</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de confirmation */}
        <DeleteConfirmationModal />
      </div>
    </div>
  );
};

export default ProfileComponent;