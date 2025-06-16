import express from 'express';
import Task from '../models/Task.js';
import Session from '../models/Session.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protection : toutes les routes dashboard nécessitent une authentification
router.use(verifyToken);

// GET /api/dashboard/stats - Statistiques complètes
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7*24*60*60*1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // ===== STATS TÂCHES =====
    const allTasks = await Task.find({ user: userId });
    const completedTasks = allTasks.filter(t => t.statut === 'terminée');
    const activeTasks = allTasks.filter(t => t.statut === 'en cours');
    const pendingTasks = allTasks.filter(t => t.statut === 'à faire');
    const urgentTasks = allTasks.filter(t => t.priorite === 'haute' && t.statut !== 'terminée');
    
    // Tâches par période
    const todayTasks = allTasks.filter(t => t.createdAt >= todayStart);
    const weekTasks = allTasks.filter(t => t.createdAt >= weekStart);
    const monthTasks = allTasks.filter(t => t.createdAt >= monthStart);
    
    // ===== STATS SESSIONS =====
    const allSessions = await Session.find({ user: userId });
    const todaySessions = await Session.find({ 
      user: userId, 
      createdAt: { $gte: todayStart } 
    });
    const weekSessions = await Session.find({ 
      user: userId, 
      createdAt: { $gte: weekStart } 
    });
    
    // Temps total par période
    const totalTime = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const todayTime = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const weekTime = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // ===== STATS PAR MODULE =====
    const moduleStats = {};
    allTasks.forEach(task => {
      const module = task.module || 'Sans module';
      if (!moduleStats[module]) {
        moduleStats[module] = { total: 0, completed: 0, active: 0, pending: 0 };
      }
      moduleStats[module].total++;
      
      switch(task.statut) {
        case 'terminée':
          moduleStats[module].completed++;
          break;
        case 'en cours':
          moduleStats[module].active++;
          break;
        case 'à faire':
          moduleStats[module].pending++;
          break;
      }
    });
    
    const modules = Object.keys(moduleStats).map(module => ({
      name: module,
      tasks: moduleStats[module].total,
      completed: moduleStats[module].completed,
      active: moduleStats[module].active,
      pending: moduleStats[module].pending,
      progress: moduleStats[module].total > 0 ? 
        Math.round((moduleStats[module].completed / moduleStats[module].total) * 100) : 0
    }));
    
    // ===== PRODUCTIVITÉ =====
    const productivity = {
      tasksPerDay: weekTasks.length > 0 ? Math.round(weekTasks.length / 7) : 0,
      averageSessionDuration: allSessions.length > 0 ? 
        Math.round(totalTime / allSessions.length) : 0,
      completionRate: allTasks.length > 0 ? 
        Math.round((completedTasks.length / allTasks.length) * 100) : 0,
      efficiency: todaySessions.length > 0 ? 
        Math.round((todaySessions.filter(s => s.duration >= 25).length / todaySessions.length) * 100) : 0
    };
    
    // ===== RÉPONSE FINALE =====
    const stats = {
      user: {
        name: req.user.name || req.user.email,
        level: 'Étudiant',
        streak: 0, // À implémenter avec un système de streaks
        memberSince: req.user.createdAt
      },
      tasks: {
        total: allTasks.length,
        completed: completedTasks.length,
        active: activeTasks.length,
        pending: pendingTasks.length,
        urgent: urgentTasks.length,
        completionRate: productivity.completionRate,
        today: todayTasks.length,
        thisWeek: weekTasks.length,
        thisMonth: monthTasks.length
      },
      sessions: {
        total: allSessions.length,
        today: todaySessions.length,
        thisWeek: weekSessions.length,
        totalTime: Math.round(totalTime), // en minutes
        todayTime: Math.round(todayTime),
        weekTime: Math.round(weekTime),
        averageDuration: productivity.averageSessionDuration
      },
      productivity,
      modules: modules.sort((a, b) => b.tasks - a.tasks), // Trier par nombre de tâches
      summary: {
        mostActiveModule: modules.length > 0 ? modules[0].name : null,
        urgentTasksCount: urgentTasks.length,
        todayProductivity: todayTasks.length > 0 ? 'active' : 'low',
        weekTrend: weekTasks.length > monthTasks.length / 4 ? 'increasing' : 'decreasing'
      }
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/dashboard/recent - Activité récente
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Tâches récentes (dernières modifiées)
    const recentTasks = await Task.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('titre statut module priorite updatedAt dureeEstimee');
    
    // Sessions récentes
    const recentSessions = await Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('task', 'titre module')
      .select('duration createdAt task type');
    
    res.json({
      success: true,
      data: {
        recentTasks: recentTasks.map(task => ({
          id: task._id,
          titre: task.titre,
          statut: task.statut,
          module: task.module,
          priorite: task.priorite,
          updatedAt: task.updatedAt,
          dureeEstimee: task.dureeEstimee
        })),
        recentSessions: recentSessions.map(session => ({
          id: session._id,
          duration: session.duration,
          createdAt: session.createdAt,
          type: session.type || 'study',
          taskTitle: session.task?.titre || 'Tâche supprimée',
          taskModule: session.task?.module || 'N/A'
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur dashboard recent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'activité récente'
    });
  }
});

// GET /api/dashboard/charts - Données pour graphiques
router.get('/charts', async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Progression quotidienne
    const dailyStats = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24*60*60*1000);
      
      const dayTasks = await Task.countDocuments({
        user: userId,
        updatedAt: { $gte: dayStart, $lt: dayEnd },
        statut: 'terminée'
      });
      
      const daySessions = await Session.countDocuments({
        user: userId,
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      dailyStats.unshift({
        date: dayStart.toISOString().split('T')[0],
        tasks: dayTasks,
        sessions: daySessions
      });
    }
    
    res.json({
      success: true,
      data: {
        dailyProgress: dailyStats,
        period: `${days} derniers jours`
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur dashboard charts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des graphiques'
    });
  }
});

export default router;