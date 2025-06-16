// backend/server.js - VERSION COMPLÈTE MODIFIÉE
import connectDB from "./config/db.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import des routes existantes
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import sessionRoutes from "./routes/sessions.js";
import googleRoutes from "./routes/google.js";

// Import des nouvelles routes
import dashboardRoutes from "./routes/dashboard.js";
import noteRoutes from "./routes/notes.js";

dotenv.config();

const app = express();

connectDB();


// __dirname en ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS restreint selon l'env
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://app.focustache.com"
        : ["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging pour le développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check amélioré
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    message: 'FocusTâche API - Toutes fonctionnalités activées',
    features: [
      'Templates étudiants',
      'Dashboard avancé', 
      'Système Pomodoro',
      'Vue Kanban',
      'Authentification',
      'Upload fichiers'
    ]
  });
});

// ===== ROUTES API EXISTANTES =====
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/google", googleRoutes);

// ===== NOUVELLES ROUTES API =====
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notes", noteRoutes);
// ===== TEMPLATES ÉTUDIANTS INTÉGRÉS =====
const STUDENT_TEMPLATES = [
  {
    id: 'essai-academique',
    titre: 'Rédaction d\'essai académique',
    description: 'Recherche bibliographique + plan détaillé + rédaction + relecture critique',
    dureeEstimee: 180, // 3h
    priorite: 'haute',
    categorie: 'universitaire',
    etapes: [
      'Recherche et lecture des sources',
      'Élaboration du plan détaillé', 
      'Rédaction de l\'introduction',
      'Développement des arguments',
      'Rédaction de la conclusion',
      'Relecture et corrections'
    ],
    conseils: [
      'Utilisez des sources académiques fiables',
      'Citez correctement vos références',
      'Structurez clairement vos idées'
    ]
  },
  {
    id: 'projet-groupe',
    titre: 'Projet de groupe',
    description: 'Coordination équipe + développement collaboratif + présentation finale',
    dureeEstimee: 1200, // 20h
    priorite: 'haute',
    categorie: 'universitaire',
    etapes: [
      'Répartition des tâches et responsabilités',
      'Recherche et documentation',
      'Développement/Réalisation',
      'Tests et validation',
      'Préparation de la présentation',
      'Documentation finale'
    ],
    conseils: [
      'Définissez un planning clair',
      'Utilisez des outils collaboratifs',
      'Communiquez régulièrement'
    ]
  },
  {
    id: 'revision-examen',
    titre: 'Révision pour examen',
    description: 'Planning de révision + fiches résumé + exercices + simulations',
    dureeEstimee: 600, // 10h
    priorite: 'haute',
    categorie: 'universitaire',
    etapes: [
      'Établir un planning de révision',
      'Créer des fiches de synthèse',
      'Faire des exercices types',
      'Simulations d\'examen',
      'Révision finale ciblée'
    ],
    conseils: [
      'Révisez régulièrement sans surcharge',
      'Alternez théorie et pratique',
      'Prenez des pauses régulières'
    ]
  },
  {
    id: 'memoire-recherche',
    titre: 'Mémoire de recherche',
    description: 'Recherche approfondie + méthodologie + rédaction + soutenance',
    dureeEstimee: 2400, // 40h
    priorite: 'haute',
    categorie: 'universitaire',
    etapes: [
      'Définition de la problématique',
      'État de l\'art et revue littéraire',
      'Méthodologie de recherche',
      'Collecte et analyse des données',
      'Rédaction du mémoire',
      'Préparation de la soutenance'
    ],
    conseils: [
      'Choisissez un sujet qui vous passionne',
      'Organisez votre bibliographie',
      'Respectez les normes académiques'
    ]
  },
  {
    id: 'stage-rapport',
    titre: 'Rapport de stage',
    description: 'Suivi quotidien + analyse des missions + rédaction + présentation',
    dureeEstimee: 300, // 5h
    priorite: 'moyenne',
    categorie: 'para-universitaire',
    etapes: [
      'Tenue d\'un journal de bord',
      'Analyse des missions effectuées',
      'Bilan des compétences acquises',
      'Rédaction du rapport',
      'Préparation de la présentation orale'
    ],
    conseils: [
      'Documentez quotidiennement vos activités',
      'Analysez l\'entreprise et son secteur',
      'Mettez en valeur vos apprentissages'
    ]
  },
  {
    id: 'presentation-orale',
    titre: 'Présentation orale',
    description: 'Structure + supports visuels + répétition + gestion du stress',
    dureeEstimee: 120, // 2h
    priorite: 'moyenne',
    categorie: 'universitaire',
    etapes: [
      'Structuration de la présentation',
      'Création des supports visuels',
      'Répétition à voix haute',
      'Gestion du timing',
      'Présentation finale'
    ],
    conseils: [
      'Adaptez votre discours à l\'audience',
      'Utilisez des visuels clairs',
      'Entraînez-vous plusieurs fois'
    ]
  },
  {
    id: 'tp-laboratoire',
    titre: 'TP de laboratoire',
    description: 'Préparation théorique + expérimentation + analyse + compte-rendu',
    dureeEstimee: 180, // 3h
    priorite: 'moyenne',
    categorie: 'universitaire',
    etapes: [
      'Préparation théorique',
      'Mise en place de l\'expérience',
      'Réalisation et mesures',
      'Analyse des résultats',
      'Rédaction du compte-rendu'
    ],
    conseils: [
      'Préparez bien la théorie en amont',
      'Respectez les consignes de sécurité',
      'Documentez précisément vos observations'
    ]
  }
];

