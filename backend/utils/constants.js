// utils/constants.js
// Constantes de l'application FocusTâche

export const TASK_STATUS = {
  TODO: 'à faire',
  IN_PROGRESS: 'en cours',
  COMPLETED: 'terminée',
  DELETED: 'supprimée'
};

export const TASK_PRIORITY = {
  LOW: 'basse',
  MEDIUM: 'moyenne',
  HIGH: 'haute'
};

export const TASK_CATEGORY = {
  ACADEMIC: 'universitaire',
  PARA_ACADEMIC: 'para-universitaire',
  OTHER: 'autre'
};

export const POMODORO_TYPES = {
  WORK: 'work',
  SHORT_BREAK: 'short-break',
  LONG_BREAK: 'long-break'
};

export const POMODORO_DURATIONS = {
  [POMODORO_TYPES.WORK]: 1500,        // 25 minutes
  [POMODORO_TYPES.SHORT_BREAK]: 300,  // 5 minutes
  [POMODORO_TYPES.LONG_BREAK]: 900    // 15 minutes
};

export const API_MESSAGES = {
  SUCCESS: {
    TASK_CREATED: "Tâche créée avec succès",
    TASK_UPDATED: "Tâche mise à jour",
    TASK_DELETED: "Tâche supprimée",
    TASK_SHARED: "Tâche partagée avec succès",
    SESSION_STARTED: "Session démarrée",
    SESSION_ENDED: "Session terminée",
    POMODORO_STARTED: "Session Pomodoro démarrée",
    POMODORO_COMPLETED: "Session Pomodoro terminée avec succès"
  },
  ERROR: {
    TASK_NOT_FOUND: "Tâche introuvable",
    UNAUTHORIZED: "Non autorisé",
    INVALID_EMAIL: "Adresse Gmail invalide",
    VALIDATION_ERROR: "Erreur de validation",
    SESSION_NOT_FOUND: "Session introuvable",
    ACTIVE_SESSION_EXISTS: "Une session est déjà active"
  }
};

export const REGEX_PATTERNS = {
  GMAIL: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
  SLUG: /^[a-z0-9-]+$/,
  SAFE_STRING: /^[a-zA-ZÀ-ÿ0-9\s\-_.,!?()'"]+$/
};