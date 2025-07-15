// backend/utils/emailValidation.js - VALIDATION SIMPLIFIÉE ES MODULES
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Domaines universitaires marocains autorisés - LISTE COMPLÈTE
const moroccanUniversityDomains = [
  // ===== UNIVERSITÉS PUBLIQUES PRINCIPALES =====
  '@um5r.ac.ma',      // Université Mohammed V Rabat
  '@uh2c.ac.ma',      // Université Hassan II Casablanca  
  '@uca.ac.ma',       // Université Cadi Ayyad Marrakech
  '@uit.ac.ma',       // Université Ibn Tofail Kénitra
  '@usmba.ac.ma',     // Université Sidi Mohamed Ben Abdellah Fès
  '@ump.ac.ma',       // Université Mohammed Premier Oujda
  '@uiz.ac.ma',       // Université Ibn Zohr Agadir
  '@umi.ac.ma',       // Université Moulay Ismail Meknès
  '@uae.ac.ma',       // Université Abdelmalek Essaadi Tétouan
  '@usms.ac.ma',      // Université Sultan Moulay Slimane Béni Mellal
  '@uhp.ac.ma',       // Université Hassan Premier Settat
  '@ucam.ac.ma',      // Université Chouaib Doukkali El Jadida
  '@univh2m.ac.ma',   // Université Hassan II Mohammedia
  
  // ===== ÉCOLES ET INSTITUTS RATTACHÉS =====
  '@ensa.ac.ma',      // Écoles Nationales des Sciences Appliquées
  '@est.ac.ma',       // Écoles Supérieures de Technologie
  '@fsjes.ac.ma',     // Facultés Sciences Juridiques Économiques et Sociales
  '@fst.ac.ma',       // Facultés des Sciences et Techniques
  '@flsh.ac.ma',      // Facultés des Lettres et Sciences Humaines
  '@fm.ac.ma',        // Facultés de Médecine
  '@fp.ac.ma',        // Facultés Polydisciplinaires
  
  // ===== UNIVERSITÉS PRIVÉES RECONNUES =====
  '@aui.ma',          // Al Akhawayn University Ifrane
  '@uir.ac.ma',       // Université Internationale de Rabat
  '@mundiapolis.ma',  // Mundiapolis Casablanca
  '@upm.ac.ma',       // Université Polytechnique Mohammed VI
  '@emsi.ma',         // École Marocaine des Sciences de l'Ingénieur
  '@uca.ma',          // Université Centrale Casablanca
  '@uic.ac.ma',       // Université Internationale de Casablanca
  '@universiapolis.ma', // Universiapolis Agadir
  
  // ===== ÉCOLES SUPÉRIEURES ET INSTITUTS =====
  '@ehtp.ac.ma',      // École Hassania des Travaux Publics
  '@enh.ac.ma',       // École Nationale d'Horticulture
  '@enim.ac.ma',      // École Nationale de l'Industrie Minérale
  '@emi.ac.ma',       // École Mohammadia d'Ingénieurs
  '@iav.ac.ma',       // Institut Agronomique et Vétérinaire Hassan II
  '@inpt.ac.ma',      // Institut National des Postes et Télécommunications
  '@insea.ac.ma',     // Institut National de Statistique et d'Économie Appliquée
  
  // ===== DOMAINES GÉNÉRIQUES UNIVERSITAIRES =====
  '.ac.ma',           // Tout domaine académique marocain
  '.edu.ma'           // Domaines éducatifs marocains
];

// Vérifier si le domaine email existe (DNS check)
const checkEmailDomainExists = async (email) => {
  try {
    const domain = email.split('@')[1].toLowerCase();
    await resolveMx(domain);
    return true;
  } catch (error) {
    console.error(`Domaine inexistant: ${email.split('@')[1]}`);
    return false;
  }
};

// Validation principale
const validateEmail = async (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email requis' };
  }

  const emailLower = email.toLowerCase().trim();
  
  // Format de base
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return { isValid: false, reason: 'Format d\'email invalide' };
  }

  // Vérifier que le domaine existe
  const domainExists = await checkEmailDomainExists(emailLower);
  if (!domainExists) {
    return { isValid: false, reason: 'Ce domaine email n\'existe pas' };
  }

  // Vérifier Gmail
  if (emailLower.endsWith('@gmail.com')) {
    return { isValid: true, type: 'gmail' };
  }

  // Vérifier universités marocaines (plus flexible)
  const isUniversityEmail = moroccanUniversityDomains.some(domain => {
    if (domain.startsWith('@')) {
      // Domaine exact comme @um5r.ac.ma
      return emailLower.endsWith(domain.toLowerCase());
    } else {
      // Domaine partiel comme .ac.ma ou .edu.ma
      return emailLower.includes(domain.toLowerCase());
    }
  });
  
  if (isUniversityEmail) {
    return { isValid: true, type: 'university' };
  }

  // Rejeter tout le reste
  return { 
    isValid: false, 
    reason: 'Seuls les emails Gmail et universitaires marocains sont acceptés' 
  };
};

export {
  validateEmail,
  moroccanUniversityDomains
};