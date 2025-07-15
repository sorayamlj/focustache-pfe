// routes/userPreferences.js - Routes pour la gestion du profil utilisateur
import express from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js'; // Assurez-vous d'avoir ce modèle
import Session from '../models/Session.js'; // Assurez-vous d'avoir ce modèle
import Note from '../models/Note.js'; // Assurez-vous d'avoir ce modèle
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuration multer pour l'upload d'avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/avatars';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// ✅ GET - Récupérer le profil utilisateur
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    res.json({
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        avatar: user.avatar,
        emailType: user.emailType,
        studentInfo: user.studentInfo,
        preferences: user.getPreferences(),
        stats: user.stats,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// ✅ PUT - Mettre à jour le profil utilisateur
router.put('/profile', async (req, res) => {
  try {
    const { nom, studentInfo } = req.body;
    
    // Préparer les données à mettre à jour
    const updateData = {};
    
    if (nom && nom.trim()) {
      updateData.nom = nom.trim();
    }
    
    if (studentInfo) {
      updateData.studentInfo = studentInfo;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        msg: 'Utilisateur non trouvé' 
      });
    }

    res.json({
      success: true,
      msg: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser._id,
        nom: updatedUser.nom,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        emailType: updatedUser.emailType,
        studentInfo: updatedUser.studentInfo,
        preferences: updatedUser.getPreferences(),
        stats: updatedUser.stats
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Erreur serveur' 
    });
  }
});

// ✅ POST - Upload avatar
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Aucun fichier fourni' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    // Supprimer l'ancien avatar s'il existe
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Mettre à jour l'avatar
    user.avatar = `/uploads/avatars/${req.file.filename}`;
   await user.save({ validateBeforeSave: false });

    res.json({
      msg: 'Avatar mis à jour avec succès',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// ✅ GET - Récupérer les préférences utilisateur
router.get('/preferences', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    res.json({
      preferences: user.getPreferences()
    });
  } catch (error) {
    console.error('Erreur récupération préférences:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// ✅ PUT - Mettre à jour les préférences utilisateur
router.put('/preferences', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    // Fusionner les nouvelles préférences avec les existantes
    user.preferences = {
      ...user.preferences,
      ...req.body
    };

   await user.save({ validateBeforeSave: false });

    res.json({
      msg: 'Préférences mises à jour avec succès',
      preferences: user.getPreferences()
    });
  } catch (error) {
    console.error('Erreur mise à jour préférences:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// ✅ DELETE - Supprimer le compte utilisateur
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    console.log(`🗑️ Début suppression compte: ${user.email}`);

    // Supprimer l'avatar s'il existe
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const avatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
          console.log(`📸 Avatar supprimé: ${avatarPath}`);
        } catch (error) {
          console.warn(`⚠️ Erreur suppression avatar: ${error.message}`);
        }
      }
    }

    // Supprimer toutes les données liées à l'utilisateur
    const deletePromises = [];

    // Supprimer les tâches (si le modèle existe)
    try {
      const taskCount = await Task.countDocuments({ userId });
      if (taskCount > 0) {
        deletePromises.push(Task.deleteMany({ userId }));
        console.log(`📝 ${taskCount} tâches à supprimer`);
      }
    } catch (error) {
      console.warn('⚠️ Modèle Task non trouvé, ignoré');
    }

    // Supprimer les sessions (si le modèle existe)
    try {
      const sessionCount = await Session.countDocuments({ userId });
      if (sessionCount > 0) {
        deletePromises.push(Session.deleteMany({ userId }));
        console.log(`⏰ ${sessionCount} sessions à supprimer`);
      }
    } catch (error) {
      console.warn('⚠️ Modèle Session non trouvé, ignoré');
    }

    // Supprimer les notes (si le modèle existe)
    try {
      const noteCount = await Note.countDocuments({ userId });
      if (noteCount > 0) {
        deletePromises.push(Note.deleteMany({ userId }));
        console.log(`📒 ${noteCount} notes à supprimer`);
      }
    } catch (error) {
      console.warn('⚠️ Modèle Note non trouvé, ignoré');
    }

    // Exécuter toutes les suppressions en parallèle
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`✅ Données utilisateur supprimées`);
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);
    
    console.log(`✅ Compte supprimé: ${user.email}`);

    res.json({
      msg: 'Compte supprimé avec succès',
      deletedData: {
        user: true,
        tasks: true,
        sessions: true,
        notes: true,
        avatar: user.avatar ? true : false
      }
    });

  } catch (error) {
    console.error('❌ Erreur suppression compte:', error);
    res.status(500).json({ 
      msg: 'Erreur lors de la suppression du compte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ GET - Statistiques utilisateur
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('stats');
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    // Calculer des statistiques additionnelles si nécessaire
    let additionalStats = {};
    
    try {
      // Compter les tâches si le modèle existe
      const totalTasks = await Task.countDocuments({ userId: req.user.id });
      const completedTasks = await Task.countDocuments({ 
        userId: req.user.id, 
        status: 'completed' 
      });
      
      additionalStats = {
        ...additionalStats,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    } catch (error) {
      console.warn('⚠️ Modèle Task non disponible pour les stats');
    }

    res.json({
      stats: {
        ...user.stats,
        ...additionalStats
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;