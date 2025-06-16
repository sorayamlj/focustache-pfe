import React, { useState } from 'react';

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
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset des erreurs
    setError('');

    // Validation de l'email
    if (!email.trim()) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Veuillez entrer une adresse Gmail valide (@gmail.com)');
      return;
    }

    // Vérifier qu'on ne partage pas avec soi-même
    const currentUserEmail = getCurrentUserEmail();
    if (email.trim().toLowerCase() === currentUserEmail?.toLowerCase()) {
      setError('Vous ne pouvez pas partager une tâche avec vous-même');
      return;
    }

    // Vérifier que l'utilisateur n'est pas déjà collaborateur
    if (task.owners && task.owners.includes(email.trim().toLowerCase())) {
      setError('Cet utilisateur collabore déjà sur cette tâche');
      return;
    }

    try {
      await onShare(task._id, email.trim());
      setEmail(''); // Reset du formulaire
      onClose(); // Fermer le modal
    } catch (err) {
      setError(err.message || 'Erreur lors du partage');
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail) => {
    if (window.confirm(`Retirer ${collaboratorEmail} de cette tâche ?`)) {
      try {
        await onShare(task._id, collaboratorEmail, 'remove');
      } catch (err) {
        setError(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  if (!isOpen || !task) return null;

  const collaborators = task.owners || [];
  const currentUserEmail = getCurrentUserEmail();
  
  console.log('Debug - Email utilisateur:', currentUserEmail);
  console.log('Debug - Collaborateurs:', collaborators);
  
  const isCollaborator = currentUserEmail && collaborators.includes(currentUserEmail); // N'importe quel collaborateur peut ajouter
  const isOwner = collaborators[0] === currentUserEmail; // Premier = propriétaire

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl">
        
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
          <div className="relative flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Collaboration</h2>
                <p className="text-slate-400 text-sm">"{task.titre}"</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Informations sur la tâche */}
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                task.priorite === 'haute' ? 'bg-red-500' :
                task.priorite === 'moyenne' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className="text-slate-300 text-sm">{task.module}</span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-400 text-xs">
                Échéance: {new Date(task.dateEcheance).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {task.description && (
              <p className="text-slate-300 text-sm">{task.description}</p>
            )}
          </div>

          {/* Collaborateurs actuels */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              Collaborateurs ({collaborators.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {collaborators.map((collaboratorEmail, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {collaboratorEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{collaboratorEmail}</p>
                      <p className="text-xs text-slate-400">
                        {collaboratorEmail === currentUserEmail ? 'Vous' : 'Collaborateur'}
                        {index === 0 && ' • Propriétaire'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Bouton de suppression (seulement le propriétaire peut retirer) */}
                  {isOwner && collaboratorEmail !== currentUserEmail && index !== 0 && (
                    <button
                      onClick={() => handleRemoveCollaborator(collaboratorEmail)}
                      className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      title="Retirer ce collaborateur (propriétaire uniquement)"
                    >
                      ×
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
                <label className="block text-sm font-semibold text-slate-300 mb-2 items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Inviter un nouveau collaborateur
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(''); // Effacer l'erreur lors de la saisie
                    }}
                    placeholder="exemple@gmail.com"
                    className={`w-full p-3 pl-10 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      error 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-white/10 focus:ring-purple-500/50'
                    }`}
                    disabled={isSharing}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    @
                  </div>
                </div>
                {error && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <span>×</span> {error}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-slate-400 text-xs flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Seules les adresses Gmail sont supportées
                  </p>
                  {!isOwner && (
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      Vous êtes collaborateur
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white font-medium rounded-lg transition-all duration-200"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={isSharing || !email.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-800 disabled:to-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  {isSharing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Invitation...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                      Inviter
                    </span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Message si pas collaborateur du tout */
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-slate-500 rounded-full"></div>
              </div>
              <p className="text-slate-400 text-sm mb-2">Accès refusé</p>
              <p className="text-slate-500 text-xs">
                Vous n'êtes pas collaborateur sur cette tâche
              </p>
            </div>
          )}

          {/* Stats de collaboration */}
          {collaborators.length > 1 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 text-center">
                Cette tâche est partagée avec {collaborators.length - 1} autre{collaborators.length > 2 ? 's' : ''} collaborateur{collaborators.length > 2 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskShareModal;