import React, { useState, useEffect } from 'react';
import TaskForm from './TaskForm';
import TaskShareModal from './TaskShareModal';
import { CheckSquare, Plus, Grid, List, Share2, Edit3, Trash2, X, ArrowDownToLine } from 'lucide-react';
import { useNotificationsSafe } from '../hooks/useNotificationsSafe'; // ✅ Hook sécurisé

const TaskList = () => {
  // ✅ Hook de notifications sécurisé
  const { 
    notifySuccess, 
    notifyError, 
    notifyWarning, 
    notifyInfo,
    notifyTask,
    notifyDeadline 
  } = useNotificationsSafe();

  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // États pour les filtres
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateCreation');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // États pour l'interface
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  // États pour le partage
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [taskToShare, setTaskToShare] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  const priorities = [
    { key: 'all', label: 'Toutes' },
    { key: 'haute', label: 'Haute' },
    { key: 'moyenne', label: 'Moyenne' },
    { key: 'basse', label: 'Basse' }
  ];

  const sortOptions = [
    { key: 'dateCreation', label: 'Date de création' },
    { key: 'dateEcheance', label: 'Date d\'échéance' },
    { key: 'titre', label: 'Titre' },
    { key: 'priorite', label: 'Priorité' }
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  // Vérification des échéances au chargement
  useEffect(() => {
    if (tasks.length > 0) {
      checkDeadlines();
    }
  }, [tasks]);

  const checkDeadlines = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let urgentCount = 0;
    let todayCount = 0;

    tasks.forEach(task => {
      if (task.statut === 'terminée') return;
      
      const deadline = new Date(task.dateEcheance);
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      
      if (deadlineDate < today) {
        // Tâche en retard
        notifyDeadline(task.titre, 'était prévue hier', task.priorite);
        urgentCount++;
      } else if (deadlineDate.getTime() === today.getTime()) {
        // Échéance aujourd'hui
        notifyDeadline(task.titre, 'aujourd\'hui', task.priorite);
        todayCount++;
      }
    });

    if (urgentCount > 0 || todayCount > 0) {
      const message = urgentCount > 0 
        ? `${urgentCount} tâche(s) en retard${todayCount > 0 ? ` et ${todayCount} pour aujourd'hui` : ''}`
        : `${todayCount} tâche(s) à terminer aujourd'hui`;
      
      notifyWarning(message, {
        title: '⏰ Échéances importantes',
        persistent: true
      });
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Récupération des tâches...');
      
      if (!token) {
        notifyError('Session expirée, redirection...', {
          title: '🔒 Authentification requise'
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      notifyInfo('Synchronisation des tâches...', {
        title: '📋 Chargement',
        duration: 2000
      });
      
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error(`🛑 Erreur HTTP (${response.status})`, text);
        let errorMsg;
        try {
          const json = JSON.parse(text);
          errorMsg = json.msg || json.error || text;
        } catch {
          errorMsg = text;
        }
        throw new Error(errorMsg || 'Erreur lors du chargement');
      }

      const data = await response.json();
      console.log('📋 Données reçues:', data);
      
      // Vérifier différents formats de réponse
      let tasksArray = [];
      if (Array.isArray(data)) {
        tasksArray = data;
      } else if (data.tasks && Array.isArray(data.tasks)) {
        tasksArray = data.tasks;
      } else if (data.data && Array.isArray(data.data)) {
        tasksArray = data.data;
      } else {
        tasksArray = data || [];
      }
      
      console.log('📋 Nombre de tâches trouvées:', tasksArray.length);
      
      setTasks(tasksArray);
      setError('');

      // Notification de succès
      notifySuccess(`${tasksArray.length} tâches chargées avec succès`, {
        title: '✅ Synchronisation réussie',
        duration: 3000
      });
      
    } catch (err) {
      console.error('❌ Erreur complète:', err);
      const errorMessage = `Impossible de charger les tâches: ${err.message}`;
      setError(errorMessage);
      notifyError(errorMessage, {
        title: '📋 Erreur de chargement',
        persistent: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUniqueModules = () => {
    const modules = [...new Set(tasks.map(task => task.module))];
    return [
      { key: 'all', label: 'Tous les modules' },
      ...modules.map(module => ({ key: module, label: module }))
    ];
  };

  const getFilteredAndSortedTasks = () => {
    let filtered = tasks.filter(task => {
      let statusMatch = filter === 'all' || 
        (filter === 'completed' && task.statut === 'terminée') ||
        (filter === 'pending' && task.statut === 'à faire') ||
        (filter === 'inprogress' && task.statut === 'en cours');
      
      let priorityMatch = priorityFilter === 'all' || task.priorite === priorityFilter;
      let moduleMatch = moduleFilter === 'all' || task.module === moduleFilter;
      
      return statusMatch && priorityMatch && moduleMatch;
    });

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

  const resetAllFilters = () => {
    setFilter('all');
    setPriorityFilter('all');
    setModuleFilter('all');
    setSortBy('dateCreation');
    setSortOrder('desc');
    
    notifyInfo('Filtres réinitialisés', {
      title: '🔄 Remise à zéro'
    });
  };

  const hasActiveFilters = () => {
    return filter !== 'all' || priorityFilter !== 'all' || 
           moduleFilter !== 'all' || sortBy !== 'dateCreation' || sortOrder !== 'desc';
  };

  const handleExportTask = async (taskId) => {
    try {
      console.log("📤 Export PDF - ID de la tâche :", taskId);
      const token = localStorage.getItem("token");

      notifyInfo('Génération du PDF en cours...', {
        title: '📄 Export PDF'
      });

      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/export`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Réponse serveur :", errorText);
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tache-${taskId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      notifySuccess("Tâche exportée en PDF avec succès", {
        title: "📄 Export réussi"
      });
    } catch (error) {
      console.error("❌ Erreur export PDF:", error);
      notifyError("Erreur lors de l'export PDF", {
        title: "📄 Export échoué"
      });
    }
  };

  const handleSubmit = async (submittedFormData) => {
    setIsSubmitting(true);
    try {
      if (!submittedFormData.titre || !submittedFormData.module || !submittedFormData.dateEcheance) {
        throw new Error('Titre, Module et Date d\'échéance sont obligatoires');
      }
      
      const cleanData = {
        titre: submittedFormData.titre.trim(),
        module: submittedFormData.module.trim(),
        priorite: submittedFormData.priorite || 'moyenne',
        statut: submittedFormData.statut || 'à faire',
        dateEcheance: submittedFormData.dateEcheance
      };

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

      notifyInfo(editingTask ? 'Modification en cours...' : 'Création en cours...', {
        title: '💾 Sauvegarde'
      });

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
      
      if (editingTask) {
        setTasks(tasks.map(task => 
          task._id === editingTask._id ? savedTask : task
        ));
        notifySuccess(`Tâche "${savedTask.titre}" modifiée avec succès !`, {
          title: '✏️ Modification réussie'
        });
      } else {
        setTasks([savedTask, ...tasks]);
        notifySuccess(`Tâche "${savedTask.titre}" créée avec succès !`, {
          title: '✨ Création réussie'
        });
      }

      closeModal();
      
    } catch (error) {
      console.error('Erreur:', error);
      notifyError(`Erreur: ${error.message}`, {
        title: '💾 Sauvegarde échouée'
      });
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
      notifyInfo('Suppression en cours...', {
        title: '🗑️ Suppression'
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setTasks(tasks.filter(task => task._id !== taskId));
      notifySuccess(`Tâche "${task.titre}" supprimée avec succès !`, {
        title: '🗑️ Suppression réussie'
      });
    } catch (error) {
      console.error('Erreur:', error);
      notifyError('Erreur lors de la suppression', {
        title: '🗑️ Suppression échouée'
      });
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      const newStatus = task.statut === 'terminée' ? 'à faire' : 'terminée';
      
      notifyInfo(`Changement de statut...`, {
        title: '🔄 Mise à jour'
      });

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
      
      if (newStatus === 'terminée') {
        notifySuccess(`Félicitations ! "${task.titre}" est terminée !`, {
          title: '🎉 Tâche accomplie'
        });
      } else {
        notifyInfo(`"${task.titre}" remise en cours`, {
          title: '🔄 Statut modifié'
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      notifyError('Erreur lors de la mise à jour du statut', {
        title: '🔄 Mise à jour échouée'
      });
    }
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
    
    notifyInfo(`Édition de "${task.titre}"`, {
      title: '✏️ Mode édition'
    });
  };

  const handleShareTask = (task) => {
    setTaskToShare(task);
    setShareModalOpen(true);
    
    notifyInfo(`Partage de "${task.titre}"`, {
      title: '👥 Partage'
    });
  };

  const handleShare = async (taskId, email, action = 'add') => {
    setIsSharing(true);
    try {
      const token = localStorage.getItem('token');

      if (!taskId || !email) {
        throw new Error('ID de tâche et email requis');
      }

      console.log('🟡 handleShare start:', { taskId, email, action });

      notifyInfo(action === 'remove' ? 'Retrait du collaborateur...' : 'Ajout du collaborateur...', {
        title: '👥 Partage en cours'
      });

      const url = action === 'remove'
        ? `http://localhost:5000/api/tasks/${taskId}/unshare`
        : `http://localhost:5000/api/tasks/share/${taskId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      const text = await response.text();
      console.log('🟡 handleShare raw response:', response.status, text);

      if (!response.ok) {
        try {
          const json = JSON.parse(text);
          throw new Error(json.msg || 'Erreur inconnue');
        } catch (e) {
          throw new Error(text);
        }
      }

      await fetchTasks();

      if (action === 'remove') {
        notifySuccess(`Collaborateur retiré avec succès`, {
          title: '👥 Retrait réussi'
        });
      } else {
        notifySuccess(`Tâche partagée avec ${email}`, {
          title: '👥 Partage réussi'
        });
        setShareModalOpen(false);
        setTaskToShare(null);
      }

    } catch (error) {
      console.error('🔴 Erreur dans handleShare:', error.message);
      notifyError(`Erreur de partage: ${error.message}`, {
        title: '👥 Partage échoué'
      });
      throw error;
    } finally {
      setIsSharing(false);
    }
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setTaskToShare(null);
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
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || null;
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return null;
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.statut === 'à faire').length,
    inprogress: tasks.filter(t => t.statut === 'en cours').length,
    completed: tasks.filter(t => t.statut === 'terminée').length,
    overdue: tasks.filter(t => t.statut !== 'terminée' && new Date(t.dateEcheance) < new Date()).length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-red-500">×</div>
          <h2 className="text-2xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchTasks();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Mes Tâches</h1>
                <p className="text-gray-400">{tasks.length} tâches</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsModalOpen(true);
                notifyInfo('Création d\'une nouvelle tâche', {
                  title: '✨ Nouvelle tâche'
                });
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div 
              className="bg-gray-800 border border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => {
                notifyInfo(`${stats.total} tâches au total`, {
                  title: '📊 Statistiques totales'
                });
              }}
            >
              <div className="text-2xl font-bold text-green-400">{stats.total}</div>
              <div className="text-gray-300 text-sm">Total</div>
            </div>
            <div 
              className="bg-gray-800 border border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => {
                setFilter('pending');
                notifyInfo(`Affichage des ${stats.pending} tâches à faire`, {
                  title: '📋 Filtrage appliqué'
                });
              }}
            >
              <div className="text-2xl font-bold text-gray-400">{stats.pending}</div>
              <div className="text-gray-300 text-sm">À faire</div>
            </div>
            <div 
              className="bg-gray-800 border border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => {
                setFilter('inprogress');
                notifyInfo(`Affichage des ${stats.inprogress} tâches en cours`, {
                  title: '🔄 Filtrage appliqué'
                });
              }}
            >
              <div className="text-2xl font-bold text-yellow-400">{stats.inprogress}</div>
              <div className="text-gray-300 text-sm">En cours</div>
            </div>
            <div 
              className="bg-gray-800 border border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => {
                setFilter('completed');
                notifySuccess(`${stats.completed} tâches terminées - Bravo !`, {
                  title: '🎉 Tâches accomplies'
                });
              }}
            >
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-gray-300 text-sm">Terminées</div>
            </div>
            <div 
              className="bg-gray-800 border border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => {
                if (stats.overdue > 0) {
                  notifyWarning(`${stats.overdue} tâches en retard nécessitent votre attention`, {
                    title: '⚠️ Échéances dépassées',
                    persistent: true
                  });
                } else {
                  notifySuccess('Aucune tâche en retard - Excellent !', {
                    title: '✅ Parfait timing'
                  });
                }
              }}
            >
              <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
              <div className="text-gray-300 text-sm">En retard</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-gray-800 border border-gray-700 rounded p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Filtres et tri</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {filteredTasks.length} / {tasks.length} tâches
                </span>
                {hasActiveFilters() && (
                  <button
                    onClick={resetAllFilters}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    notifyInfo(`Tri par ${e.target.selectedOptions[0].text}`, {
                      title: '🔄 Tri appliqué'
                    });
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Ordre</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="desc">Décroissant</option>
                  <option value="asc">Croissant</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Priorité</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    if (e.target.value !== 'all') {
                      notifyInfo(`Filtrage par priorité ${e.target.value}`, {
                        title: '🎯 Filtre appliqué'
                      });
                    }
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  {priorities.map(priority => (
                    <option key={priority.key} value={priority.key}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Module</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => {
                    setModuleFilter(e.target.value);
                    if (e.target.value !== 'all') {
                      notifyInfo(`Filtrage par module "${e.target.value}"`, {
                        title: '📚 Filtre appliqué'
                      });
                    }
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  {getUniqueModules().map(module => (
                    <option key={module.key} value={module.key}>
                      {module.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filtres rapides et vue */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: `Toutes (${stats.total})` },
                { key: 'pending', label: `À faire (${stats.pending})` },
                { key: 'inprogress', label: `En cours (${stats.inprogress})` },
                { key: 'completed', label: `Terminées (${stats.completed})` }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => {
                    setFilter(filterOption.key);
                    if (filterOption.key !== 'all') {
                      notifyInfo(`Affichage: ${filterOption.label}`, {
                        title: '🔍 Vue filtrée'
                      });
                    }
                  }}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    filter === filterOption.key
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newMode = viewMode === 'grid' ? 'list' : 'grid';
                  setViewMode(newMode);
                  notifyInfo(`Vue ${newMode === 'grid' ? 'grille' : 'liste'} activée`, {
                    title: '👁️ Mode d\'affichage'
                  });
                }}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-700"
                title={viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Liste des tâches */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Aucune tâche trouvée</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Commencez par créer votre première tâche !'
                : `Aucune tâche ${filter === 'completed' ? 'terminée' : filter === 'inprogress' ? 'en cours' : 'à faire'} pour le moment.`
              }
            </p>
            <button
              onClick={() => {
                setIsModalOpen(true);
                notifyInfo('Création de votre première tâche', {
                  title: '🚀 Commençons !'
                });
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
            >
              Créer ma première tâche
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-4"
          }>
            {filteredTasks.map(task => {
              const isOverdue = task.dateEcheance && new Date(task.dateEcheance) < new Date() && task.statut !== 'terminée';
              const isCompleted = task.statut === 'terminée';

              return (
                <div
                  key={task._id}
                  className={`bg-gray-800 border border-gray-700 rounded p-4 hover:bg-gray-700 transition-colors ${
                    isOverdue ? 'border-red-500' : ''
                  } ${isCompleted ? 'opacity-75' : ''} ${
                    viewMode === 'list' ? 'flex items-center gap-4' : ''
                  }`}
                >
                  <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-1' : 'mb-4'}`}>
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleStatus(task._id)}
                        className="w-5 h-5 rounded border-2 border-gray-600 bg-gray-700 checked:bg-green-600 checked:border-green-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${
                          isCompleted 
                            ? 'text-gray-400 line-through' 
                            : 'text-white'
                        }`}>
                          {task.titre}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-green-400 text-sm">{task.module}</span>
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priorite)}`}></div>
                          <span className="text-sm text-gray-400">{task.statut}</span>
                          {isSharedTask(task) && (
                            <span className="text-xs text-green-400">
                              Partagée ({task.owners.length})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4">
                      <button
                        onClick={() => handleExportTask(task._id)}
                        className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded"
                        title="Exporter en PDF"
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShareTask(task)}
                        className="w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded"
                        title="Partager"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditTask(task)}
                        className="w-6 h-6 flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {viewMode === 'grid' && (
                    <>
                      {task.description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        {task.lien && (
                          <div className="flex items-center gap-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded">
                            <span className="text-blue-400">🔗</span>
                            <a
                              href={task.lien.startsWith('http') ? task.lien : `https://${task.lien}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-300 hover:text-blue-200 text-sm font-medium truncate flex-1"
                              onClick={() => {
                                notifyInfo('Ouverture du lien externe', {
                                  title: '🔗 Lien externe'
                                });
                              }}
                            >
                              {task.lien.replace(/^https?:\/\//, '').substring(0, 30)}
                              {task.lien.length > 30 ? '...' : ''}
                            </a>
                          </div>
                        )}

                        {task.fichierUrl && (
                          <div className="flex items-center gap-2 p-2 bg-purple-500/20 border border-purple-500/30 rounded">
                            <span className="text-purple-400">📎</span>
                            <a
                              href={task.fichierUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-300 hover:text-purple-200 text-sm font-medium flex-1"
                              onClick={() => {
                                notifyInfo('Ouverture du fichier attaché', {
                                  title: '📎 Fichier'
                                });
                              }}
                            >
                              Fichier attaché
                            </a>
                          </div>
                        )}

                        {isSharedTask(task) && (
                          <div className="p-2 bg-green-500/20 border border-green-500/30 rounded">
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
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600/30 rounded-full text-xs"
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

                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                          {isOverdue && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded border border-red-500/30">
                              ⚠ En retard
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {task.dateEcheance && (
                            <span className="text-gray-400 text-xs">
                              {new Date(task.dateEcheance).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {viewMode === 'list' && (
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      {task.dateEcheance && (
                        <span>{new Date(task.dateEcheance).toLocaleDateString('fr-FR')}</span>
                      )}
                      {isOverdue && (
                        <span className="text-red-400">⚠ En retard</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modals */}
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

        {taskToShare && (
          <TaskShareModal
            task={taskToShare}
            isOpen={shareModalOpen}
            onClose={closeShareModal}
            onShare={handleShare}
            isSharing={isSharing}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
};

export default TaskList;