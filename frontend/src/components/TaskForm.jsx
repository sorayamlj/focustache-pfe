import React, { useState } from 'react';
import { 
  Edit3, 
  Plus, 
  X, 
  FileText, 
  BookOpen, 
  Target, 
  Calendar, 
  Activity, 
  Clock, 
  Link, 
  Paperclip,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const TaskForm = ({ editingTask, onSubmit, onClose, isSubmitting, attachedFile, setAttachedFile, uploadingFile, setUploadingFile }) => {
  // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
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
    dureeEstimee: editingTask?.dureeEstimee || '',
    lien: editingTask?.lien || '',
    fichierUrl: editingTask?.fichierUrl || ''
  });

  // États pour la validation
  const [errors, setErrors] = useState({});

  // Initialiser attachedFile avec la valeur existante si on édite
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
  }, [editingTask, setAttachedFile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validation côté client
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

    // Vérifier la taille (max 10MB)
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
      
      // Mettre à jour les deux states
      setAttachedFile(result.fileUrl);
      setFormData(prev => ({
        ...prev,
        fichierUrl: result.fileUrl
      }));
      
      console.log('Fichier uploadé:', result.fileUrl);
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
    
    // Validation avant soumission
    if (!validateForm()) {
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    console.log('Données envoyées:', formData);
    onSubmit(formData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Ctrl+Enter pour valider rapidement
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'haute': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'moyenne': return <Target className="w-4 h-4 text-yellow-400" />;
      case 'basse': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'à faire': return <FileText className="w-4 h-4 text-gray-400" />;
      case 'en cours': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'terminée': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="relative flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                {editingTask ? <Edit3 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editingTask ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
                </h2>
                <p className="text-slate-400 text-sm">
                  Organisez votre travail efficacement
                  <span className="ml-2 text-xs">
                    <Info className="w-3 h-3 inline mr-1" />
                    Ctrl+Enter pour sauvegarder rapidement
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            
            {/* Titre */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <FileText className="w-4 h-4 text-blue-400" />
                Titre de la tâche *
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                required
                className={`w-full p-4 bg-white/5 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500/50 transition-all duration-200 ${
                  errors.titre 
                    ? 'border-red-500/50 focus:ring-red-500/50' 
                    : 'border-white/10 focus:ring-blue-500/50'
                }`}
                placeholder="Ex: Réviser le cours d'algorithmique"
              />
              {errors.titre && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {errors.titre}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <FileText className="w-4 h-4 text-green-400" />
                Description (optionnel)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200 resize-none"
                placeholder="Description détaillée de la tâche..."
              />
            </div>

            {/* Module et Priorité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Module *
                </label>
                <input
                  type="text"
                  name="module"
                  value={formData.module}
                  onChange={handleInputChange}
                  required
                  className={`w-full p-4 bg-white/5 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-purple-500/50 transition-all duration-200 ${
                    errors.module 
                      ? 'border-red-500/50 focus:ring-red-500/50' 
                      : 'border-white/10 focus:ring-purple-500/50'
                  }`}
                  placeholder="Ex: Mathématiques, Informatique..."
                />
                {errors.module && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {errors.module}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Target className="w-4 h-4 text-orange-400" />
                  Priorité *
                </label>
                <select
                  name="priorite"
                  value={formData.priorite}
                  onChange={handleInputChange}
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                >
                  <option value="basse" className="bg-slate-800">Basse</option>
                  <option value="moyenne" className="bg-slate-800">Moyenne</option>
                  <option value="haute" className="bg-slate-800">Haute</option>
                </select>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {getPriorityIcon(formData.priorite)}
                  <span>Priorité sélectionnée: {formData.priorite}</span>
                </div>
              </div>
            </div>

            {/* Date d'échéance et Statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  Date d'échéance *
                </label>
                <input
                  type="date"
                  name="dateEcheance"
                  value={formData.dateEcheance}
                  onChange={handleInputChange}
                  required
                  className={`w-full p-4 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-pink-500/50 transition-all duration-200 ${
                    errors.dateEcheance 
                      ? 'border-red-500/50 focus:ring-red-500/50' 
                      : 'border-white/10 focus:ring-pink-500/50'
                  }`}
                />
                {errors.dateEcheance && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {errors.dateEcheance}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Statut *
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleInputChange}
                  required
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                >
                  <option value="à faire" className="bg-slate-800">À faire</option>
                  <option value="en cours" className="bg-slate-800">En cours</option>
                  <option value="terminée" className="bg-slate-800">Terminée</option>
                </select>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {getStatusIcon(formData.statut)}
                  <span>Statut sélectionné: {formData.statut}</span>
                </div>
              </div>
            </div>

            {/* Durée estimée */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Clock className="w-4 h-4 text-yellow-400" />
                Durée estimée (en minutes)
              </label>
              <input
                type="number"
                name="dureeEstimee"
                value={formData.dureeEstimee}
                onChange={handleInputChange}
                min="0"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200"
                placeholder="Ex: 120"
              />
              {formData.dureeEstimee && (
                <p className="text-yellow-400 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Durée estimée: {Math.floor(formData.dureeEstimee / 60)}h {formData.dureeEstimee % 60}min
                </p>
              )}
            </div>

            {/* Lien externe */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Link className="w-4 h-4 text-blue-400" />
                Lien externe (optionnel)
              </label>
              <input
                type="url"
                name="lien"
                value={formData.lien}
                onChange={handleInputChange}
                className={`w-full p-4 bg-white/5 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500/50 transition-all duration-200 ${
                  errors.lien 
                    ? 'border-red-500/50 focus:ring-red-500/50' 
                    : 'border-white/10 focus:ring-blue-500/50'
                }`}
                placeholder="https://example.com"
              />
              {errors.lien && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {errors.lien}
                </p>
              )}
            </div>

            {/* Upload de fichier */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                Fichier attaché (optionnel)
              </label>
              
              {attachedFile && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <a
                      href={attachedFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-300 hover:text-emerald-200 transition-colors font-medium"
                    >
                      Fichier attaché
                    </a>
                    <p className="text-emerald-400/70 text-xs">Cliquez pour ouvrir</p>
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
                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
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
                  className="w-full p-4 bg-white/5 border-2 border-dashed border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-medium hover:file:bg-emerald-700 file:cursor-pointer transition-all duration-200 hover:border-white/30"
                />
                
                {uploadingFile && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl flex items-center justify-center">
                    <div className="flex items-center gap-3 text-blue-400">
                      <Upload className="w-5 h-5 animate-pulse" />
                      <span className="font-medium">Upload en cours...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-slate-400 text-xs flex items-center gap-2">
                <Info className="w-3 h-3" />
                Formats supportés: PDF, Word, Images (max 10MB)
              </p>
            </div>
          </div>
        </form>

        {/* Footer avec boutons */}
        <div className="p-6 border-t border-white/10 bg-slate-800/50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-slate-600/50 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
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
          
          {/* Aide supplémentaire */}
          <div className="mt-3 text-center">
            <p className="text-slate-400 text-xs flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              Utilisez <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Échap</kbd> pour fermer ou <kbd className="px-1 py-0.5 bg-slate-700 rounded text-xs">Ctrl+Enter</kbd> pour sauvegarder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;