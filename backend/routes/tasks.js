// routes/tasks.js - VERSION TEMPORAIRE SANS AUTHENTIFICATION
import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  shareTask,
  exportTasks,
  getTaskStats,
  searchTasks
} from "../controllers/taskController.js";
// import { verifyToken } from "../middleware/authMiddleware.js";  // ← COMMENTÉ
import { upload } from "../middleware/uploadMiddleware.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { transporter } from "../utils/mailer.js";
import mongoose from "mongoose";

const router = express.Router();

// Middleware temporaire pour simuler un utilisateur connecté
const fakeUser = (req, res, next) => {
  req.user = {
    id: '507f1f77bcf86cd799439011', // ID MongoDB valide
    email: 'test@gmail.com'
  };
  next();
};

// ✅ Routes principales CRUD - SANS verifyToken
router.get("/", fakeUser, getTasks);
router.post("/", fakeUser, createTask);
router.put("/:id", fakeUser, updateTask);
router.delete("/:id", fakeUser, deleteTask);

// ✅ Upload de fichiers
router.post("/upload", fakeUser, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Aucun fichier envoyé" });
    }
    
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    console.log("Fichier uploadé:", fileUrl);
    
    res.status(200).json({ 
      fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ msg: "Erreur lors de l'upload" });
  }
});

// ✅ Recherche avancée
router.get("/search", fakeUser, searchTasks);

// ✅ Stats et analytics
router.get("/stats", fakeUser, getTaskStats);

// ✅ Export
router.get("/export", fakeUser, exportTasks);

// ✅ Modules de l'utilisateur (pour auto-complétion)
router.get("/modules", fakeUser, async (req, res) => {
  try {
    const modules = await Task.distinct("module", { 
      owners: req.user.email,
      module: { $exists: true, $ne: "" },
      statut: { $ne: 'supprimée' }
    });
    res.json(modules.sort());
  } catch (err) {
    console.error("Erreur récupération modules:", err);
    res.status(500).json({ msg: "Erreur récupération modules", error: err.message });
  }
});

// ✅ Vue Kanban (groupé par statut)
router.get("/kanban", fakeUser, async (req, res) => {
  try {
    const { module, priority } = req.query;
    
    let filter = { owners: req.user.email, statut: { $ne: 'supprimée' } };
    if (module) filter.module = new RegExp(module, 'i');
    if (priority) filter.priorite = priority;
    
    const tasks = await Task.find(filter).sort({ dateEcheance: 1 });
    
    const kanban = {
      "à faire": tasks.filter(t => t.statut === "à faire"),
      "en cours": tasks.filter(t => t.statut === "en cours"),
      "terminée": tasks.filter(t => t.statut === "terminée")
    };
    
    res.json(kanban);
  } catch (err) {
    console.error("Erreur vue Kanban:", err);
    res.status(500).json({ msg: "Erreur vue Kanban", error: err.message });
  }
});

// ✅ Partage et collaboration - Route existante améliorée
router.put("/share/:id", fakeUser, shareTask);

// 🆕 Retirer un collaborateur d'une tâche
router.put("/:id/unshare", fakeUser, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    // Validation de l'ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de tâche invalide" });
    }

    // Validation email
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!email || !gmailRegex.test(email)) {
      return res.status(400).json({ msg: "Adresse Gmail valide requise" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ msg: "Tâche introuvable" });
    }

    // Vérifier que l'utilisateur actuel est propriétaire (premier owner)
    if (task.owners[0] !== req.user.email) {
      return res.status(403).json({ msg: "Seul le propriétaire peut retirer des collaborateurs" });
    }

    // Empêcher de se retirer soi-même si on est propriétaire
    if (email === req.user.email) {
      return res.status(400).json({ msg: "Le propriétaire ne peut pas se retirer de la tâche" });
    }

    // Vérifier que l'email est bien dans la liste des collaborateurs
    if (!task.owners.includes(email)) {
      return res.status(400).json({ msg: "Cet utilisateur ne collabore pas sur cette tâche" });
    }

    // Retirer l'email de la liste des propriétaires
    task.owners = task.owners.filter(owner => owner !== email);
    await task.save();

    console.log("Collaborateur retiré:", email, "de la tâche", task._id);
    res.json({ 
      msg: "Collaborateur retiré avec succès", 
      task,
      removedUser: email
    });
  } catch (err) {
    console.error("Erreur unshare:", err);
    res.status(500).json({ 
      msg: "Erreur lors du retrait du collaborateur", 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🆕 Obtenir les notifications de l'utilisateur
router.get("/notifications", fakeUser, async (req, res) => {
  try {
    // Tâches récemment partagées avec l'utilisateur (dans les 7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSharedTasks = await Task.find({
      owners: req.user.email,
      createdAt: { $gte: sevenDaysAgo },
      statut: { $ne: 'supprimée' },
      $expr: { $gt: [{ $size: "$owners" }, 1] } // Tâches avec plus d'un propriétaire
    }).sort({ createdAt: -1 });

    // Tâches en retard
    const overdueTasks = await Task.find({
      owners: req.user.email,
      statut: { $ne: 'terminée', $ne: 'supprimée' },
      dateEcheance: { $lt: new Date() }
    }).sort({ dateEcheance: 1 });

    // Tâches dues aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.find({
      owners: req.user.email,
      statut: { $ne: 'terminée', $ne: 'supprimée' },
      dateEcheance: { $gte: today, $lt: tomorrow }
    }).sort({ dateEcheance: 1 });

    const notifications = [
      ...recentSharedTasks.map(task => ({
        type: 'shared',
        message: `Nouvelle tâche partagée: "${task.titre}"`,
        task: task._id,
        date: task.createdAt
      })),
      ...overdueTasks.map(task => ({
        type: 'overdue',
        message: `Tâche en retard: "${task.titre}"`,
        task: task._id,
        date: task.dateEcheance
      })),
      ...tasksDueToday.map(task => ({
        type: 'due_today',
        message: `Échéance aujourd'hui: "${task.titre}"`,
        task: task._id,
        date: task.dateEcheance
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      notifications: notifications.slice(0, 10), // Limiter à 10 notifications
      counts: {
        total: notifications.length,
        overdue: overdueTasks.length,
        dueToday: tasksDueToday.length,
        recentShared: recentSharedTasks.length
      }
    });
  } catch (err) {
    console.error("Erreur notifications:", err);
    res.status(500).json({ msg: "Erreur récupération notifications" });
  }
});

// ✅ Toutes les autres routes avec fakeUser au lieu de verifyToken
router.get("/collaborative", fakeUser, async (req, res) => { /* ... */ });
router.put("/:id/view", fakeUser, async (req, res) => { /* ... */ });
router.put("/:id/time", fakeUser, async (req, res) => { /* ... */ });
router.put("/:id/pomodoro", fakeUser, async (req, res) => { /* ... */ });
router.post("/:id/comments", fakeUser, async (req, res) => { /* ... */ });
router.put("/:id/soft-delete", fakeUser, async (req, res) => { /* ... */ });
router.put("/:id/restore", fakeUser, async (req, res) => { /* ... */ });
router.get("/overdue", fakeUser, async (req, res) => { /* ... */ });
router.post("/:id/duplicate", fakeUser, async (req, res) => { /* ... */ });

export default router;