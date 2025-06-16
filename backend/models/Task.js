import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  titre: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dateEcheance: { type: Date, required: true },
  priorite: { 
    type: String, 
    enum: ["basse", "moyenne", "haute"], 
    default: "moyenne" 
  },
  statut: { 
    type: String, 
    enum: ["à faire", "en cours", "terminée", "supprimée"], 
    default: "à faire" 
  },
  module: { type: String, required: true, trim: true }, // ✅ Rendu obligatoire car utilisé dans le frontend
  categorie: { 
    type: String, 
    enum: ["universitaire", "para-universitaire", "autre"],
    default: "autre"
  },
  
  // ✅ Ajout du champ lien manquant
  lien: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optionnel
        // Validation URL simple
        return /^https?:\/\/.+/.test(v) || /^www\..+/.test(v) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(v);
      },
      message: "Veuillez entrer une URL valide"
    }
  },
  
  fichierUrl: { type: String, trim: true },
  owners: {
    type: [String],
    required: true,
    validate: {
      validator: function(emails) {
        return emails.every(email => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email));
      },
      message: "Toutes les adresses doivent être des emails Gmail valides"
    }
  },
  
  // Nouvelles propriétés
  templateId: { type: String }, // Si créée depuis un template
  dureeEstimee: { type: Number, min: 0 }, // En minutes, avec validation
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }, // Pour les sous-tâches
  tags: [{ type: String, trim: true }], // Tags personnalisés
  rappels: [{
    date: { type: Date },
    message: { type: String },
    envoye: { type: Boolean, default: false }
  }],
  
  // Métadonnées
  completedAt: { type: Date }, // Date de completion
  deletedAt: { type: Date }, // Pour soft delete
  lastViewedAt: { type: Date, default: Date.now }, // Dernière consultation
  
  // Collaboration
  comments: [{
    author: { type: String, required: true }, // Email de l'auteur
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Tracking productivité
  timeSpent: { type: Number, default: 0, min: 0 }, // Temps total en secondes
  pomodoroCount: { type: Number, default: 0, min: 0 }, // Nombre de pomodoros complétés
  
}, { 
  timestamps: true,
  // Options pour optimiser les performances
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Index pour recherche textuelle (amélioré)
taskSchema.index({ 
  titre: "text", 
  description: "text", 
  module: "text",
  tags: "text"
}, {
  weights: {
    titre: 10,      // Titre plus important
    module: 5,      // Module important
    description: 1, // Description moins importante
    tags: 3         // Tags moyennement importants
  }
});

// ✅ Index pour les requêtes fréquentes (optimisés)
taskSchema.index({ owners: 1, statut: 1, dateEcheance: 1 }); // Compound index
taskSchema.index({ owners: 1, priorite: 1 });
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ dateEcheance: 1, statut: 1 }); // Pour les tâches en retard

// ✅ Virtual pour calculer si la tâche est en retard
taskSchema.virtual('isOverdue').get(function() {
  return this.statut !== 'terminée' && new Date() > this.dateEcheance;
});

// ✅ Virtual pour calculer les jours restants
taskSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const diffTime = this.dateEcheance - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ✅ Virtual pour le pourcentage de progression estimé
taskSchema.virtual('progressPercentage').get(function() {
  if (!this.dureeEstimee || this.dureeEstimee === 0) return 0;
  return Math.min(100, Math.round((this.timeSpent / (this.dureeEstimee * 60)) * 100));
});

// ✅ Virtual pour URL formatée
taskSchema.virtual('formattedUrl').get(function() {
  if (!this.lien) return null;
  if (this.lien.startsWith('http')) return this.lien;
  if (this.lien.startsWith('www.')) return `https://${this.lien}`;
  return `https://${this.lien}`;
});

// ✅ Middleware pour mettre à jour completedAt
taskSchema.pre('save', function(next) {
  if (this.isModified('statut')) {
    if (this.statut === 'terminée' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.statut !== 'terminée') {
      this.completedAt = undefined;
    }
  }
  
  // Mettre à jour lastViewedAt
  if (this.isModified() && !this.isNew) {
    this.lastViewedAt = new Date();
  }
  
  next();
});

// ✅ Middleware pour soft delete (amélioré)
taskSchema.pre(/^find/, function(next) {
  // Par défaut, exclure les tâches supprimées sauf si explicitement demandées
  if (!this.getQuery().statut && !this.getQuery().includeDeleted) {
    this.find({ statut: { $ne: 'supprimée' } });
  }
  next();
});

// ✅ Méthodes statiques utiles (améliorées)
taskSchema.statics.findActive = function(userEmail) {
  return this.find({ 
    owners: userEmail, 
    statut: { $in: ['à faire', 'en cours'] } 
  }).sort({ dateEcheance: 1 });
};

taskSchema.statics.findOverdue = function(userEmail) {
  return this.find({ 
    owners: userEmail, 
    statut: { $ne: 'terminée' },
    dateEcheance: { $lt: new Date() }
  }).sort({ dateEcheance: 1 });
};

taskSchema.statics.findByModule = function(userEmail, module) {
  return this.find({ 
    owners: userEmail, 
    module: new RegExp(module, 'i') 
  }).sort({ dateEcheance: 1 });
};

taskSchema.statics.getModules = function(userEmail) {
  return this.distinct("module", { 
    owners: userEmail,
    module: { $exists: true, $ne: "" }
  });
};

taskSchema.statics.getStats = function(userEmail) {
  return this.aggregate([
    { $match: { owners: userEmail, statut: { $ne: 'supprimée' } } },
    { 
      $group: {
        _id: "$statut",
        count: { $sum: 1 }
      }
    }
  ]);
};

// ✅ Méthodes d'instance (améliorées)
taskSchema.methods.addComment = function(authorEmail, message) {
  this.comments.push({
    author: authorEmail,
    message: message.trim(),
    createdAt: new Date()
  });
  return this.save();
};

taskSchema.methods.addTimeSpent = function(duration) {
  if (duration > 0) {
    this.timeSpent += duration;
    this.lastViewedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

taskSchema.methods.incrementPomodoro = function() {
  this.pomodoroCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

taskSchema.methods.shareWith = function(email) {
  if (!this.owners.includes(email)) {
    this.owners.push(email);
    return this.save();
  }
  return Promise.resolve(this);
};

taskSchema.methods.softDelete = function() {
  this.statut = 'supprimée';
  this.deletedAt = new Date();
  return this.save();
};

taskSchema.methods.restore = function() {
  if (this.statut === 'supprimée') {
    this.statut = 'à faire';
    this.deletedAt = undefined;
    return this.save();
  }
  return Promise.resolve(this);
};

export default mongoose.model("Task", taskSchema);