// Route templates publique améliorée
app.get('/api/templates/public', (req, res) => {
  res.json({
    templates: STUDENT_TEMPLATES,
    total: STUDENT_TEMPLATES.length,
    categories: ['universitaire', 'para-universitaire'],
    message: 'Templates spécialisés pour étudiants'
  });
});

// Template spécifique public
app.get('/api/templates/public/:templateId', (req, res) => {
  const { templateId } = req.params;
  const template = STUDENT_TEMPLATES.find(t => t.id === templateId);
  
  if (!template) {
    return res.status(404).json({ msg: 'Template introuvable' });
  }
  
  res.json({
    template,
    message: `Template "${template.titre}" trouvé`
  });
});

// ===== DASHBOARD PUBLIC (pour tests) =====
app.get('/api/dashboard/public/stats', (req, res) => {
  res.json({
    user: {
      name: 'Étudiant Démo',
      level: 'Licence 2',
      streak: 7 // jours consécutifs
    },
    tasks: {
      total: 18,
      completed: 14,
      active: 4,
      urgent: 2,
      completionRate: 78,
      avgCompletionTime: 145 // minutes
    },
    sessions: {
      total: 89,
      today: 5,
      thisWeek: 32,
      totalTime: 12560 // minutes
    },
    pomodoro: {
      total: 156,
      completed: 142,
      today: 8,
      efficiency: 91, // pourcentage
      focusTime: 3780 // minutes aujourd'hui
    },
    modules: [
      { name: 'Mathématiques', tasks: 6, completed: 5, progress: 83 },
      { name: 'Informatique', tasks: 7, completed: 6, progress: 86 },
      { name: 'Physique', tasks: 3, completed: 2, progress: 67 },
      { name: 'Philosophie', tasks: 2, completed: 1, progress: 50 }
    ],
    recentAchievements: [
      'Série de 7 jours consécutifs',
      '50+ sessions Pomodoro ce mois',
      '10 tâches terminées cette semaine'
    ],
    message: 'Statistiques dashboard - mode public'
  });
});

