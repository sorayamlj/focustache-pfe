// setup.js - SCRIPT TOUT-EN-UN pour FocusTache
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createAdmin } from './controllers/authController.js';
import connectDB from './config/db.js';

dotenv.config();

// Configuration des admins
const ADMINS = [
  {
    nom: 'Admin Principal',
    email: 'admin@focustache.local',
    password: 'Admin123!'
  },
  {
    nom: 'Admin Secondaire', 
    email: 'admin2@focustache.local',
    password: 'Admin456!'
  }
];

// Fonction principale de setup
const setup = async () => {
  try {
    console.log('🚀 SETUP FOCUSTACHE - Validation Étudiante');
    console.log('==========================================\n');
    
    // 1. Connexion DB
    console.log('1️⃣ Connexion à la base de données...');
    await connectDB();
    console.log('   ✅ Connecté à MongoDB\n');
    
    // 2. Création des admins
    console.log('2️⃣ Création des admins...');
    for (const adminConfig of ADMINS) {
      try {
        await createAdmin(adminConfig.email, adminConfig.password, adminConfig.nom);
      } catch (error) {
        console.error(`   ❌ Erreur admin ${adminConfig.email}:`, error.message);
      }
    }
    console.log('');
    
    // 3. Test de la configuration email
    console.log('3️⃣ Test de la configuration email...');
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
      
      await transporter.verify();
      console.log('   ✅ Configuration Gmail valide');
    } catch (error) {
      console.log('   ⚠️  Configuration Gmail invalide:', error.message);
      console.log('   📝 Vérifiez GMAIL_USER et GMAIL_PASS dans .env');
    }
    console.log('');
    
    // 4. Statistiques
    const User = (await import('./models/User.js')).default;
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const pendingStudents = await User.countDocuments({ validationStatus: 'pending' });
    
    console.log('4️⃣ Statistiques actuelles:');
    console.log(`   👥 Total utilisateurs: ${totalUsers}`);
    console.log(`   🔑 Admins: ${totalAdmins}`);
    console.log(`   ⏳ Étudiants en attente: ${pendingStudents}`);
    console.log('');
    
    // 5. Informations de connexion
    console.log('5️⃣ Informations de connexion:');
    console.log('   🌐 Application: http://localhost:3000');
    console.log('   🔧 API: http://localhost:5000');
    console.log('');
    console.log('   🔑 Connexion Admin 1:');
    console.log(`      Email: ${ADMINS[0].email}`);
    console.log(`      Password: ${ADMINS[0].password}`);
    console.log('');
    console.log('   🔑 Connexion Admin 2:');
    console.log(`      Email: ${ADMINS[1].email}`);
    console.log(`      Password: ${ADMINS[1].password}`);
    console.log('');
    
    // 6. Routes disponibles
    console.log('6️⃣ Routes API importantes:');
    console.log('   📝 POST /api/auth/register - Inscription étudiant');
    console.log('   🔐 POST /api/auth/login - Connexion');
    console.log('   👤 GET /api/auth/me - Profil utilisateur');
    console.log('   📋 GET /api/auth/admin/pending-students - Étudiants en attente');
    console.log('   ✅ POST /api/auth/admin/approve/:userId - Approuver');
    console.log('   ❌ POST /api/auth/admin/reject/:userId - Rejeter');
    console.log('   📊 GET /api/auth/admin/stats - Statistiques');
    console.log('');
    
    console.log('🎯 SETUP TERMINÉ AVEC SUCCÈS !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Lancez le serveur: npm run dev');
    console.log('   2. Testez la connexion admin');
    console.log('   3. Inscrivez un étudiant test');
    console.log('   4. Approuvez-le depuis l\'interface admin');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur setup:', error);
    process.exit(1);
  }
};

// Test d'envoi d'email
const testEmail = async (emailTo) => {
  try {
    console.log(`📧 Test envoi email vers ${emailTo}...\n`);
    
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const mailOptions = {
      from: {
        name: 'FocusTache - Test',
        address: 'noreply@focustache.local'
      },
      to: emailTo,
      subject: '🧪 Test Email FocusTache',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">🎯 FocusTache</h1>
          <p>Ceci est un email de test pour vérifier la configuration.</p>
          <p><strong>Configuration email fonctionnelle ✅</strong></p>
          <p>Gmail: ${process.env.GMAIL_USER}</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email test envoyé avec succès à ${emailTo}`);
    console.log('📧 Vérifiez votre boîte de réception (et spams)');
  } catch (error) {
    console.error('❌ Erreur test email:', error.message);
  }
  
  process.exit(0);
};

// Ajouter un admin rapidement
const addAdmin = async (email, password, nom) => {
  try {
    await connectDB();
    await createAdmin(email, password, nom);
    console.log(`✅ Admin ajouté: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur ajout admin:', error);
    process.exit(1);
  }
};

// Exécution selon les arguments
const command = process.argv[2];

if (command === 'test-email' && process.argv[3]) {
  testEmail(process.argv[3]);
} else if (command === 'add-admin' && process.argv[3] && process.argv[4] && process.argv[5]) {
  addAdmin(process.argv[3], process.argv[4], process.argv[5]);
} else if (command === 'setup' || !command) {
  setup();
} else {
  console.log('🔧 SETUP FOCUSTACHE - Usage:');
  console.log('');
  console.log('  node setup.js                              # Setup complet');
  console.log('  node setup.js test-email votre@email.com   # Test email');
  console.log('  node setup.js add-admin email password nom # Ajouter admin');
  console.log('');
  console.log('Exemples:');
  console.log('  node setup.js');
  console.log('  node setup.js test-email test@gmail.com');
  console.log('  node setup.js add-admin admin3@focustache.local Password123 "Nouvel Admin"');
}