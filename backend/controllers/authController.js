// controllers/authController.js - VERSION MODIFIÉE (Gmail + Universités marocaines uniquement)
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';

// ✅ CONFIGURATION EMAIL SIMPLIFIÉE
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
};

// ✅ VALIDATION EMAIL STRICTE (Gmail + Universités marocaines uniquement)
const validateEmailStrict = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email requis', type: null };
  }

  const emailLower = email.toLowerCase().trim();
  
  // Format de base
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return { isValid: false, reason: 'Format d\'email invalide', type: null };
  }

  // Gmail accepté
  if (emailLower.endsWith('@gmail.com')) {
    return { isValid: true, type: 'gmail' };
  }

  // Universités marocaines acceptées UNIQUEMENT
  const moroccanUniversityDomains = [
    '@um5r.ac.ma',      // Mohammed V Rabat
    '@uh2c.ac.ma',      // Hassan II Casablanca
    '@uca.ac.ma',       // Cadi Ayyad Marrakech
    '@uit.ac.ma',       // Ibn Tofail Kénitra
    '@usmba.ac.ma',     // USMBA Fès
    '@ump.ac.ma',       // Mohammed Premier Oujda
    '@uiz.ac.ma',       // Ibn Zohr Agadir
    '@umi.ac.ma',       // Moulay Ismail Meknès
    '@uae.ac.ma',       // Abdelmalek Essaadi Tétouan
    '@aui.ma',          // Al Akhawayn University
    '@uir.ac.ma',       // UIR
    '@emsi.ma',         // EMSI
    '@ensa.ac.ma',      // ENSA
    '@est.ac.ma',       // EST
    '@usms.ac.ma',      // Sultan Moulay Slimane
    '@uhp.ac.ma'        // Hassan Premier Settat
  ];

  const isUniversityEmail = moroccanUniversityDomains.some(domain => 
    emailLower.endsWith(domain.toLowerCase())
  );
  
  if (isUniversityEmail) {
    return { isValid: true, type: 'university' };
  }

  // Rejeter TOUT le reste (Yahoo, Outlook, etc.)
  return { 
    isValid: false, 
    reason: 'Seuls les emails Gmail et universitaires marocains sont acceptés',
    type: null
  };
};

// ✅ VALIDATION CNE
const validateCNE = (cne) => {
  if (!cne) return false;
  const cnePattern = /^[A-Z0-9]{8,12}$/i;
  return cnePattern.test(cne);
};

