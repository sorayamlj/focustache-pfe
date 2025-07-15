import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Plus,
  UserMinus,
  Mail,
  Crown,
  User,
  AlertCircle
} from 'lucide-react';

// Fonction utilitaire pour décoder le JWT et récupérer l'email
const getCurrentUserEmail = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Décoder le JWT (partie payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || null;
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
};

const TaskShareModal = ({ task, isOpen, onClose, onShare, isSharing }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Veuillez entrer une adresse email';
      setErrors(newErrors);
      return false;
    }

    const emailTrimmed = email.trim().toLowerCase();

    if (!validateEmail(emailTrimmed)) {
      newErrors.email = 'Veuillez entrer une adresse Gmail valide (@gmail.com)';
      setErrors(newErrors);
      return false;
    }

    // Vérifier qu'on ne partage pas avec soi-même
    const currentUserEmail = getCurrentUserEmail();
    if (emailTrimmed === currentUserEmail?.toLowerCase()) {
      newErrors.email = 'Vous ne pouvez pas partager une tâche avec vous-même';
      setErrors(newErrors);
      return false;
    }

    // Vérifier que l'utilisateur n'est pas déjà collaborateur
    const taskOwners = (task.owners || []).map(owner => owner.toLowerCase());
    if (taskOwners.includes(emailTrimmed)) {
      newErrors.email = 'Cet utilisateur collabore déjà sur cette tâche';
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();

    try {
      console.log('Debug - Tentative de partage:', { taskId: task._id, email: emailTrimmed });
      await onShare(task._id, emailTrimmed, 'add');
      setEmail(''); // Reset du formulaire seulement si succès
      setErrors({});
      // Le modal sera fermé par handleShare si succès
    } catch (err) {
      console.error('❌ Erreur dans handleSubmit:', err);
      if (err instanceof Error) {
        setErrors({ email: err.message });
      } else {
        setErrors({ email: 'Une erreur inconnue est survenue.' });
      }
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail) => {
    if (window.confirm(`Retirer ${collaboratorEmail} de cette tâche ?`)) {
      try {
        setErrors({}); // Reset des erreurs
        console.log('Debug - Suppression collaborateur:', { taskId: task._id, email: collaboratorEmail });
        await onShare(task._id, collaboratorEmail, 'remove');
      } catch (err) {
        console.error('Erreur suppression collaborateur:', err);
        setErrors({ general: err.message || 'Erreur lors de la suppression' });
      }
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };
  
  if (!isOpen || !task) return null;

  const collaborators = task.owners || [];
  const currentUserEmail = getCurrentUserEmail();
  
  console.log('Debug - Email utilisateur:', currentUserEmail);
  console.log('Debug - Collaborateurs:', collaborators);
  
  const isCollaborator = currentUserEmail && collaborators.includes(currentUserEmail);
  const isOwner = collaborators[0] === currentUserEmail;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Collaboration</h2>
              <p className="text-gray-400 text-sm">"{task.titre}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 space-y-4">
            
            {/* Informations sur la tâche */}
            <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  task.priorite === 'haute' ? 'bg-red-500' :
                  task.priorite === 'moyenne' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="text-gray-300 text-sm font-medium">{task.module}</span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-400 text-xs">
                  Échéance: {new Date(task.dateEcheance).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {task.description && (
                <p className="text-gray-300 text-sm">{task.description}</p>
              )}
            </div>

            {/* Message d'erreur général */}
            {errors.general && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Collaborateurs actuels */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Collaborateurs actuels ({collaborators.length})
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {collaborators.map((collaboratorEmail, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        index === 0 ? 'bg-yellow-600' : 'bg-purple-400'
                      }`}>
                        {index === 0 ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{collaboratorEmail}</p>
                        <p className="text-xs text-gray-400">
                          {collaboratorEmail === currentUserEmail ? 'Vous' : 'Collaborateur'}
                          {index === 0 && ' • Propriétaire'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Bouton de suppression (seulement le propriétaire peut retirer) */}
                    {isOwner && collaboratorEmail !== currentUserEmail && index !== 0 && (
                      <button
                        onClick={() => handleRemoveCollaborator(collaboratorEmail)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                        title="Retirer ce collaborateur"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire d'ajout - Tous les collaborateurs peuvent ajouter */}
            {isCollaborator ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Inviter un nouveau collaborateur *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleInputChange}
                      placeholder="exemple@gmail.com"
                      className={`w-full p-3 pl-10 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-600'
                      }`}
                      disabled={isSharing}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-400 text-xs">
                      Seules les adresses Gmail sont supportées
                    </p>
                    {!isOwner && (
                      <p className="text-xs text-amber-400">
                        Vous êtes collaborateur
                      </p>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              /* Message si pas collaborateur du tout */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-400 text-lg font-medium mb-2">Accès refusé</p>
                <p className="text-gray-500 text-sm">
                  Vous n'êtes pas collaborateur sur cette tâche
                </p>
              </div>
            )}

            {/* Stats de collaboration */}
            {collaborators.length > 1 && (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 text-center">
                  Cette tâche est partagée avec {collaborators.length - 1} autre{collaborators.length > 2 ? 's' : ''} collaborateur{collaborators.length > 2 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer avec boutons */}
        {isCollaborator && (
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium rounded border border-gray-600"
              >
                Fermer
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSharing || !email.trim()}
                className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium rounded"
              >
                {isSharing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Invitation...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Inviter</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskShareModal;