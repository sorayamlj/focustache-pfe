// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'task', 'timer', 'calendar', 'system'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  // Données additionnelles selon le type
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Priorité de la notification
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // URL d'action optionnelle
  actionUrl: {
    type: String,
    trim: true
  },
  // Date d'expiration optionnelle
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthode pour marquer comme lu
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Méthode statique pour créer une notification
notificationSchema.statics.createNotification = async function(userId, notificationData) {
  const notification = new this({
    userId,
    ...notificationData
  });
  
  return await notification.save();
};

// Méthode statique pour obtenir les notifications non lues
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, read: false });
};

// Méthode statique pour marquer toutes comme lues
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, read: false },
    { read: true }
  );
};

export default mongoose.model('Notification', notificationSchema);