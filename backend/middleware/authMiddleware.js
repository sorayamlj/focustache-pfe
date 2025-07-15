// middleware/authMiddleware.js - VERSION CORRIGÉE
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Middleware de vérification du token JWT - VERSION CORRIGÉE
export const verifyToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        msg: 'Accès refusé - Token manquant',
        code: 'NO_TOKEN'
      });
    }

    // Extraire le token (format: "Bearer <token>")
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        msg: 'Accès refusé - Format de token invalide',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    console.log('🔑 Middleware - Token reçu:', token.substring(0, 20) + '...');

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔓 Middleware - Token décodé:', { userId: decoded.userId || decoded.id, email: decoded.email });
    } catch (jwtError) {
      console.error('❌ Erreur JWT:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          msg: 'Token expiré - Veuillez vous reconnecter',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          msg: 'Token invalide',
          code: 'INVALID_TOKEN'
        });
      }
      throw jwtError;
    }

    // Normaliser l'ID utilisateur (compatibilité avec différents formats de token)
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ 
        msg: 'Token invalide - ID utilisateur manquant',
        code: 'MISSING_USER_ID'
      });
    }

    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec ID:', userId);
      return res.status(401).json({ 
        msg: 'Utilisateur non trouvé - Token invalide',
        code: 'USER_NOT_FOUND'
      });
    }

    console.log('✅ Utilisateur trouvé:', user.email);

    // Vérifier le statut de l'utilisateur SEULEMENT pour les étudiants
    if (user.role === 'student') {
  if (user.validationStatus === 'rejected') {
    return res.status(403).json({ 
      msg: 'Compte rejeté - Contactez le support',
      code: 'ACCOUNT_REJECTED'
    });
  }
      
     /* if (user.validationStatus === 'pending') {
    return res.status(403).json({ 
      msg: 'Compte en attente de validation',
      code: 'ACCOUNT_PENDING'
    });
  } */
      
    /*  if (user.validationStatus !== 'approved') {
    return res.status(403).json({ 
      msg: 'Statut de compte invalide',
      code: 'INVALID_STATUS'
    });
  }*/
    } 

    // Ajouter l'utilisateur à la requête avec TOUS les formats possibles
    req.user = {
      id: user._id,           // Format id
      userId: user._id,       // Format userId
      email: user.email,
      nom: user.nom,
      role: user.role,
      validationStatus: user.validationStatus,
      emailType: user.emailType
    };

    console.log('✅ Middleware - req.user défini:', { id: req.user.id, userId: req.user.userId, email: req.user.email });

    next();
  } catch (error) {
    console.error('❌ Erreur middleware auth:', error);
    res.status(500).json({ 
      msg: 'Erreur serveur lors de la vérification du token',
      code: 'SERVER_ERROR'
    });
  }
};

// ✅ Middleware pour vérifier que l'utilisateur est admin
export const verifyAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        msg: 'Accès refusé - Droits administrateur requis',
        code: 'ADMIN_REQUIRED'
      });
    }
    next();
  } catch (error) {
    console.error('❌ Erreur middleware admin:', error);
    res.status(500).json({ 
      msg: 'Erreur serveur lors de la vérification des droits',
      code: 'SERVER_ERROR'
    });
  }
};

// ✅ Middleware optionnel pour les routes qui acceptent les utilisateurs connectés ET non connectés
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;
      const user = await User.findById(userId).select('-password');
      
      if (user && (user.validationStatus === 'approved' || user.role === 'admin')) {
        req.user = {
          id: user._id,
          userId: user._id,
          email: user.email,
          nom: user.nom,
          role: user.role,
          validationStatus: user.validationStatus,
          emailType: user.emailType
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('❌ Erreur middleware auth optionnel:', error);
    req.user = null;
    next();
  }
};

export default verifyToken;