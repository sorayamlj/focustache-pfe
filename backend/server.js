// server.js - VERSION ULTRA-SIMPLIFIÉE avec debug amélioré
import connectDB from "./config/db.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import des routes EXISTANTES
import taskRoutes from "./routes/tasks.js";
import sessionRoutes from "./routes/sessions.js";
import googleRoutes from "./routes/googleCalendar.js";
import noteRoutes from "./routes/notes.js";

// Import des routes AUTH CORRIGÉES
import authRoutes from "./routes/auth.js";

// Import des NOUVELLES routes
import notificationRoutes from "./routes/notifications.js";
import userPreferencesRoutes from "./routes/userPreferences.js";
import profileRoutes from "./routes/profiles.js"; 
// Import du middleware CORRIGÉ
import { verifyToken } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// __dirname en ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MIDDLEWARE DE BASE =====

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://app.focustache.com"
        : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging amélioré en développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    if (req.method === 'DELETE' && req.path.includes('delete-account')) {
      console.log('🗑️ ROUTE DE SUPPRESSION APPELÉE !');
      console.log('🔑 Authorization header:', req.headers.authorization ? 'Présent' : 'Absent');
    }
    next();
  });
}

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const totalUsers = await User.countDocuments();

    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: '3.0.0-fixed',
      message: '🎓 FocusTache API - Version Corrigée',
      features: [
        'Gmail + Universités marocaines',
        'Inscription automatique',
        'Gestion des tâches',
        'Sessions Pomodoro',
        'Google Calendar Sync',
        'Notifications',
        'Préférences utilisateur',
        'Suppression de compte ✅'
      ],
      stats: {
        totalUsers,
        emailsAccepted: [
          'Gmail (@gmail.com)',
          'Universités publiques (.ac.ma)', 
          'Universités privées (.ma)'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// ===== ROUTES API =====

// Routes d'authentification (AVEC suppression de compte)
app.use("/api/auth", authRoutes);

// Routes protégées
app.use("/api/tasks", verifyToken, taskRoutes);
app.use("/api/sessions", verifyToken, sessionRoutes);
app.use("/api/google", verifyToken, googleRoutes);
app.use("/api/notes", verifyToken, noteRoutes);
app.use("/api/notifications", verifyToken, notificationRoutes);
app.use("/api/user", verifyToken, userPreferencesRoutes);
app.use("/api/user/profile", verifyToken, profileRoutes); // ← CORRIGÉ : route profile

// Route de statut utilisateur
app.get("/api/status", verifyToken, async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        emailType: user.emailType,
        studentInfo: user.studentInfo,
        avatar: user.avatar,
        preferences: user.preferences,
        stats: user.stats
      },
      timestamp: new Date().toISOString(),
      message: "Toutes les fonctionnalités disponibles !",
      features: ['Tasks', 'Pomodoro', 'Google Calendar', 'Notifications', 'Profile', 'Delete Account ✅']
    });
  } catch (error) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
});

// Debug : Afficher toutes les routes enregistrées
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/routes', (req, res) => {
    const routes = [];
    
    // Fonction récursive pour extraire les routes
    const extractRoutes = (stack, basePath = '') => {
      stack.forEach((layer) => {
        if (layer.route) {
          // Route directe
          const methods = Object.keys(layer.route.methods);
          routes.push({
            path: basePath + layer.route.path,
            methods: methods.map(m => m.toUpperCase()),
            type: 'route'
          });
        } else if (layer.name === 'router' && layer.handle?.stack) {
          // Router avec sous-routes
          const routerPath = layer.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace('^', '')
            .replace('\\', '');
          
          extractRoutes(layer.handle.stack, basePath + routerPath);
        }
      });
    };
    
    extractRoutes(app._router.stack);
    
    res.json({
      message: 'Routes disponibles dans l\'application',
      totalRoutes: routes.length,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      authRoutes: routes.filter(r => r.path.includes('/api/auth')),
      profileRoutes: routes.filter(r => r.path.includes('/api/user/profile')),
      deleteRoute: routes.find(r => r.path.includes('delete-account')) || 'NON TROUVÉE ❌'
    });
  });
}

