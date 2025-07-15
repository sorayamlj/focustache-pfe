import React, { useState } from 'react';
import { 
  Edit3, 
  Plus, 
  X, 
  Upload,
  Info
} from 'lucide-react';

const TaskForm = ({ editingTask, onSubmit, onClose, isSubmitting, attachedFile, setAttachedFile, uploadingFile, setUploadingFile }) => {
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    titre: editingTask?.titre || '',
    description: editingTask?.description || '',
    module: editingTask?.module || '',
    priorite: editingTask?.priorite || 'moyenne',
    statut: editingTask?.statut || 'à faire',
    dateEcheance: editingTask?.dateEcheance ? editingTask.dateEcheance.split('T')[0] : getTodayDate(),
    categorie: editingTask?.categorie || 'universitaire',
    lien: editingTask?.lien || '',
    fichierUrl: editingTask?.fichierUrl || ''
  });

  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (editingTask?.fichierUrl) {
      setAttachedFile(editingTask.fichierUrl);
      setFormData(prev => ({
        ...prev,
        fichierUrl: editingTask.fichierUrl
      }));
    } else {
      setAttachedFile(null);
      setFormData(prev => ({
        ...prev,
        fichierUrl: ''
      }));
    }
  }, [editingTask]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est obligatoire';
    }
    
    if (!formData.module.trim()) {
      newErrors.module = 'Le module est obligatoire';
    }
    
    if (!formData.dateEcheance) {
      newErrors.dateEcheance = 'La date d\'échéance est obligatoire';
    }
    
    if (formData.lien && !isValidUrl(formData.lien)) {
      newErrors.lien = 'Veuillez entrer une URL valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string.startsWith('http') ? string : `https://${string}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setUploadingFile(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      setAttachedFile(result.fileUrl);
      setFormData(prev => ({
        ...prev,
        fichierUrl: result.fileUrl
      }));
      
      alert('Fichier uploadé avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    onSubmit(formData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              {editingTask ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingTask ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
              </h2>
            
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 space-y-4">
            
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titre de la tâche *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                required
                className={`w-full p-3 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.titre ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Ex: Réviser le cours d'algorithmique"
              />
              {errors.titre && (
                <p className="text-red-400 text-sm mt-1">{errors.titre}</p>
              )}
            </div>

        
            {/* Module et Priorité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Module *
                </label>
                <input
                  type="text"
                  name="module"
                  value={formData.module}
                  onChange={handleInputChange}
                  required
                  className={`w-full p-3 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.module ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Ex: Mathématiques, Informatique..."
                />
                {errors.module && (
                  <p className="text-red-400 text-sm mt-1">{errors.module}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priorité *
                </label>
                <select
                  name="priorite"
                  value={formData.priorite}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                </select>
              </div>
            </div>

            {/* Date d'échéance et Statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  name="dateEcheance"
                  value={formData.dateEcheance}
                  onChange={handleInputChange}
                  required
                  className={`w-full p-3 bg-gray-700 border rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.dateEcheance ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.dateEcheance && (
                  <p className="text-red-400 text-sm mt-1">{errors.dateEcheance}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Statut *
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="à faire">À faire</option>
                  <option value="en cours">En cours</option>
                  <option value="terminée">Terminée</option>
                </select>
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Catégorie *
              </label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="universitaire">Universitaire</option>
                <option value="para-universitaire">Para-universitaire</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {formData.categorie === 'universitaire' 
                  ? 'Activité liée aux études formelles' 
                  : 'Activité complémentaire (clubs, associations, etc.)'
                }
              </p>
            </div>

            {/* Lien externe */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lien externe (optionnel)
              </label>
              <input
                type="url"
                name="lien"
                value={formData.lien}
                onChange={handleInputChange}
                className={`w-full p-3 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.lien ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="https://example.com"
              />
              {errors.lien && (
                <p className="text-red-400 text-sm mt-1">{errors.lien}</p>
              )}
            </div>

            {/* Upload de fichier */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fichier attaché (optionnel)
              </label>
              
              {attachedFile && (
                <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 rounded mb-3">
                  <div className="w-8 h-8 bg-green-500/30 rounded flex items-center justify-center">
                    <span className="text-green-400">📎</span>
                  </div>
                  <div className="flex-1">
                    <a
                      href={attachedFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-300 hover:text-green-200 font-medium"
                    >
                      Fichier attaché
                    </a>
                    <p className="text-green-400/70 text-xs">Cliquez pour ouvrir</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFile(null);
                      setFormData(prev => ({
                        ...prev,
                        fichierUrl: ''
                      }));
                    }}
                    className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white file:font-medium hover:file:bg-green-700 file:cursor-pointer"
                />
                
                {uploadingFile && (
                  <div className="absolute inset-0 bg-gray-700/80 rounded flex items-center justify-center">
                    <div className="flex items-center gap-2 text-green-400">
                      <Upload className="w-4 h-4 animate-pulse" />
                      <span className="font-medium">Upload en cours...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Formats supportés: PDF, Word, Images (max 10MB)
              </p>
            </div>
          </div>
        </form>

        {/* Footer avec boutons */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium rounded border border-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium rounded"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sauvegarde...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {editingTask ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingTask ? 'Modifier' : 'Créer'}</span>
                </span>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TaskForm;