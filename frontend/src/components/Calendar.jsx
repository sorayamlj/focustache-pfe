// src/components/Calendar.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  Briefcase,
  User,
  Heart,
  Star,
  Calendar as CalIcon
} from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500'
  };

  const categoryIcons = {
    academic: BookOpen,
    work: Briefcase,
    personal: User,
    health: Heart,
    other: Star
  };

  const statusColors = {
    pending: 'text-yellow-400',
    completed: 'text-green-400',
    overdue: 'text-red-400'
  };

  // ✅ Fonctions de mapping pour adapter vos données MongoDB
  const mapPriority = (priorite) => {
    switch(priorite) {
      case 'haute': return 'high';
      case 'moyenne': return 'medium';
      case 'basse': return 'low';
      default: return 'medium';
    }
  };

  const mapCategory = (categorie) => {
    switch(categorie) {
      case 'universitaire': return 'academic';
      case 'para-universitaire': return 'work';
      case 'autre': return 'other';
      default: return 'other';
    }
  };

  const mapStatus = (statut) => {
    switch(statut) {
      case 'à faire': return 'pending';
      case 'en cours': return 'pending';
      case 'terminée': return 'completed';
      default: return 'pending';
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

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    console.log('🔄 Chargement des tâches...');
    setIsLoading(true);
    
    try {
      console.log('📡 Appel API vers: http://localhost:5000/api/tasks');
      
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📨 Réponse reçue:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const rawData = await response.text();
      console.log('📄 Données brutes:', rawData.substring(0, 200) + '...');
      
      const data = JSON.parse(rawData);
      console.log('✅ Données parsées:', data);
      
      const tasksArray = data.tasks || data;
      console.log('📋 Tâches trouvées:', tasksArray.length, 'tâches');
      
      if (!Array.isArray(tasksArray)) {
        throw new Error('Les données reçues ne sont pas un tableau');
      }
      
      if (tasksArray.length === 0) {
        console.log('ℹ️ Aucune tâche trouvée');
        setTasks([]);
        return;
      }
      
      const adaptedTasks = tasksArray.map((task, index) => {
        console.log(`🔄 Adaptation tâche ${index + 1}:`, task.titre);
        
        return {
          id: task._id,
          title: task.titre,
          description: task.description || '',
          deadline: task.dateEcheance ? task.dateEcheance.split('T')[0] : new Date().toISOString().split('T')[0],
          time: task.heure || '',
          priority: mapPriority(task.priorite),
          category: mapCategory(task.categorie),
          status: mapStatus(task.statut),
          createdAt: task.createdAt,
          module: task.module || '',
          owners: task.owners || []
        };
      });
      
      console.log('✅ Tâches adaptées:', adaptedTasks.length, 'tâches');
      setTasks(adaptedTasks);
      showNotification(`${adaptedTasks.length} tâches chargées avec succès`, 'success');
      
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      
      let errorMessage = 'Erreur de chargement des tâches';
      if (error.message.includes('404')) {
        errorMessage = 'API non trouvée - Vérifiez que le backend est démarré sur le port 5000';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Impossible de contacter le serveur - Backend démarré ?';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Réponse invalide du serveur - Vérifiez les routes API';
      } else if (error.message.includes('tableau')) {
        errorMessage = 'Format de données incorrect reçu du serveur';
      }
      
      showNotification(errorMessage, 'error', 5000);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const getTasksForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.deadline === dateString);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isOverdue = (task) => {
    const today = new Date();
    const taskDate = new Date(task.deadline);
    return taskDate < today && task.status !== 'completed';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Mon Calendrier
                </h1>
                <p className="text-slate-400 text-lg">
                  Vue d'ensemble de vos tâches programmées
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Calendrier principal */}
          <div className="xl:col-span-3">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              
              {/* Navigation du mois */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <h2 className="text-3xl font-bold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-slate-300 font-semibold py-3 text-lg">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille du calendrier */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayTasks = getTasksForDate(day.date);
                  const hasOverdue = dayTasks.some(task => isOverdue(task));
                  
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (dayTasks.length > 0) {
                          setSelectedDate(day.date);
                          setShowTaskModal(true);
                        }
                      }}
                      className={`
                        min-h-[120px] p-3 rounded-xl border transition-all duration-300 
                        ${day.isCurrentMonth 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                          : 'bg-slate-800/20 border-slate-700/50 text-slate-500'
                        }
                        ${isToday(day.date) ? 'ring-2 ring-pink-500 bg-pink-500/10' : ''}
                        ${hasOverdue ? 'ring-1 ring-red-500/50' : ''}
                        ${dayTasks.length > 0 ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
                      `}
                    >
                      <div className={`text-lg font-bold mb-3 ${
                        isToday(day.date) ? 'text-pink-400' : 
                        day.isCurrentMonth ? 'text-white' : 'text-slate-600'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map(task => {
                          const CategoryIcon = categoryIcons[task.category];
                          return (
                            <div
                              key={task.id}
                              className={`
                                text-xs p-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105
                                ${task.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-300' 
                                  : isOverdue(task)
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-pink-500/20 text-pink-300'
                                }
                              `}
                            >
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`}></div>
                              <CategoryIcon className="w-3 h-3 flex-shrink-0" />
                              <span className={`truncate flex-1 ${task.status === 'completed' ? 'line-through' : ''}`}>
                                {task.title}
                              </span>
                              {task.time && (
                                <span className="text-xs opacity-75">{task.time.slice(0,5)}</span>
                              )}
                            </div>
                          );
                        })}
                        
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-slate-400 text-center py-1 bg-white/5 rounded-lg">
                            +{dayTasks.length - 2} autre{dayTasks.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}

                        {dayTasks.length === 0 && day.isCurrentMonth && (
                          <div className="h-16"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panneau latéral - Résumé */}
          <div className="space-y-6">
            
            {/* Aperçu rapide */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Ce mois-ci
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total des tâches</span>
                  <span className="text-white font-semibold text-lg">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">En cours</span>
                  <span className="text-yellow-400 font-semibold">
                    {tasks.filter(t => t.status === 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Terminées</span>
                  <span className="text-green-400 font-semibold">
                    {tasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">En retard</span>
                  <span className="text-red-400 font-semibold">
                    {tasks.filter(t => isOverdue(t)).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Prochaines échéances */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Prochaines échéances
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tasks
                  .filter(task => task.status === 'pending')
                  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                  .slice(0, 5)
                  .map(task => {
                    const CategoryIcon = categoryIcons[task.category];
                    const daysUntil = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                        className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]} mt-2 flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CategoryIcon className="w-4 h-4 text-slate-400" />
                              <h4 className="font-medium text-white truncate">{task.title}</h4>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs">
                              <CalIcon className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-400">
                                {new Date(task.deadline).toLocaleDateString('fr-FR')}
                              </span>
                              {task.time && (
                                <>
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="text-slate-400">{task.time}</span>
                                </>
                              )}
                            </div>
                            
                            <div className={`text-xs mt-1 ${
                              daysUntil < 0 ? 'text-red-400' : 
                              daysUntil === 0 ? 'text-orange-400' : 
                              daysUntil <= 3 ? 'text-yellow-400' : 'text-slate-400'
                            }`}>
                              {daysUntil < 0 ? `${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? 's' : ''} de retard` :
                               daysUntil === 0 ? 'Aujourd\'hui' :
                               daysUntil === 1 ? 'Demain' :
                               `Dans ${daysUntil} jours`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {tasks.filter(task => task.status === 'pending').length === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-400">Toutes les tâches sont terminées !</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de détail des tâches */}
        {showTaskModal && (selectedTask || selectedDate) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {selectedTask ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${priorityColors[selectedTask.priority]}`}></div>
                      <h2 className="text-2xl font-bold text-white">{selectedTask.title}</h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowTaskModal(false);
                        setSelectedTask(null);
                      }}
                      className="p-2 bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedTask.description && (
                      <div>
                        <h3 className="text-white font-medium mb-2">Description</h3>
                        <p className="text-slate-300 bg-white/5 rounded-lg p-4">{selectedTask.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-2">Date d'échéance</h3>
                        <div className="flex items-center gap-2 text-slate-300">
                          <CalIcon className="w-4 h-4" />
                          <span>{new Date(selectedTask.deadline).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {selectedTask.time && (
                        <div className="bg-white/5 rounded-lg p-4">
                          <h3 className="text-white font-medium mb-2">Heure</h3>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Clock className="w-4 h-4" />
                            <span>{selectedTask.time}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-4 bg-white/5 rounded-lg px-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Statut:</span>
                          <span className={statusColors[selectedTask.status]}>
                            {selectedTask.status === 'completed' ? 'Terminée' : 
                             isOverdue(selectedTask) ? 'En retard' : 'En cours'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Catégorie:</span>
                          <span className="text-white capitalize">{selectedTask.category}</span>
                        </div>
                      </div>
                    </div>

                    {isOverdue(selectedTask) && selectedTask.status !== 'completed' && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3 text-red-300">
                          <AlertCircle className="w-5 h-5" />
                          <span>Cette tâche est en retard</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedDate?.toLocaleDateString('fr-FR', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h2>
                    <button
                      onClick={() => {
                        setShowTaskModal(false);
                        setSelectedDate(null);
                      }}
                      className="p-2 bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {getTasksForDate(selectedDate).length > 0 ? (
                      getTasksForDate(selectedDate).map(task => {
                        const CategoryIcon = categoryIcons[task.category];
                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]} mt-2`}></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CategoryIcon className="w-4 h-4 text-slate-400" />
                                  <h4 className={`font-medium ${task.status === 'completed' ? 'text-green-400 line-through' : 'text-white'}`}>
                                    {task.title}
                                  </h4>
                                </div>
                                {task.description && (
                                  <p className="text-slate-300 text-sm mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  {task.time && (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      <span>{task.time}</span>
                                    </>
                                  )}
                                  <span className={statusColors[task.status]}>
                                    {task.status === 'completed' ? 'Terminée' : 
                                     isOverdue(task) ? 'En retard' : 'En cours'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <CalIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-400">Aucune tâche programmée pour cette date</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Styles CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          ::-webkit-scrollbar {
            width: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(236, 72, 153, 0.5);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(236, 72, 153, 0.7);
          }
        `
      }} />
    </div>
  );
};

export default Calendar;