// Serve les fichiers uploadés
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Créer les dossiers uploads
import fs from 'fs';
const uploadDirs = ['uploads', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Dossier ${dir} créé`);
  }
});

// ===== GESTION D'ERREURS =====
app.use((err, req, res, next) => {
  console.error('❌ Erreur globale:', err.message);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      msg: 'Données invalides',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ msg: 'ID invalide' });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ msg: 'Token invalide' });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ msg: 'Données déjà existantes' });
  }
  
  res.status(500).json({
    msg: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur' 
      : err.message
  });
});

// Route 404 pour les API
app.use('/api', (req, res) => {
  console.log('❌ Route API non trouvée:', req.method, req.path);
  
  res.status(404).json({ 
    msg: 'Route introuvable',
    requestedRoute: `${req.method} ${req.path}`,
    availableRoutes: {
      auth: [
        'POST /api/auth/register - Inscription',
        'POST /api/auth/login - Connexion',
        'GET /api/auth/profile - Profil utilisateur',
        'DELETE /api/auth/delete-account - Supprimer le compte ✅',
        'GET /api/auth/test-delete-route - Test route'
      ],
      profile: [
        'GET /api/user/profile - Récupérer le profil ✅',
        'PUT /api/user/profile - Mettre à jour le profil ✅'
      ],
      debug: [
        'GET /debug/routes - Voir toutes les routes'
      ]
    },
    note: "✅ Les routes profile sont maintenant sous /api/user/profile"
  });
});

// Servir le frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// ===== DÉMARRAGE SERVEUR =====
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FocusTache CORRIGÉ lancé sur le port ${PORT}`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
    console.log(`🐛 Debug routes: http://localhost:${PORT}/debug/routes`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Mode développement activé`);
      console.log(`📧 Emails acceptés:`);
      console.log(`   • Gmail: exemple@gmail.com`);
      console.log(`   • Universités: nom@um5r.ac.ma, nom@uca.ac.ma`);
      
      console.log(`\n🔧 Routes critiques:`);
      console.log(`   • 🗑️ DELETE /api/auth/delete-account ✅`);
      console.log(`   • 👤 GET /api/user/profile ✅`);
      console.log(`   • 👤 PUT /api/user/profile ✅`);
      console.log(`   • 🔑 POST /api/auth/login`);
      console.log(`   • 📝 POST /api/auth/register`);
      
      console.log(`\n🌐 Interface web: http://localhost:5173`);
      console.log(`📱 API test: http://localhost:${PORT}/health`);
      console.log(`🧪 Test suppression: http://localhost:${PORT}/api/auth/test-delete-route`);
      
      // Vérification finale des routes
      setTimeout(() => {
        console.log('\n🔍 VÉRIFICATION FINALE DES ROUTES:');
        const authRouter = app._router.stack.find(layer => 
          layer.regexp.source.includes('api\\/auth')
        );
        
        if (authRouter && authRouter.handle.stack) {
          const deleteRoute = authRouter.handle.stack.find(layer => 
            layer.route && layer.route.path === '/delete-account'
          );
          
          if (deleteRoute && deleteRoute.route.methods.delete) {
            console.log('✅ Route DELETE /api/auth/delete-account CONFIRMÉE');
          } else {
            console.log('❌ Route DELETE /api/auth/delete-account NON TROUVÉE');
          }
        }
        
        const profileRouter = app._router.stack.find(layer => 
          layer.regexp.source.includes('api\\/user\\/profile')
        );
        
        if (profileRouter) {
          console.log('✅ Routes /api/user/profile CONFIRMÉES');
        } else {
          console.log('❌ Routes /api/user/profile NON TROUVÉES');
        }
      }, 1000);
    }
  });
}).catch(err => {
  console.error('❌ Erreur démarrage:', err);
  process.exit(1);
});