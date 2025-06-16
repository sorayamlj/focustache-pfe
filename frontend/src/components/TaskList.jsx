import React, { useState, useEffect, useCallback } from 'react';
import TaskForm from './TaskForm';
import TaskShareModal from './TaskShareModal';
import { CheckSquare, Plus, Grid, List, Calendar, Share2, Edit3, Trash2 } from 'lucide-react';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // États pour les filtres et tri
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateCreation');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Données des filtres
  const priorities = [
    { key: 'all', label: 'Toutes', color: '#6b7280' },
    { key: 'haute', label: 'Haute', color: '#ef4444' },
    { key: 'moyenne', label: 'Moyenne', color: '#f59e0b' },
    { key: 'basse', label: 'Basse', color: '#10b981' }
  ];

  const sortOptions = [
    { key: 'dateCreation', label: 'Date de création' },
    { key: 'dateEcheance', label: 'Date d\'échéance' },
    { key: 'titre', label: 'Titre' },
    { key: 'priorite', label: 'Priorité' }
  ];
  
  // États pour l'interface
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  
  // États pour le partage
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [taskToShare, setTaskToShare] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  
  // Cache des modules pour l'auto-complétion
  const [availableModules, setAvailableModules] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchAvailableModules();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tâches');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
      setError('');
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les tâches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks/modules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const modules = await response.json();
        setAvailableModules(modules);
      }
    } catch (err) {
      console.error('Erreur chargement modules:', err);
    }
  };

  const handleSubmit = async (submittedFormData) => {
    console.log('Données reçues du formulaire:', submittedFormData);
    
    setIsSubmitting(true);
    try {
      // Validation côté client
      if (!submittedFormData.titre || !submittedFormData.module || !submittedFormData.dateEcheance) {
        throw new Error('Titre, Module et Date d\'échéance sont obligatoires');
      }
      
      // Préparer les données selon le schéma backend
      const cleanData = {
        titre: submittedFormData.titre.trim(),
        module: submittedFormData.module.trim(),
        priorite: submittedFormData.priorite || 'moyenne',
        statut: submittedFormData.statut || 'à faire',
        dateEcheance: submittedFormData.dateEcheance
      };

      // Ajouter les champs optionnels SEULEMENT s'ils ont une valeur
      if (submittedFormData.description?.trim()) {
        cleanData.description = submittedFormData.description.trim();
      }

      if (submittedFormData.dureeEstimee && submittedFormData.dureeEstimee > 0) {
        cleanData.dureeEstimee = parseInt(submittedFormData.dureeEstimee);
      }

      if (submittedFormData.lien?.trim()) {
        cleanData.lien = submittedFormData.lien.trim();
      }

      if (submittedFormData.fichierUrl?.trim()) {
        cleanData.fichierUrl = submittedFormData.fichierUrl.trim();
      }

      console.log('Données envoyées au backend:', cleanData);

      const token = localStorage.getItem('token');
      const url = editingTask 
        ? `http://localhost:5000/api/tasks/${editingTask._id}`
        : 'http://localhost:5000/api/tasks';
      
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erreur lors de la sauvegarde');
      }

      const savedTask = await response.json();
      console.log('Tâche sauvegardée:', savedTask);
      
      // Mettre à jour la liste
      if (editingTask) {
        setTasks(tasks.map(task => 
          task._id === editingTask._id ? savedTask : task
        ));
      } else {
        setTasks([savedTask, ...tasks]);
      }

      // Actualiser la liste des modules
      fetchAvailableModules();
      
      closeModal();
      
      // Notification de succès plus discrète
      showNotification(
        editingTask ? 'Tâche modifiée avec succès !' : 'Tâche créée avec succès !',
        'success'
      );
      
    } catch (error) {
      console.error('Erreur:', error);
      showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task?.titre}" ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setTasks(tasks.filter(task => task._id !== taskId));
      showNotification('Tâche supprimée avec succès !', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      const newStatus = task.statut === 'terminée' ? 'à faire' : 'terminée';
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statut: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => 
        task._id === taskId ? updatedTask : task
      ));
      
      showNotification(
        `Tâche marquée comme ${newStatus === 'terminée' ? 'terminée' : 'à faire'}`,
        'success'
      );
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const showNotification = (message, type = 'info', duration = 3000) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-medium max-w-sm backdrop-blur-sm border transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-600/90 border-green-500/50' : 
      type === 'error' ? 'bg-red-600/90 border-red-500/50' : 
      'bg-blue-600/90 border-blue-500/50'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-xl">
          ${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}
        </div>
        <div class="flex-1">${message}</div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setAttachedFile(null);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setAttachedFile(task.fichierUrl || null);
    setIsModalOpen(true);
  };

  // Fonctions de partage
  const handleShareTask = (task) => {
    console.log('Debug - Partage de tâche:', task.titre);
    console.log('Debug - Email utilisateur:', getCurrentUserEmail());
    console.log('Debug - Propriétaires tâche:', task.owners);
    setTaskToShare(task);
    setShareModalOpen(true);
  };

  const handleShare = async (taskId, email, action = 'add') => {
    setIsSharing(true);
    try {
      const token = localStorage.getItem('token');
      
      if (action === 'remove') {
        // Logique pour retirer un collaborateur (à implémenter côté backend)
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/unshare`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Erreur lors de la suppression du collaborateur');
        }
      } else {
        // Partager la tâche
        const response = await fetch(`http://localhost:5000/api/tasks/share/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Erreur lors du partage');
        }
      }

      // Actualiser la liste des tâches
      await fetchTasks();
      
      showNotification(
        action === 'remove' 
          ? `Collaborateur retiré avec succès` 
          : `Tâche partagée avec ${email}`,
        'success'
      );

      // Fermer le modal et reset
      if (action !== 'remove') {
        setShareModalOpen(false);
        setTaskToShare(null);
      }
      
    } catch (error) {
      console.error('Erreur partage:', error);
      throw error; // Re-throw pour que le modal puisse afficher l'erreur
    } finally {
      setIsSharing(false);
    }
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setTaskToShare(null);
  };

  const getEtatColor = (statut) => {
    switch (statut) {
      case 'à faire': return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' };
      case 'en cours': return { bg: 'rgba(34, 197, 94, 0.1)', text: '#4ade80' };
      case 'terminée': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
      default: return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' };
    }
  };

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'haute': return 'bg-red-500';
      case 'moyenne': return 'bg-yellow-500';
      case 'basse': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isSharedTask = (task) => {
    return task.owners && task.owners.length > 1;
  };

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

  // Obtenir les modules uniques
  const getUniqueModules = () => {
    const modules = [...new Set(tasks.map(task => task.module))];
    return [
      { key: 'all', label: 'Tous les modules' },
      ...modules.map(module => ({ key: module, label: module }))
    ];
  };

  // Fonction de tri et filtrage
  const getFilteredAndSortedTasks = () => {
    let filtered = tasks.filter(task => {
      // Filtre par statut
      let statusMatch = filter === 'all' || 
        (filter === 'completed' && task.statut === 'terminée') ||
        (filter === 'pending' && task.statut === 'à faire') ||
        (filter === 'inprogress' && task.statut === 'en cours');
      
      // Filtre par priorité
      let priorityMatch = priorityFilter === 'all' || task.priorite === priorityFilter;
      
      // Filtre par module
      let moduleMatch = moduleFilter === 'all' || task.module === moduleFilter;
      
      return statusMatch && priorityMatch && moduleMatch;
    });

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dateCreation':
          comparison = new Date(a.createdAt || a.updatedAt) - new Date(b.createdAt || b.updatedAt);
          break;
        case 'dateEcheance':
          if (!a.dateEcheance && !b.dateEcheance) comparison = 0;
          else if (!a.dateEcheance) comparison = 1;
          else if (!b.dateEcheance) comparison = -1;
          else comparison = new Date(a.dateEcheance) - new Date(b.dateEcheance);
          break;
        case 'titre':
          comparison = a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'accent' });
          break;
        case 'priorite':
          const priorityOrder = { 'haute': 3, 'moyenne': 2, 'basse': 1 };
          comparison = (priorityOrder[b.priorite] || 0) - (priorityOrder[a.priorite] || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredTasks = getFilteredAndSortedTasks();

  // Fonction pour réinitialiser tous les filtres
  const resetAllFilters = () => {
    setFilter('all');
    setPriorityFilter('all');
    setModuleFilter('all');
    setSortBy('dateCreation');
    setSortOrder('desc');
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return filter !== 'all' || priorityFilter !== 'all' || 
           moduleFilter !== 'all' || sortBy !== 'dateCreation' || sortOrder !== 'desc';
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.statut === 'à faire').length,
    inprogress: tasks.filter(t => t.statut === 'en cours').length,
    completed: tasks.filter(t => t.statut === 'terminée').length,
    overdue: tasks.filter(t => t.statut !== 'terminée' && new Date(t.dateEcheance) < new Date()).length
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 p-5 bg-slate-700 rounded-full">
            <Trash2 className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button 
            onClick={fetchTasks}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header avec icône et stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <CheckSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Mes Tâches
                </h1>
                <p className="text-slate-400 text-lg flex items-center gap-2">
                  {filteredTasks.length} sur {tasks.length} tâche{tasks.length > 1 ? 's' : ''} • Organisez vos projets efficacement
                  {hasActiveFilters() && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs border border-green-500/30">
                      Filtré
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Tâche
            </button>
          </div>

          {/* Stats étendues */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.total}</div>
              <div className="text-slate-300 text-sm">Total</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{stats.pending}</div>
              <div className="text-slate-300 text-sm">À faire</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.inprogress}</div>
              <div className="text-slate-300 text-sm">En cours</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
              <div className="text-slate-300 text-sm">Terminées</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
              <div className="text-slate-300 text-sm">En retard</div>
            </div>
          </div>

          {/* Système de tri et filtrage */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Filtres et tri</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  {filteredTasks.length} / {tasks.length} tâches
                </span>
                {hasActiveFilters() && (
                  <button
                    onClick={resetAllFilters}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Tri */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.key} value={option.key} className="bg-slate-800 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordre */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Ordre</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="desc" className="bg-slate-800 text-white">Décroissant</option>
                  <option value="asc" className="bg-slate-800 text-white">Croissant</option>
                </select>
              </div>

              {/* Priorité */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Priorité</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.key} value={priority.key} className="bg-slate-800 text-white">
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Module */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Module</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {getUniqueModules().map(module => (
                    <option key={module.key} value={module.key} className="bg-slate-800 text-white">
                      {module.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filtres rapides et contrôles de vue */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: `Toutes (${tasks.length})`, count: tasks.length },
                { key: 'pending', label: `À faire (${stats.pending})`, count: stats.pending },
                { key: 'inprogress', label: `En cours (${stats.inprogress})`, count: stats.inprogress },
                { key: 'completed', label: `Terminées (${stats.completed})`, count: stats.completed }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => {
                    setFilter(filterOption.key);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    filter === filterOption.key
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
            
            {/* Contrôles de vue */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                title={viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {viewMode === 'grid' ? 'Liste' : 'Grille'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste des tâches */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 p-5 bg-slate-700 rounded-full">
              <CheckSquare className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {filter === 'all' ? 'Aucune tâche créée' : 'Aucune tâche trouvée'}
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Commencez par créer votre première tâche pour organiser vos projets !'
                : `Aucune tâche ${filter === 'completed' ? 'terminée' : filter === 'inprogress' ? 'en cours' : 'à faire'} pour le moment.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2 inline" />
                Créer ma première tâche
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredTasks.map((task, index) => {
              const etatStyle = getEtatColor(task.statut);
              const isOverdue = task.dateEcheance && new Date(task.dateEcheance) < new Date() && task.statut !== 'terminée';
              const isCompleted = task.statut === 'terminée';

              return (
                <div
                  key={task._id}
                  className={`group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-white/10 hover:border-white/20 ${
                    isOverdue ? 'ring-2 ring-red-500/50' : ''
                  } ${isCompleted ? 'opacity-75' : ''} ${
                    viewMode === 'list' ? 'flex items-center gap-6' : ''
                  }`}
                  style={{ 
                    animation: `fadeInUp 0.6s ease-out forwards`,
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                >
                  {/* Header de la carte */}
                  <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-1' : 'mb-4'}`}>
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleStatus(task._id)}
                        className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-green-600 checked:border-green-600 cursor-pointer transition-all duration-200"
                      />
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold transition-all duration-200 ${
                          isCompleted 
                            ? 'text-slate-400 line-through' 
                            : 'text-white group-hover:text-green-300'
                        }`}>
                          {task.titre}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-emerald-400 text-sm">{task.module}</span>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priorite)}`}></div>
                          <span className="text-sm" style={{ color: etatStyle.text }}>
                            {task.statut}
                          </span>
                          {isSharedTask(task) && (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-400">
                                Partagée ({task.owners.length})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu d'actions */}
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleShareTask(task)}
                        className="w-8 h-8 flex items-center justify-center bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-all duration-200 border border-green-500/30"
                        title="Partager cette tâche"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditTask(task)}
                        className="w-8 h-8 flex items-center justify-center bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="w-8 h-8 flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all duration-200"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {viewMode === 'grid' && (
                    <>
                      {/* Description */}
                      {task.description && (
                        <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Liens et Fichiers */}
                      <div className="space-y-2 mb-4">
                        {task.lien && (
                          <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <span className="text-blue-400">🔗</span>
                            <a
                              href={task.lien.startsWith('http') ? task.lien : `https://${task.lien}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-300 hover:text-blue-200 text-sm font-medium truncate flex-1 transition-colors"
                            >
                              {task.lien.replace(/^https?:\/\//, '').substring(0, 25)}
                              {task.lien.length > 25 ? '...' : ''}
                            </a>
                          </div>
                        )}

                        {task.fichierUrl && (
                          <div className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <span className="text-purple-400">📎</span>
                            <a
                              href={task.fichierUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-300 hover:text-purple-200 text-sm font-medium flex-1 transition-colors"
                            >
                              Fichier attaché
                            </a>
                          </div>
                        )}

                        {task.dureeEstimee && (
                          <div className="flex items-center gap-2 text-yellow-400 text-sm">
                            <span>⏱</span>
                            <span>{task.dureeEstimee} min estimées</span>
                          </div>
                        )}

                        {/* Collaborateurs */}
                        {isSharedTask(task) && (
                          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-green-400">👥</span>
                              <span className="text-sm font-medium text-green-300">
                                Collaborateurs ({task.owners.length})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {task.owners.slice(0, 3).map((email, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600/20 rounded-full text-xs"
                                >
                                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                                    {email.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-green-200">
                                    {email === getCurrentUserEmail() ? 'Vous' : email.split('@')[0]}
                                  </span>
                                </div>
                              ))}
                              {task.owners.length > 3 && (
                                <span className="text-xs text-green-400 px-2 py-1">
                                  +{task.owners.length - 3} autres
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer de la carte */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          {isOverdue && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                              En retard
                            </span>
                          )}
                          
                          {!isSharedTask(task) && (
                            <button
                              onClick={() => handleShareTask(task)}
                              className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 text-xs font-medium rounded-full border border-green-500/30 transition-all duration-200 flex items-center gap-1"
                            >
                              <Share2 className="w-3 h-3" />
                              Partager
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {task.dateEcheance && (
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(task.dateEcheance)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {viewMode === 'list' && (
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {task.dateEcheance && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(task.dateEcheance)}</span>
                        </div>
                      )}
                      {isOverdue && (
                        <span className="text-red-400">En retard</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal TaskForm */}
        {isModalOpen && (
          <TaskForm
            editingTask={editingTask}
            onSubmit={handleSubmit}
            onClose={closeModal}
            isSubmitting={isSubmitting}
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
            uploadingFile={uploadingFile}
            setUploadingFile={setUploadingFile}
          />
        )}

        {/* Modal de partage */}
        <TaskShareModal
          task={taskToShare}
          isOpen={shareModalOpen}
          onClose={closeShareModal}
          onShare={handleShare}
          isSharing={isSharing}
        />
      </div>

      {/* Styles CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
};

export default TaskList;