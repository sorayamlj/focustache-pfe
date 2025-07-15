// backend/models/Session.js - VERSION CORRIGÉE
import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // UNE SEULE tâche par session (array pour compatibilité) - VALIDATION CORRIGÉE
  taskIds: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    }],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length === 1; // ✅ Validation sur le tableau entier
      },
      message: 'Une session ne peut contenir qu\'exactement une seule tâche'
    },
    required: true
  },
  
  // Timing principal
  dateDebut: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  dateFin: {
    type: Date,
    default: null
  },
  
  tempsEcoule: {
    type: Number, // en secondes
    default: 0,
    min: 0
  },
  
  tempsTotal: {
    type: Number, // durée estimée en secondes (optionnel)
    default: null,
    min: 0
  },
  
  // États du timer
  timerActif: {
    type: Boolean,
    default: false
  },
  
  timerPause: {
    type: Boolean,
    default: false
  },
  
  // Modes de travail
  focusActif: {
    type: Boolean,
    default: false
  },
  
  chronodoroMode: {
    type: Boolean,
    default: false
  },
  
  // Configuration Pomodoro (intégré dans Focus)
  dureeCycle: {
    type: Number, // en secondes (ex: 1500 = 25min)
    default: null,
    min: 300, // 5 minutes minimum
    max: 3600 // 60 minutes maximum
  },
  
  cyclesTotalPrevus: {
    type: Number,
    default: null,
    min: 1,
    max: 12
  },
  
  cycleCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  cycleType: {
    type: String,
    enum: ['work', 'break'],
    default: 'work'
  },
  
  // Fonctionnalités
  notificationsBloquees: {
    type: Boolean,
    default: false
  },
  
  // Statistiques de performance
  nombrePauses: {
    type: Number,
    default: 0,
    min: 0
  },
  
  efficaciteCalculee: {
    type: Number, // pourcentage de 0 à 100
    default: 0,
    min: 0,
    max: 100
  },
  
  // Statut de la session
  statut: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  
  // Notes finales (optionnel)
  notes: {
    type: String,
    default: '',
    maxLength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index composés pour performance
SessionSchema.index({ user: 1, statut: 1 });
SessionSchema.index({ user: 1, createdAt: -1 });
SessionSchema.index({ user: 1, dateFin: -1 });
SessionSchema.index({ statut: 1, createdAt: -1 });

// Virtual pour la tâche principale (simplifie l'accès)
SessionSchema.virtual('task').get(function() {
  return this.taskIds && this.taskIds.length > 0 ? this.taskIds[0] : null;
});

// Virtual pour la durée totale calculée
SessionSchema.virtual('dureeTotaleSession').get(function() {
  if (this.dateFin && this.dateDebut) {
    return Math.floor((this.dateFin - this.dateDebut) / 1000);
  }
  return this.tempsEcoule || 0;
});

// Virtual pour le temps productif (sans pauses)
SessionSchema.virtual('tempsProductif').get(function() {
  const pauseTime = this.nombrePauses * 60; // 1 minute par pause estimée
  return Math.max(0, this.tempsEcoule - pauseTime);
});

// Virtual pour le temps restant
SessionSchema.virtual('tempsRestant').get(function() {
  if (this.chronodoroMode && this.dureeCycle) {
    // Temps restant dans le cycle actuel
    return this.dureeCycle - (this.tempsEcoule % this.dureeCycle);
  } else if (this.tempsTotal && this.tempsTotal > 0) {
    // Temps restant total
    return Math.max(0, this.tempsTotal - this.tempsEcoule);
  }
  return null;
});

// Virtual pour la progression en pourcentage
SessionSchema.virtual('progressionPourcentage').get(function() {
  if (this.chronodoroMode && this.dureeCycle) {
    const cycleProgress = (this.tempsEcoule % this.dureeCycle) / this.dureeCycle;
    return Math.min(100, cycleProgress * 100);
  } else if (this.tempsTotal && this.tempsTotal > 0) {
    return Math.min(100, (this.tempsEcoule / this.tempsTotal) * 100);
  }
  return 0;
});

// Virtual pour l'efficacité (recalculée)
SessionSchema.virtual('efficacite').get(function() {
  if (this.tempsTotal && this.tempsTotal > 0) {
    const timeEfficiency = Math.min(100, (this.tempsEcoule / this.tempsTotal) * 100);
    const pausePenalty = this.nombrePauses * 3; // 3% par pause
    return Math.max(0, Math.round(timeEfficiency - pausePenalty));
  }
  return this.efficaciteCalculee || 0;
});

// Virtual pour le formatage de durée
SessionSchema.virtual('dureeFormatee').get(function() {
  const seconds = this.dureeTotaleSession;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else if (minutes > 0) {
    return `${minutes}min ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
});

// Virtual pour les infos Pomodoro
SessionSchema.virtual('pomodoroInfo').get(function() {
  if (!this.chronodoroMode || !this.dureeCycle) return null;
  
  const currentCycleTime = this.tempsEcoule % this.dureeCycle;
  const cycleNumber = Math.floor(this.tempsEcoule / this.dureeCycle) + 1;
  const remainingTime = this.dureeCycle - currentCycleTime;
  const progress = (currentCycleTime / this.dureeCycle) * 100;
  
  return {
    cycleActuel: cycleNumber,
    cyclesTotaux: this.cyclesTotalPrevus,
    tempsRestantCycle: remainingTime,
    progressionCycle: Math.min(100, progress),
    typeCycle: this.cycleType,
    cyclesCompletes: Math.floor(this.cycleCount / 2)
  };
});

// Méthodes d'instance pour la gestion du timer
SessionSchema.methods.startFocus = function(dureeMinutes = null) {
  this.focusActif = true;
  this.notificationsBloquees = true;
  this.timerActif = true;
  this.timerPause = false;
  this.chronodoroMode = false; // S'assurer que Pomodoro est désactivé
  
  if (dureeMinutes && dureeMinutes > 0) {
    this.tempsTotal = dureeMinutes * 60;
  }
  
  return this.save();
};

SessionSchema.methods.startPomodoro = function(dureeCycleMinutes = 25, nombreCycles = 4) {
  this.chronodoroMode = true;
  this.focusActif = true;
  this.notificationsBloquees = true;
  this.timerActif = true;
  this.timerPause = false;
  this.dureeCycle = dureeCycleMinutes * 60;
  this.cyclesTotalPrevus = nombreCycles;
  this.cycleCount = 0;
  this.cycleType = 'work';
  
  return this.save();
};

SessionSchema.methods.pauseTimer = function() {
  if (!this.focusActif) {
    throw new Error('Le mode Focus doit être actif pour mettre en pause');
  }
  
  this.timerActif = false;
  this.timerPause = true;
  this.nombrePauses = (this.nombrePauses || 0) + 1;
  
  return this.save();
};

SessionSchema.methods.resumeTimer = function() {
  if (!this.timerPause) {
    throw new Error('Le timer n\'est pas en pause');
  }
  
  this.timerActif = true;
  this.timerPause = false;
  
  return this.save();
};

SessionSchema.methods.completePomodoroCycle = function() {
  if (!this.chronodoroMode) {
    throw new Error('Le mode Pomodoro n\'est pas actif');
  }
  
  this.cycleCount += 1;
  
  // Alterner entre travail et pause
  if (this.cycleType === 'work') {
    this.cycleType = 'break';
  } else {
    this.cycleType = 'work';
  }
  
  return this.save();
};

SessionSchema.methods.completeSession = function(notes = '') {
  this.statut = 'completed';
  this.dateFin = new Date();
  this.timerActif = false;
  this.notes = notes;
  
  // Calculer l'efficacité finale
  if (this.tempsTotal && this.tempsTotal > 0) {
    const timeEfficiency = Math.min(100, (this.tempsEcoule / this.tempsTotal) * 100);
    const pausePenalty = this.nombrePauses * 3;
    this.efficaciteCalculee = Math.max(0, Math.round(timeEfficiency - pausePenalty));
  } else {
    // Si pas de temps estimé, baser sur la durée minimale raisonnable
    this.efficaciteCalculee = this.tempsEcoule >= 1500 ? 85 : 60; // 25min+ = bon score
  }
  
  return this.save();
};

SessionSchema.methods.cancelSession = function(notes = '') {
  this.statut = 'cancelled';
  this.dateFin = new Date();
  this.timerActif = false;
  this.notes = notes;
  this.efficaciteCalculee = 0;
  
  return this.save();
};

// Méthodes statiques pour les requêtes communes
SessionSchema.statics.findActiveSession = function(userId) {
  return this.findOne({
    user: userId,
    statut: 'active'
  }).populate('taskIds', 'titre module priorite statut dateEcheance');
};

SessionSchema.statics.getUserSessionHistory = function(userId, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  
  return this.find({
    user: userId,
    statut: { $in: ['completed', 'cancelled'] }
  })
  .sort({ dateFin: -1, createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('taskIds', 'titre module priorite');
};

SessionSchema.statics.getSessionStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
        statut: { $in: ['completed', 'cancelled'] }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        sessionsCompleted: {
          $sum: { $cond: [{ $eq: ['$statut', 'completed'] }, 1, 0] }
        },
        totalTemps: {
          $sum: { $cond: [{ $eq: ['$statut', 'completed'] }, '$tempsEcoule', 0] }
        },
        totalFocus: {
          $sum: { 
            $cond: [
              { $and: [{ $eq: ['$statut', 'completed'] }, { $eq: ['$focusActif', true] }] }, 
              '$tempsEcoule', 
              0
            ] 
          }
        },
        totalPomodoro: {
          $sum: { 
            $cond: [
              { $and: [{ $eq: ['$statut', 'completed'] }, { $eq: ['$chronodoroMode', true] }] }, 
              '$cycleCount', 
              0
            ] 
          }
        },
        efficaciteMoyenne: {
          $avg: { $cond: [{ $eq: ['$statut', 'completed'] }, '$efficaciteCalculee', null] }
        }
      }
    }
  ]);
};

// Middleware pre-save pour validations
SessionSchema.pre('save', function(next) {
  // Validation : Si Pomodoro actif, Focus doit aussi être actif
  if (this.chronodoroMode && !this.focusActif) {
    this.focusActif = true;
    this.notificationsBloquees = true;
  }
  
  // Validation : Timer ne peut pas être actif ET en pause
  if (this.timerActif && this.timerPause) {
    this.timerPause = false;
  }
  
  // Auto-calcul efficacité si session complétée
  if (this.statut === 'completed' && this.efficaciteCalculee === 0) {
    if (this.tempsTotal && this.tempsTotal > 0) {
      const timeEfficiency = Math.min(100, (this.tempsEcoule / this.tempsTotal) * 100);
      const pausePenalty = this.nombrePauses * 3;
      this.efficaciteCalculee = Math.max(0, Math.round(timeEfficiency - pausePenalty));
    } else {
      this.efficaciteCalculee = this.tempsEcoule >= 1500 ? 80 : 50;
    }
  }
  
  next();
});

// Middleware pre-remove pour nettoyer les références
SessionSchema.pre('remove', function(next) {
  // Ici on pourrait nettoyer des références dans d'autres collections si besoin
  next();
});

// Méthode pour obtenir un résumé de session
SessionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    tache: this.task,
    duree: this.dureeFormatee,
    efficacite: this.efficacite,
    mode: this.chronodoroMode ? 'Pomodoro' : this.focusActif ? 'Focus' : 'Standard',
    statut: this.statut,
    pauses: this.nombrePauses,
    cyclesPomodoro: this.chronodoroMode ? Math.floor(this.cycleCount / 2) : 0,
    dateDebut: this.dateDebut,
    dateFin: this.dateFin
  };
};

export default mongoose.model('Session', SessionSchema);