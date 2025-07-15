// backend/routes/auth.js - VERSION CORRIGÉE
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateEmail } from '../utils/emailValidation.js';

const router = express.Router();

// Middleware d'authentification corrigé
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ msg: 'Token d\'accès manquant' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ msg: 'Format de token invalide' });
    }

    console.log('🔑 Token reçu:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Token décodé:', { userId: decoded.userId || decoded.id, email: decoded.email });

    // Normaliser l'ID utilisateur (compatibilité avec différents formats de token)
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ msg: 'Token invalide - ID utilisateur manquant' });
    }

    req.user = {
      userId: userId,
      id: userId, // Compatibilité
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expiré' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Token invalide' });
    }
    
    return res.status(403).json({ msg: 'Erreur de vérification du token' });
  }
};

// ✅ ROUTES EXISTANTES
router.post('/register', async (req, res) => {
  try {
    const { nom, email, password, studentInfo } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({ msg: 'Nom, email et mot de passe requis' });
    }

    const emailValidation = await validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ msg: emailValidation.reason });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: 'Un compte avec cet email existe déjà' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      emailType: emailValidation.type,
      validationStatus: emailValidation.type === 'university' ? 'approved' : 'pending',
      studentInfo: {
        university: studentInfo?.university?.trim(),
        faculty: studentInfo?.faculty?.trim(),
        city: studentInfo?.city?.trim()
      }
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      msg: '✅ Compte créé avec succès !',
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        emailType: newUser.emailType,
        studentInfo: newUser.studentInfo
      },
      token
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ msg: 'Erreur serveur lors de l\'inscription' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      msg: 'Connexion réussie !',
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        emailType: user.emailType,
        studentInfo: user.studentInfo
      },
      token
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ msg: 'Erreur serveur lors de la connexion' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    res.json({
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        emailType: user.emailType,
        studentInfo: user.studentInfo
      }
    });

  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(401).json({ msg: 'Token invalide' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    res.json({
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        emailType: user.emailType,
        studentInfo: user.studentInfo
      }
    });

  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(401).json({ msg: 'Token invalide' });
  }
});

// 🗑️ ROUTE DE SUPPRESSION DE COMPTE - VERSION CORRIGÉE
router.delete('/delete-account', authenticateToken, async (req, res) => {
  console.log('🎯 Route DELETE /api/auth/delete-account appelée !');
  console.log('🔍 User object:', req.user);
  
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      console.log('❌ ID utilisateur manquant dans req.user');
      return res.status(400).json({ 
        success: false,
        msg: 'ID utilisateur manquant' 
      });
    }

    console.log('🔍 Recherche utilisateur avec ID:', userId);

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec ID:', userId);
      return res.status(404).json({ 
        success: false,
        msg: 'Utilisateur non trouvé' 
      });
    }

    console.log(`🔍 Utilisateur trouvé: ${user.email}`);

    // Supprimer toutes les données liées (version complète)
    try {
      // Supprimer les tâches
      const { default: Task } = await import('../models/Task.js').catch(() => ({ default: null }));
      if (Task) {
        const deletedTasks = await Task.deleteMany({ userId: userId });
        console.log(`📋 Tâches supprimées: ${deletedTasks.deletedCount}`);
      }
    } catch (e) {
      console.log('⚠️ Pas de tâches à supprimer');
    }

    try {
      // Supprimer les sessions
      const { default: Session } = await import('../models/Session.js').catch(() => ({ default: null }));
      if (Session) {
        const deletedSessions = await Session.deleteMany({ userId: userId });
        console.log(`⏰ Sessions supprimées: ${deletedSessions.deletedCount}`);
      }
    } catch (e) {
      console.log('⚠️ Pas de sessions à supprimer');
    }

    try {
      // Supprimer les notes
      const { default: Note } = await import('../models/Note.js').catch(() => ({ default: null }));
      if (Note) {
        const deletedNotes = await Note.deleteMany({ userId: userId });
        console.log(`📝 Notes supprimées: ${deletedNotes.deletedCount}`);
      }
    } catch (e) {
      console.log('⚠️ Pas de notes à supprimer');
    }

    try {
      // Supprimer les notifications
      const { default: Notification } = await import('../models/Notification.js').catch(() => ({ default: null }));
      if (Notification) {
        const deletedNotifications = await Notification.deleteMany({ userId: userId });
        console.log(`🔔 Notifications supprimées: ${deletedNotifications.deletedCount}`);
      }
    } catch (e) {
      console.log('⚠️ Pas de notifications à supprimer');
    }

    // Supprimer l'utilisateur lui-même
    await User.findByIdAndDelete(userId);
    console.log(`✅ Utilisateur supprimé: ${user.email}`);

    // Réponse de succès
    const responseData = { 
      success: true,
      msg: 'Compte supprimé avec succès',
      deletedUser: {
        email: user.email,
        nom: user.nom
      },
      timestamp: new Date().toISOString()
    };

    console.log('📤 Envoi de la réponse:', responseData);
    
    res.status(200).json(responseData);
    console.log('🎉 Suppression terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du compte:', error);
    
    res.status(500).json({ 
      success: false,
      msg: 'Erreur serveur lors de la suppression du compte',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      timestamp: new Date().toISOString()
    });
  }
});

// 🧪 ROUTE DE TEST
router.get('/test-delete-route', (req, res) => {
  console.log('🧪 Route de test appelée');
  res.json({
    message: 'Le router auth.js fonctionne !',
    availableRoutes: [
      'POST /register',
      'POST /login', 
      'GET /me',
      'GET /profile',
      'DELETE /delete-account ✅',
      'GET /test-delete-route'
    ],
    timestamp: new Date().toISOString()
  });
});

console.log('📝 Routes auth.js chargées:');
console.log('  - POST /register');
console.log('  - POST /login');
console.log('  - GET /me');
console.log('  - GET /profile');
console.log('  - DELETE /delete-account ✅');
console.log('  - GET /test-delete-route');

export default router;