app.get('/api/dashboard/public/activity', (req, res) => {
  const now = new Date();
  res.json({
    recentTasks: [
      { 
        id: '1',
        titre: 'Essai sur Kant', 
        statut: 'terminée', 
        module: 'Philosophie', 
        updatedAt: new Date(now - 2*60*60*1000), // il y a 2h
        priorite: 'haute',
        dureeRealise: 185
      },
      { 
        id: '2', 
        titre: 'TP Chimie organique', 
        statut: 'en cours', 
        module: 'Chimie', 
        updatedAt: new Date(now - 4*60*60*1000), // il y a 4h
        priorite: 'moyenne',
        progression: 75
      },
      { 
        id: '3',
        titre: 'Projet Android', 
        statut: 'à faire', 
        module: 'Informatique', 
        updatedAt: new Date(now - 1*24*60*60*1000), // hier
        priorite: 'haute',
        dateEcheance: new Date(now + 3*24*60*60*1000) // dans 3 jours
      }
    ],
    recentSessions: [
      { 
        id: '1',
        duration: 1800, // 30min
        taskTitle: 'Révision analyse mathématique', 
        createdAt: new Date(now - 1*60*60*1000), // il y a 1h
        type: 'study',
        efficiency: 95
      },
      { 
        id: '2',
        duration: 1500, // 25min
        taskTitle: 'Lecture Rousseau', 
        createdAt: new Date(now - 3*60*60*1000), // il y a 3h
        type: 'reading',
        efficiency: 88
      },
      { 
        id: '3',
        duration: 2400, // 40min
        taskTitle: 'Coding Java', 
        createdAt: new Date(now - 5*60*60*1000), // il y a 5h
        type: 'work',
        efficiency: 92
      }
    ],
    weeklyProgress: {
      monday: { tasks: 3, sessions: 6, focusTime: 240 },
      tuesday: { tasks: 2, sessions: 4, focusTime: 180 },
      wednesday: { tasks: 4, sessions: 8, focusTime: 320 },
      thursday: { tasks: 3, sessions: 5, focusTime: 200 },
      friday: { tasks: 2, sessions: 3, focusTime: 150 },
      saturday: { tasks: 1, sessions: 2, focusTime: 90 },
      sunday: { tasks: 1, sessions: 4, focusTime: 160 }
    },
    message: 'Activité récente - mode public'
  });
});

// ===== POMODORO PUBLIC =====
let activePomodoro = new Map(); // Stockage temporaire

app.get('/api/pomodoro/public/active', (req, res) => {
  res.json({ 
    activeSession: null,
    message: 'Aucune session Pomodoro active (mode public)',
    availableTypes: ['work', 'short-break', 'long-break'],
    defaultDurations: {
      work: 1500, // 25min
      'short-break': 300, // 5min
      'long-break': 900 // 15min
    }
  });
});

app.post('/api/pomodoro/public/start', (req, res) => {
  const { taskId, type = 'work', customDuration, taskTitle } = req.body;
  const durations = { 
    work: 1500,        // 25 minutes
    'short-break': 300, // 5 minutes
    'long-break': 900   // 15 minutes
  };
  
  const session = {
    id: Date.now().toString(),
    taskId: taskId || null,
    taskTitle: taskTitle || 'Tâche sans titre',
    type,
    duration: customDuration || durations[type],
    startTime: new Date(),
    completed: false
  };
  
  res.json({
    session,
    message: `Session Pomodoro ${type} démarrée (mode public)`,
    durationMinutes: (customDuration || durations[type]) / 60,
    tips: type === 'work' ? [
      'Concentrez-vous sur une seule tâche',
      'Éliminez les distractions',
      'Si une idée vous vient, notez-la rapidement'
    ] : [
      'Levez-vous et bougez',
      'Hydratez-vous',
      'Relaxez vos yeux'
    ]
  });
});

