import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  X,
  BookOpen,
  Briefcase,
  User,
  Heart,
  FileText
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
    other: FileText
  };

  // Fonctions de mapping pour convertir depuis votre API
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

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      const tasksArray = data.tasks || data;
      
      if (!Array.isArray(tasksArray)) {
        console.error('Format de données invalide:', data);
        setTasks([]);
        return;
      }
      
      // Conversion des tâches pour le calendrier
      const adaptedTasks = tasksArray.map(task => ({
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
      }));
      
      setTasks(adaptedTasks);
      console.log('✅ Tâches chargées:', adaptedTasks.length);
      
    } catch (error) {
      console.error('❌ Erreur chargement tâches:', error);
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
    
    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Jours du mois suivant pour compléter la grille
    const totalCells = 35;
    const remainingCells = totalCells - days.length;
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

  const handleTaskClick = (task, date) => {
    setSelectedTask(task);
    setSelectedDate(date);
    setShowTaskModal(true);
  };

  const closeModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
    setSelectedDate(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Chargement de votre calendrier...</p>
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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500 rounded">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mon Calendrier</h1>
                <p className="text-gray-400">{tasks.length} tâches au total</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Calendrier principal */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              
              {/* Navigation du mois */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <h2 className="text-xl font-bold text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-gray-300 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille du calendrier */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayTasks = getTasksForDate(day.date);
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] p-2 rounded-lg border transition-colors cursor-pointer
                        ${day.isCurrentMonth 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-800 border-gray-700 text-gray-500'
                        }
                        ${isToday(day.date) ? 'ring-2 ring-pink-500' : ''}
                      `}
                      onClick={() => {
                        if (dayTasks.length > 0) {
                          setSelectedDate(day.date);
                          setShowTaskModal(true);
                        }
                      }}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isToday(day.date) ? 'text-pink-400' : 
                        day.isCurrentMonth ? 'text-white' : 'text-gray-500'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map(task => {
                          const CategoryIcon = categoryIcons[task.category];
                          return (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task, day.date);
                              }}
                              className={`
                                text-xs p-2 rounded-lg flex items-center gap-2 mb-1 transition-all hover:scale-105
                                ${task.status === 'completed' 
                                  ? 'bg-green-600/90 text-white shadow-sm' 
                                  : isOverdue(task)
                                    ? 'bg-red-600/90 text-white shadow-sm'
                                    : 'bg-pink-600/90 text-white shadow-sm'
                                }
                              `}
                            >
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`}></div>
                              <CategoryIcon className="w-3 h-3 flex-shrink-0" />
                              <span className={`truncate flex-1 font-medium ${task.status === 'completed' ? 'line-through opacity-75' : ''}`}>
                                {task.title}
                              </span>
                              {task.time && (
                                <span className="text-xs opacity-90 bg-black/20 px-1 rounded">
                                  {task.time.slice(0,5)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-gray-400 text-center py-1 bg-gray-600 rounded">
                            +{dayTasks.length - 2} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-4">
            
            {/* Résumé */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📊 Résumé
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">Total</span>
                  <span className="text-white font-bold text-lg">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">En cours</span>
                  <span className="text-yellow-400 font-bold">{tasks.filter(t => t.status === 'pending').length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">Terminées</span>
                  <span className="text-green-400 font-bold">{tasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">En retard</span>
                  <span className="text-red-400 font-bold">{tasks.filter(t => isOverdue(t)).length}</span>
                </div>
              </div>
            </div>

            {/* Tâches du jour */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📅 Aujourd'hui
              </h3>
              {(() => {
                const todayTasks = getTasksForDate(new Date());
                return todayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {todayTasks.slice(0, 3).map(task => {
                      const CategoryIcon = categoryIcons[task.category];
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:scale-[1.02] transition-transform ${
                            task.status === 'completed' 
                              ? 'bg-green-600/20 border-green-600/30' 
                              : 'bg-pink-600/20 border-pink-600/30'
                          }`}
                          onClick={() => handleTaskClick(task, new Date())}
                        >
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4 text-pink-400" />
                            <span className={`text-white font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                              {task.title}
                            </span>
                          </div>
                          {task.time && (
                            <div className="text-sm text-gray-400 mt-1">
                              🕐 {task.time}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {todayTasks.length > 3 && (
                      <div className="text-center text-gray-400 text-sm">
                        +{todayTasks.length - 3} autres tâches
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    Aucune tâche aujourd'hui 🎉
                  </p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Modal pour afficher les détails des tâches */}
        {showTaskModal && (selectedTask || selectedDate) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedTask ? 'Détails de la tâche' : `Tâches du ${selectedDate?.toLocaleDateString('fr-FR')}`}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {selectedTask ? (
                // Affichage d'une tâche spécifique
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium">{selectedTask.title}</h4>
                    {selectedTask.description && (
                      <p className="text-gray-300 mt-2">{selectedTask.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Module:</span>
                      <div className="text-white">{selectedTask.module}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Priorité:</span>
                      <div className={`inline-block px-2 py-1 rounded text-white text-xs ${priorityColors[selectedTask.priority]}`}>
                        {selectedTask.priority}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Échéance:</span>
                      <div className="text-white">{new Date(selectedTask.deadline).toLocaleDateString('fr-FR')}</div>
                    </div>
                    {selectedTask.time && (
                      <div>
                        <span className="text-gray-400">Heure:</span>
                        <div className="text-white">{selectedTask.time}</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Statut:</span>
                    <div className={`inline-block px-2 py-1 rounded text-white text-xs ml-2 ${
                      selectedTask.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'
                    }`}>
                      {selectedTask.status === 'completed' ? 'Terminée' : 'En cours'}
                    </div>
                  </div>
                </div>
              ) : (
                // Affichage de toutes les tâches d'une date
                <div className="space-y-3">
                  {getTasksForDate(selectedDate).map(task => {
                    const CategoryIcon = categoryIcons[task.category];
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-700 ${
                          task.status === 'completed' 
                            ? 'bg-green-600/20 border-green-600/30' 
                            : isOverdue(task)
                              ? 'bg-red-600/20 border-red-600/30'
                              : 'bg-pink-600/20 border-pink-600/30'
                        }`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-pink-400" />
                          <span className={`text-white font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                            {task.title}
                          </span>
                          <div className={`w-2 h-2 rounded-full ml-auto ${priorityColors[task.priority]}`}></div>
                        </div>
                        {task.time && (
                          <div className="text-sm text-gray-400 mt-1">
                            🕐 {task.time}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;