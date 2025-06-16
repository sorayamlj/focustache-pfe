import Task from "../models/Task.js";
import Session from "../models/Session.js";
import mongoose from "mongoose";

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const now = new Date();
    
    // Dates pour les filtres
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Dimanche
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stats globales
    const totalTasks = await Task.countDocuments({ owners: userEmail });
    const completedTasks = await Task.countDocuments({ 
      owners: userEmail, 
      statut: "terminée" 
    });
    
    // Tâches cette semaine
    const thisWeekTasks = await Task.countDocuments({
      owners: userEmail,
      dateEcheance: { $gte: weekStart, $lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) }
    });

    // Tâches en retard
    const overdueTasks = await Task.countDocuments({
      owners: userEmail,
      dateEcheance: { $lt: today },
      statut: { $ne: "terminée" }
    });

    // Tâches complétées cette semaine
    const completedThisWeek = await Task.countDocuments({
      owners: userEmail,
      statut: "terminée",
      updatedAt: { $gte: weekStart }
    });

    // Temps total passé cette semaine
    const weeklyTimeSpent = await Session.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          endTime: { $exists: true },
          startTime: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$duration" }
        }
      }
    ]);

    // Répartition par priorité
    const priorityBreakdown = await Task.aggregate([
      { $match: { owners: userEmail } },
      {
        $group: {
          _id: "$priorite",
          count: { $sum: 1 }
        }
      }
    ]);

    // Répartition par statut
    const statusBreakdown = await Task.aggregate([
      { $match: { owners: userEmail } },
      {
        $group: {
          _id: "$statut",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: {
        totalTasks,
        completedTasks,
        thisWeekTasks,
        overdueTasks,
        completedThisWeek,
        weeklyTimeSpent: weeklyTimeSpent[0]?.totalDuration || 0,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      breakdown: {
        priority: priorityBreakdown,
        status: statusBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Erreur récupération dashboard", err });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // 10 dernières tâches modifiées
    const recentTasks = await Task.find({ owners: userEmail })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('titre statut module updatedAt');

    // 10 dernières sessions
    const recentSessions = await Session.find({ user: userId })
      .populate('taskId', 'titre module')
      .sort({ startTime: -1 })
      .limit(10);

    res.json({
      recentTasks,
      recentSessions
    });
  } catch (err) {
    res.status(500).json({ msg: "Erreur récupération activité", err });
  }
};