app.put('/api/pomodoro/public/:sessionId/complete', (req, res) => {
  const { sessionId } = req.params;
  const { completed = true, actualDuration } = req.body;
  
  res.json({
    session: {
      id: sessionId,
      completed,
      endTime: new Date(),
      actualDuration: actualDuration || null
    },
    message: completed ? 'Session Pomodoro terminée avec succès!' : 'Session interrompue',
    nextAction: completed ? 'Prendre une pause bien méritée' : 'Reprendre quand vous êtes prêt'
  });
});

app.get('/api/pomodoro/public/stats', (req, res) => {
  res.json({
    today: { 
      sessions: 8, 
      focusTime: 180, // en minutes
      completedSessions: 7,
      interruptedSessions: 1,
      efficiency: 87 // pourcentage
    },
    thisWeek: { 
      sessions: 42, 
      focusTime: 945, // en minutes 
      productivity: 89, // pourcentage
      bestDay: 'Mercredi',
      averagePerDay: 6
    },
    thisMonth: { 
      sessions: 168, 
      focusTime: 3780, // en minutes
      streak: 12, // jours consécutifs
      improvement: '+15%' // vs mois précédent
    },
    trends: {
      dailyAverage: 6.2,
      bestStreak: 18,
      currentStreak: 12,
      totalHours: 89.5,
      favoriteTime: '14h-16h'
    },
    achievements: [
      { name: 'Centurion', description: '100+ sessions ce mois', unlocked: true },
      { name: 'Régularité', description: '7 jours consécutifs', unlocked: true },
      { name: 'Marathon', description: '50h de focus', unlocked: false, progress: 78 }
    ],
    message: 'Statistiques Pomodoro (mode public)'
  });
});

// ===== VUE KANBAN PUBLIQUE =====
app.get('/api/tasks/public/kanban', (req, res) => {
  const now = new Date();
  res.json({
    'à faire': [
      { 
        id: '1',
        titre: 'Projet Android final', 
        module: 'Informatique', 
        priorite: 'haute',
        dateEcheance: new Date(now.getTime() + 5*24*60*60*1000), // dans 5 jours
        dureeEstimee: 1200, // 20h
        tags: ['projet', 'programmation'],
        difficulty: 4
      },
      { 
        id: '2',
        titre: 'TP Chimie organique', 
        module: 'Chimie', 
        priorite: 'moyenne',
        dateEcheance: new Date(now.getTime() + 2*24*60*60*1000), // dans 2 jours
        dureeEstimee: 180, // 3h
        tags: ['tp', 'laboratoire'],
        difficulty: 2
      },
      { 
        id: '3',
        titre: 'Révision partiel maths', 
        module: 'Mathématiques', 
        priorite: 'haute',
        dateEcheance: new Date(now.getTime() + 7*24*60*60*1000), // dans 7 jours
        dureeEstimee: 600, // 10h
        tags: ['révision', 'examen'],
        difficulty: 3
      }
    ],
    'en cours': [
      { 
        id: '4',
        titre: 'Essai sur Rousseau', 
        module: 'Philosophie', 
        priorite: 'haute',
        dateEcheance: new Date(now.getTime() + 3*24*60*60*1000), // dans 3 jours
        dureeEstimee: 300, // 5h
        progression: 65,
        tags: ['essai', 'philosophie'],
        difficulty: 3,
        timeSpent: 195 // minutes déjà passées
      },
      { 
        id: '5',
        titre: 'Recherche mémoire', 
        module: 'Histoire', 
        priorite: 'moyenne',
        dateEcheance: new Date(now.getTime() + 14*24*60*60*1000), // dans 14 jours
        dureeEstimee: 480, // 8h
        progression: 30,
        tags: ['recherche', 'mémoire'],
        difficulty: 4,
        timeSpent: 144
      }
    ],
    'terminée': [
      { 
        id: '6',
        titre: 'TD Analyse mathématique', 
        module: 'Mathématiques', 
        priorite: 'basse',
        dateEcheance: new Date(now.getTime() - 1*24*60*60*1000), // hier
        dureeEstimee: 120, // 2h
        dateCompletion: new Date(now.getTime() - 2*60*60*1000), // il y a 2h
        tags: ['td', 'exercices'],
        difficulty: 2,
        timeSpent: 95,
        grade: 'A'
      },
      { 
        id: '7',
        titre: 'Présentation Java', 
        module: 'Informatique', 
        priorite: 'moyenne',
        dateEcheance: new Date(now.getTime() - 3*24*60*60*1000), // il y a 3 jours
        dureeEstimee: 180, // 3h
        dateCompletion: new Date(now.getTime() - 4*24*60*60*1000), // il y a 4 jours
        tags: ['présentation', 'programmation'],
        difficulty: 3,
        timeSpent: 165,
        grade: 'B+'
      }
    ],
    stats: {
      total: 7,
      completed: 2,
      inProgress: 2,
      pending: 3,
      completionRate: 29,
      averageTimePerTask: 143,
      onTimeCompletion: 85 // pourcentage
    },
    filters: {
      modules: ['Informatique', 'Mathématiques', 'Philosophie', 'Chimie', 'Histoire'],
      priorites: ['haute', 'moyenne', 'basse'],
      tags: ['projet', 'tp', 'essai', 'révision', 'présentation', 'recherche']
    },
    message: 'Vue Kanban complète (mode public)'
  });
});

