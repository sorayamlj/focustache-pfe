// utils/validation.js
// Utilitaires de validation pour l'application

export const validateEmail = (email) => {
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  return gmailRegex.test(email);
};

export const validateTaskData = (data) => {
  const errors = [];
  
  if (!data.titre || data.titre.trim().length === 0) {
    errors.push("Le titre est requis");
  }
  
  if (data.titre && data.titre.length > 200) {
    errors.push("Le titre ne peut pas dépasser 200 caractères");
  }
  
  if (!data.dateEcheance) {
    errors.push("La date d'échéance est requise");
  }
  
  if (data.dateEcheance && new Date(data.dateEcheance) < new Date()) {
    errors.push("La date d'échéance ne peut pas être dans le passé");
  }
  
  if (data.priorite && !['basse', 'moyenne', 'haute'].includes(data.priorite)) {
    errors.push("Priorité invalide");
  }
  
  if (data.statut && !['à faire', 'en cours', 'terminée'].includes(data.statut)) {
    errors.push("Statut invalide");
  }
  
  if (data.categorie && !['universitaire', 'para-universitaire', 'autre'].includes(data.categorie)) {
    errors.push("Catégorie invalide");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeString = (str) => {
  if (!str) return '';
  return str.toString().trim().replace(/[<>]/g, '');
};