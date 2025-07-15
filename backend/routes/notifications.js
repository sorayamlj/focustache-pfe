// routes/notifications.js
import express from 'express';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes les routes sont protégées par authentification
router.use(verifyToken);

// GET /api/notifications - Récupérer les notifications de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, read, type } = req.query;
    
    // Construire le filtre
    const filter = { userId: req.user.id };
    
    if (read !== undefined) {
      filter.read = read === 'true';
    }
    
    if (type) {
      filter.type = type;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// GET /api/notifications/unread-count - Compter les notifications non lues
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// POST /api/notifications - Créer une nouvelle notification (pour tests/admin)
router.post('/', async (req, res) => {
  try {
    const { title, message, type = 'info', priority = 'normal', actionUrl, expiresAt, data } = req.body;

    if (!title) {
      return res.status(400).json({ msg: 'Le titre est requis' });
    }

    const notification = await Notification.createNotification(req.user.id, {
      title,
      message,
      type,
      priority,
      actionUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      data
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Erreur création notification:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification non trouvée' });
    }

    await notification.markAsRead();
    res.json({ msg: 'Notification marquée comme lue', notification });
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// PUT /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
router.put('/mark-all-read', async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);
    res.json({ 
      msg: `${result.modifiedCount} notifications marquées comme lues`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur marquage toutes notifications:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification non trouvée' });
    }

    res.json({ msg: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// DELETE /api/notifications - Supprimer toutes les notifications de l'utilisateur
router.delete('/', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user.id });
    res.json({ 
      msg: `${result.deletedCount} notifications supprimées`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Erreur suppression toutes notifications:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// DELETE /api/notifications/read - Supprimer toutes les notifications lues
router.delete('/read', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ 
      userId: req.user.id, 
      read: true 
    });
    res.json({ 
      msg: `${result.deletedCount} notifications lues supprimées`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Erreur suppression notifications lues:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;