// ===== RECHERCHE PUBLIQUE =====
app.get('/api/tasks/public/search', (req, res) => {
  const { q, module, priorite, statut } = req.query;
  
  // Simulation de recherche
  const results = [
    { titre: 'Projet Java', module: 'Informatique', priorite: 'haute', statut: 'à faire' },
    { titre: 'TP Chimie', module: 'Chimie', priorite: 'moyenne', statut: 'en cours' }
  ];
  
  res.json({
    query: { q, module, priorite, statut },
    results: results,
    total: results.length,
    message: 'Résultats de recherche (mode public)'
  });
});

// Serve les fichiers uploadés
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Créer les dossiers nécessaires s'ils n'existent pas
import fs from 'fs';
const directories = ['uploads', 'exports'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Dossier ${dir} créé`);
  }
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      msg: 'Erreur de validation',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Erreur de cast Mongoose (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      msg: 'ID invalide'
    });
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      msg: 'Token invalide'
    });
  }
  
  // Erreur par défaut
  res.status(500).json({
    msg: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur interne' 
      : err.message
  });
});

// Route 404 pour les API (EXPRESS 5 COMPATIBLE)
app.use('/api', (req, res) => {
  res.status(404).json({ 
    msg: 'Route API introuvable',
    availableRoutes: [
      'POST /api/auth/register',        // ← Ajoutez les routes auth
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /health',
      'GET /api/templates/public',
      'GET /api/dashboard/public/stats',
      'GET /api/pomodoro/public/active',
      'POST /api/pomodoro/public/start',
      'GET /api/tasks/public/kanban'
    ]
  });
});

// Servir le frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // EXPRESS 5 COMPATIBLE - pas de wildcard simple
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Connexion DB + démarrage serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur FocusTâche lancé sur le port ${PORT}`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Dashboard stats: http://localhost:${PORT}/api/dashboard/public/stats`);
    console.log(`📝 Templates: http://localhost:${PORT}/api/templates/public`);
    console.log(`🍅 Pomodoro: http://localhost:${PORT}/api/pomodoro/public/active`);
    console.log(`📋 Vue Kanban: http://localhost:${PORT}/api/tasks/public/kanban`);
    console.log('');
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Mode développement activé`);
      console.log(`🎓 Version étudiante avec toutes les fonctionnalités`);
      console.log(`📚 7 templates spécialisés disponibles`);
      console.log(`📊 Dashboard complet avec analytics`);
      console.log(`🍅 Système Pomodoro intégré`);
    }
  });
}).catch(err => {
  console.error('❌ Erreur démarrage serveur:', err);
  process.exit(1);
});