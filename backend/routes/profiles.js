// routes/profile.js - VERSION CORRIGÉE sans vérification du statut de validation
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Middleware d'authentification simplifié (sans vérification du statut)
const verifyTokenSimple = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        msg: 'Token d\'accès manquant' 
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        msg: 'Format de token invalide' 
      });
    }

    console.log('🔑 Token reçu:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        msg: 'Token invalide - ID utilisateur manquant' 
      });
    }

    // Vérifier que l'utilisateur existe (SANS vérifier le statut de validation)
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec ID:', userId);
      return res.status(401).json({ 
        success: false,
        msg: 'Utilisateur non trouvé' 
      });
    }

    console.log('✅ Utilisateur trouvé:', user.email, 'Statut:', user.validationStatus);

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user._id,
      userId: user._id,
      email: user.email,
      nom: user.nom,
      role: user.role,
      validationStatus: user.validationStatus,
      emailType: user.emailType
    };

    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Token expiré' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Token invalide' 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      msg: 'Erreur serveur lors de la vérification du token' 
    });
  }
};

// Utiliser notre middleware simplifié
router.use(verifyTokenSimple);

// GET /api/profile - Récupérer le profil complet
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'Utilisateur non trouvé' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        avatar: user.avatar,
        emailType: user.emailType,
        role: user.role,
        validationStatus: user.validationStatus,
        studentInfo: user.studentInfo,
        preferences: user.getPreferences ? user.getPreferences() : user.preferences,
        stats: user.stats,
        googleCalendar: {
          isConnected: user.googleCalendar?.isConnected || false,
          syncEnabled: user.googleCalendar?.syncEnabled || false
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Erreur serveur lors de la récupération du profil' 
    });
  }
});

// PUT /api/profile - Mettre à jour le profil
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const updateData = req.body;

    console.log('🔄 Mise à jour profil pour utilisateur:', userId);
    console.log('📝 Données reçues:', updateData);

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'Utilisateur non trouvé' 
      });
    }

    // Préparer les données à mettre à jour
    const allowedUpdates = {};

    // Informations de base
    if (updateData.nom && updateData.nom.trim()) {
      allowedUpdates.nom = updateData.nom.trim();
    }

    // Avatar
    if (updateData.avatar !== undefined) {
      allowedUpdates.avatar = updateData.avatar;
    }

    // Informations étudiantes
    if (updateData.studentInfo) {
      allowedUpdates.studentInfo = {};
      
      if (updateData.studentInfo.university) {
        allowedUpdates.studentInfo.university = updateData.studentInfo.university.trim();
      }
      if (updateData.studentInfo.faculty) {
        allowedUpdates.studentInfo.faculty = updateData.studentInfo.faculty.trim();
      }
      if (updateData.studentInfo.city) {
        allowedUpdates.studentInfo.city = updateData.studentInfo.city.trim();
      }
      if (updateData.studentInfo.academicYear) {
        allowedUpdates.studentInfo.academicYear = updateData.studentInfo.academicYear.trim();
      }
      if (updateData.studentInfo.bio !== undefined) {
        allowedUpdates.studentInfo.bio = updateData.studentInfo.bio ? updateData.studentInfo.bio.trim() : '';
      }
      
      // CNE - ne peut être modifié que si c'est un compte Gmail
      if (updateData.studentInfo.cne && user.emailType === 'gmail') {
        const cnePattern = /^[A-Z0-9]{8,12}$/i;
        if (cnePattern.test(updateData.studentInfo.cne)) {
          // Vérifier que le CNE n'est pas déjà utilisé
          const existingCNE = await User.findOne({ 
            'studentInfo.cne': updateData.studentInfo.cne.toUpperCase(),
            _id: { $ne: userId }
          });
          
          if (existingCNE) {
            return res.status(400).json({ 
              success: false,
              msg: 'Ce CNE est déjà utilisé par un autre compte' 
            });
          }
          
          allowedUpdates.studentInfo.cne = updateData.studentInfo.cne.toUpperCase();
        } else {
          return res.status(400).json({ 
            success: false,
            msg: 'Format CNE invalide (8-12 caractères alphanumériques)' 
          });
        }
      }
    }

    console.log('✅ Données à mettre à jour:', allowedUpdates);

    // Effectuer la mise à jour avec la méthode MongoDB $set pour une mise à jour partielle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { 
        new: true, // Retourner le document mis à jour
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        msg: 'Utilisateur non trouvé lors de la mise à jour' 
      });
    }

    console.log('✅ Profil mis à jour avec succès');

    // Retourner les données mises à jour
    res.json({
      success: true,
      msg: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser._id,
        nom: updatedUser.nom,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        emailType: updatedUser.emailType,
        role: updatedUser.role,
        validationStatus: updatedUser.validationStatus,
        studentInfo: updatedUser.studentInfo,
        preferences: updatedUser.getPreferences ? updatedUser.getPreferences() : updatedUser.preferences,
        stats: updatedUser.stats,
        googleCalendar: {
          isConnected: updatedUser.googleCalendar?.isConnected || false,
          syncEnabled: updatedUser.googleCalendar?.syncEnabled || false
        },
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        msg: 'Données invalides',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        msg: 'CNE ou email déjà utilisé' 
      });
    }

    res.status(500).json({ 
      success: false,
      msg: 'Erreur serveur lors de la mise à jour du profil' 
    });
  }
});

export default router;