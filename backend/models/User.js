// models/User.js - VERSION MISE À JOUR avec préférences et avatar
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null // URL de l'avatar
  },
  studentInfo: {
    university: {
      type: String,
      trim: true
    },
    faculty: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    cne: {
      type: String,
      trim: true,
      uppercase: true
    },
    academicYear: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  emailType: {
    type: String,
    enum: ['gmail', 'university'],
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  validationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  validationMethod: {
    type: String,
    enum: ['university_email', 'student_info'],
    default: 'student_info'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Nouvelles préférences utilisateur
  preferences: {
    // Thème et apparence
    darkMode: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['fr', 'en', 'ar'],
      default: 'fr'
    },
    // Paramètres Pomodoro
    pomodoroSettings: {
      workDuration: {
        type: Number,
        default: 25,
        min: 5,
        max: 60
      },
      shortBreak: {
        type: Number,
        default: 5,
        min: 1,
        max: 30
      },
      longBreak: {
        type: Number,
        default: 15,
        min: 5,
        max: 60
      },
      longBreakInterval: {
        type: Number,
        default: 4,
        min: 2,
        max: 10
      },
      autoStartBreaks: {
        type: Boolean,
        default: false
      },
      autoStartPomodoros: {
        type: Boolean,
        default: false
      },
      soundEnabled: {
        type: Boolean,
        default: true
      },
      soundVolume: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      }
    },
    // Paramètres de tâches
    taskSettings: {
      defaultPriority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      showCompletedTasks: {
        type: Boolean,
        default: true
      },
      sortBy: {
        type: String,
        enum: ['dueDate', 'priority', 'createdAt', 'alphabetical'],
        default: 'dueDate'
      },
      autoArchiveCompletedTasks: {
        type: Boolean,
        default: false
      },
      autoArchiveDays: {
        type: Number,
        default: 30,
        min: 1,
        max: 365
      }
    },
    // Paramètres de notifications
    notificationSettings: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      taskReminders: {
        type: Boolean,
        default: true
      },
      sessionReminders: {
        type: Boolean,
        default: true
      },
      calendarReminders: {
        type: Boolean,
        default: true
      }
    },
    // Paramètres d'affichage
    displaySettings: {
      compactMode: {
        type: Boolean,
        default: false
      },
      showSidebar: {
        type: Boolean,
        default: true
      },
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY'
      },
      timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '24h'
      },
      firstDayOfWeek: {
        type: String,
        enum: ['monday', 'sunday'],
        default: 'monday'
      }
    }
  },
  // Statistiques utilisateur
  stats: {
    totalTasksCompleted: {
      type: Number,
      default: 0
    },
    totalPomodoroSessions: {
      type: Number,
      default: 0
    },
    totalFocusTime: {
      type: Number,
      default: 0 // en minutes
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    }
  },
  // Paramètres Google Calendar
  googleCalendar: {
    isConnected: {
      type: Boolean,
      default: false
    },
    refreshToken: {
      type: String
    },
    accessToken: {
      type: String
    },
    calendarId: {
      type: String
    },
    syncEnabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
userSchema.index({ email: 1 });
userSchema.index({ validationStatus: 1 });
userSchema.index({ role: 1 });
userSchema.index({ emailType: 1 });
userSchema.index({ 'studentInfo.cne': 1 });

// Méthode pour obtenir les préférences avec valeurs par défaut
userSchema.methods.getPreferences = function() {
  const defaultPreferences = {
    darkMode: true,
    notifications: true,
    language: 'fr',
    pomodoroSettings: {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: true,
      soundVolume: 50
    },
    taskSettings: {
      defaultPriority: 'medium',
      showCompletedTasks: true,
      sortBy: 'dueDate',
      autoArchiveCompletedTasks: false,
      autoArchiveDays: 30
    },
    notificationSettings: {
      email: true,
      push: true,
      taskReminders: true,
      sessionReminders: true,
      calendarReminders: true
    },
    displaySettings: {
      compactMode: false,
      showSidebar: true,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      firstDayOfWeek: 'monday'
    }
  };

  return { ...defaultPreferences, ...this.preferences };
};

// Méthode pour mettre à jour les statistiques
userSchema.methods.updateStats = function(updates) {
  Object.assign(this.stats, updates);
  this.stats.lastActiveDate = new Date();
  return this.save();
};

// Méthode pour incrementer les statistiques
userSchema.methods.incrementStats = function(field, value = 1) {
  this.stats[field] = (this.stats[field] || 0) + value;
  this.stats.lastActiveDate = new Date();
  return this.save();
};

// Méthode pour calculer et mettre à jour la série
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActive = this.stats.lastActiveDate;
  
  if (lastActive) {
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Jour consécutif
      this.stats.currentStreak += 1;
      if (this.stats.currentStreak > this.stats.longestStreak) {
        this.stats.longestStreak = this.stats.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Série cassée
      this.stats.currentStreak = 1;
    }
    // Si daysDiff === 0, même jour, on ne change rien
  } else {
    // Premier jour d'activité
    this.stats.currentStreak = 1;
    this.stats.longestStreak = 1;
  }
  
  this.stats.lastActiveDate = today;
  return this.save();
};

// Méthode pour obtenir le profil public (sans données sensibles)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    nom: this.nom,
    avatar: this.avatar,
    studentInfo: {
      university: this.studentInfo.university,
      faculty: this.studentInfo.faculty,
      city: this.studentInfo.city
    },
    stats: this.stats,
    createdAt: this.createdAt
  };
};

// Méthode statique pour les statistiques globales
userSchema.statics.getGlobalStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        approvedUsers: {
          $sum: { $cond: [{ $eq: ['$validationStatus', 'approved'] }, 1, 0] }
        },
        pendingUsers: {
          $sum: { $cond: [{ $eq: ['$validationStatus', 'pending'] }, 1, 0] }
        },
        gmailUsers: {
          $sum: { $cond: [{ $eq: ['$emailType', 'gmail'] }, 1, 0] }
        },
        universityUsers: {
          $sum: { $cond: [{ $eq: ['$emailType', 'university'] }, 1, 0] }
        },
        totalTasksCompleted: { $sum: '$stats.totalTasksCompleted' },
        totalPomodoroSessions: { $sum: '$stats.totalPomodoroSessions' },
        totalFocusTime: { $sum: '$stats.totalFocusTime' }
      }
    }
  ]);

  return stats[0] || {
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    gmailUsers: 0,
    universityUsers: 0,
    totalTasksCompleted: 0,
    totalPomodoroSessions: 0,
    totalFocusTime: 0
  };
};

export default mongoose.model('User', userSchema);