// ✅ FONCTION ENVOI EMAIL
const sendEmail = async (type, userData) => {
  try {
    const transporter = createEmailTransporter();
    
    let subject = '📧 FocusTâche - Mise à jour';
    let emailContent = '';

    if (type === 'university_approved') {
      subject = '🎉 Compte FocusTâche approuvé !';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; margin: 0; font-size: 28px;">🎉 Bienvenue sur FocusTâche !</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Application d'étude pour étudiants marocains</p>
            </div>
            
            <p>Bonjour <strong>${userData.nom}</strong>,</p>
            <p>Votre compte universitaire a été <strong style="color: #16a34a;">approuvé automatiquement</strong> !</p>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #16a34a; margin: 0 0 10px 0;">🚀 Vous pouvez maintenant :</h3>
              <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                <li>📝 Gérer vos tâches et devoirs</li>
                <li>⏰ Utiliser le timer Pomodoro</li>
                <li>📅 Synchroniser votre calendrier</li>
                <li>📊 Suivre votre progression</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                🎯 Accéder à FocusTâche
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>📧 Email automatique - Ne pas répondre</p>
              <p>🎓 Université: ${userData.studentInfo?.university}</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'gmail_pending') {
      subject = '📧 Demande FocusTâche reçue';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">📧 Demande reçue !</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">FocusTâche - Application d'étude</p>
            </div>
            
            <p>Bonjour <strong>${userData.nom}</strong>,</p>
            <p>Votre demande d'inscription avec un compte Gmail a été <strong>reçue</strong> et est en cours d'examen.</p>
            
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #d97706; margin: 0 0 10px 0;">⏳ Prochaines étapes :</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>📋 Validation de vos informations étudiantes</li>
                <li>✅ Approbation par notre équipe</li>
                <li>📧 Email de confirmation (24-48h)</li>
              </ul>
            </div>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>📝 Informations soumises :</strong><br>
                🎓 Université: ${userData.studentInfo?.university}<br>
                🏛️ Faculté: ${userData.studentInfo?.faculty}<br>
                📍 Ville: ${userData.studentInfo?.city}<br>
                🆔 CNE: ${userData.studentInfo?.cne}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>📧 Email automatique - Ne pas répondre</p>
              <p>❓ Questions ? <strong>pfeappweb@gmail.com</strong></p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'admin_approval') {
      subject = '🎉 Compte FocusTâche approuvé par admin !';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; margin: 0; font-size: 28px;">🎉 Compte Approuvé !</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">FocusTâche - Application d'étude</p>
            </div>
            
            <p>Bonjour <strong>${userData.nom}</strong>,</p>
            <p>Excellente nouvelle ! Votre compte FocusTâche a été <strong style="color: #16a34a;">approuvé</strong> par notre équipe.</p>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #16a34a; margin: 0 0 10px 0;">🚀 Accès complet débloqué :</h3>
              <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                <li>📝 Gestion des tâches</li>
                <li>⏰ Sessions Pomodoro</li>
                <li>📅 Calendrier intégré</li>
                <li>📊 Statistiques détaillées</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                🎯 Accéder à FocusTâche
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>📧 Email automatique - Ne pas répondre</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'rejection') {
      subject = '📧 Demande FocusTâche - Mise à jour';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 28px;">📧 Mise à jour demande</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">FocusTâche - Application d'étude</p>
            </div>
            
            <p>Bonjour <strong>${userData.nom}</strong>,</p>
            <p>Nous ne pouvons pas approuver votre demande d'inscription pour le moment.</p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;">
                <strong>📧 Pour plus d'informations :</strong><br>
                Contactez-nous à <strong>pfeappweb@gmail.com</strong>
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>📧 Email automatique - Ne pas répondre</p>
            </div>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: {
        name: 'FocusTâche - Équipe',
        address: process.env.GMAIL_USER
      },
      to: userData.email,
      subject: subject,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email ${type} envoyé à ${userData.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur email ${type}:`, error.message);
    return false;
  }
};

// ✅ INSCRIPTION STRICTE
export const register = async (req, res) => {
  try {
    const { email, password, nom, studentInfo } = req.body;

    // Vérifications de base
    if (!email || !password || !nom || !studentInfo?.university) {
      return res.status(400).json({ 
        msg: "Tous les champs sont requis (nom, email, password, université)" 
      });
    }

    // ✅ VALIDATION EMAIL STRICTE
    const emailValidation = validateEmailStrict(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ 
        msg: emailValidation.reason,
        code: "INVALID_EMAIL"
      });
    }

    console.log(`📧 Email accepté: ${email} (${emailValidation.type})`);

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: "Un compte avec cet email existe déjà" });
    }

    // ✅ VALIDATION CNE POUR GMAIL
    if (emailValidation.type === 'gmail') {
      if (!studentInfo.cne || !validateCNE(studentInfo.cne)) {
        return res.status(400).json({ 
          msg: "CNE obligatoire pour Gmail (format: 8-12 caractères alphanumériques)",
          code: "CNE_REQUIRED"
        });
      }

      // Vérifier CNE unique
      const existingCNE = await User.findOne({ 
        'studentInfo.cne': studentInfo.cne.toUpperCase() 
      });
      if (existingCNE) {
        return res.status(400).json({ 
          msg: "Ce CNE est déjà utilisé par un autre compte" 
        });
      }
    }

    // Déterminer le statut de validation
    let validationStatus = 'pending';
    let validationMethod = 'student_info';
    let isAutoApproved = false;

    if (emailValidation.type === 'university') {
      validationStatus = 'approved';
      validationMethod = 'university_email';
      isAutoApproved = true;
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      nom: nom.trim(),
      validationStatus,
      validationMethod,
      emailType: emailValidation.type,
      studentInfo: {
        cne: studentInfo.cne?.toUpperCase().trim(),
        university: studentInfo.university?.trim(),
        faculty: studentInfo.faculty?.trim(),
        city: studentInfo.city?.trim(),
        academicYear: studentInfo.academicYear?.trim(),
        bio: studentInfo.bio?.trim()
      },
      approvedAt: isAutoApproved ? new Date() : null
    });

    // Envoyer email approprié
    const emailType = isAutoApproved ? 'university_approved' : 'gmail_pending';
    await sendEmail(emailType, user);

    // Générer token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        nom: user.nom,
        validationStatus: user.validationStatus,
        emailType: user.emailType,
        studentInfo: user.studentInfo
      },
      token,
      message: isAutoApproved 
        ? "🎉 Compte universitaire créé et approuvé automatiquement !" 
        : "📧 Compte Gmail créé ! Attendez la validation (24-48h).",
      isAutoApproved
    });

    console.log(`✅ Inscription: ${email} (${emailValidation.type}) - ${validationStatus}`);

  } catch (err) {
    console.error('❌ Erreur inscription:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email ou CNE déjà utilisé" });
    }
    
    res.status(500).json({ msg: "Erreur serveur lors de l'inscription" });
  }
};

// ✅ CONNEXION AVEC VALIDATION STRICTE
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email et mot de passe requis" });
    }

    // Validation email avant connexion
    const emailValidation = validateEmailStrict(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ 
        msg: emailValidation.reason,
        code: "INVALID_EMAIL"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: "Email ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Email ou mot de passe incorrect" });
    }

    // Vérification statut pour étudiants
    if (user.role === 'student') {
      if (user.validationStatus === 'rejected') {
        return res.status(403).json({ 
          msg: "Votre demande a été rejetée. Contactez pfeappweb@gmail.com" 
        });
      }
      if (user.validationStatus === 'pending') {
        return res.status(403).json({ 
          msg: "Votre compte est en attente de validation (24-48h)." 
        });
      }
      if (user.validationStatus !== 'approved') {
        return res.status(403).json({ 
          msg: "Statut de compte non valide." 
        });
      }
    }

    // Générer token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        nom: user.nom,
        validationStatus: user.validationStatus,
        emailType: user.emailType,
        studentInfo: user.studentInfo,
        role: user.role
      },
      token,
      message: "Connexion réussie ! Bienvenue sur FocusTâche 🎯"
    });

    console.log(`✅ Connexion: ${email} (${user.emailType})`);

  } catch (err) {
    console.error('❌ Erreur connexion:', err);
    res.status(500).json({ msg: "Erreur serveur lors de la connexion" });
  }
};

// ✅ PROFIL UTILISATEUR
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" });
    }
    res.json(user);
  } catch (err) {
    console.error('❌ Erreur getMe:', err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// ✅ ROUTES ADMIN SIMPLIFIÉES

export const getPendingStudents = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ msg: "Accès refusé - Admin uniquement" });
    }

    const { page = 1, limit = 10, filter = 'pending' } = req.query;
    
    let query = { validationStatus: 'pending', role: 'student' };
    if (filter === 'all') {
      query = { role: 'student' };
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (err) {
    console.error('❌ Erreur récupération étudiants:', err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const approveStudent = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ msg: "Accès refusé - Admin uniquement" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" });
    }
    if (user.validationStatus === 'approved') {
      return res.status(400).json({ msg: "Utilisateur déjà approuvé" });
    }

    // Approuver
    user.validationStatus = 'approved';
    user.approvedAt = new Date();
    await user.save();

    // Envoyer email
    await sendEmail('admin_approval', user);

    res.json({ 
      msg: "Étudiant approuvé avec succès",
      user: { 
        _id: user._id, 
        nom: user.nom, 
        email: user.email, 
        validationStatus: user.validationStatus,
        emailType: user.emailType
      }
    });

    console.log(`✅ Admin approuvé: ${user.email} par ${adminUser.email}`);
  } catch (err) {
    console.error('❌ Erreur approbation:', err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const rejectStudent = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ msg: "Accès refusé - Admin uniquement" });
    }

    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: "Utilisateur non trouvé" });
    }

    // Rejeter
    user.validationStatus = 'rejected';
    user.rejectedAt = new Date();
    user.rejectionReason = reason;
    await user.save();

    // Envoyer email
    await sendEmail('rejection', user);

    res.json({ 
      msg: "Étudiant rejeté",
      user: { 
        _id: user._id, 
        nom: user.nom, 
        email: user.email, 
        validationStatus: user.validationStatus 
      }
    });

    console.log(`❌ Admin rejeté: ${user.email} par ${adminUser.email}`);
  } catch (err) {
    console.error('❌ Erreur rejet:', err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const getStats = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ msg: "Accès refusé - Admin uniquement" });
    }

    const stats = await User.aggregate([
      { $match: { role: 'student' } },
      { 
        $group: { 
          _id: {
            validationStatus: "$validationStatus",
            emailType: "$emailType"
          }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const formattedStats = {
      total: { pending: 0, approved: 0, rejected: 0 },
      gmail: { pending: 0, approved: 0, rejected: 0 },
      university: { pending: 0, approved: 0, rejected: 0 }
    };

    stats.forEach(stat => {
      if (stat._id.validationStatus && stat._id.emailType) {
        formattedStats[stat._id.emailType][stat._id.validationStatus] = stat.count;
        formattedStats.total[stat._id.validationStatus] += stat.count;
      }
    });

    res.json(formattedStats);
  } catch (err) {
    console.error('❌ Erreur stats:', err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

// ✅ FONCTION CRÉATION ADMIN
export const createAdmin = async (email, password, nom) => {
  try {
    // Validation email admin
    const emailValidation = validateEmailStrict(email);
    if (!emailValidation.isValid) {
      throw new Error(`Email admin invalide: ${emailValidation.reason}`);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`⚠️  Admin déjà existant: ${email}`);
        return existing;
      }
      existing.role = 'admin';
      existing.validationStatus = 'approved';
      existing.approvedAt = new Date();
      await existing.save();
      console.log(`⬆️  Utilisateur promu en admin: ${email}`);
      return existing;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await User.create({
      nom,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      validationStatus: 'approved',
      validationMethod: emailValidation.type === 'university' ? 'university_email' : 'student_info',
      emailType: emailValidation.type,
      studentInfo: {
        university: 'Administration FocusTâche',
        faculty: 'Équipe de gestion',
        city: 'Rabat'
      },
      approvedAt: new Date()
    });

    console.log(`✅ Admin créé: ${admin.email}`);
    return admin;
  } catch (error) {
    console.error(`❌ Erreur création admin ${email}:`, error.message);
    throw error;
  }
};