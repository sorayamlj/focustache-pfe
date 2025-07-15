// frontend/src/services/googleCalendarService.js - VERSION TEMPS RÉEL
const API_URL = 'http://localhost:5000';

export const googleCalendarService = {
  // Vérifier le statut de connexion
  async getStatus() {
    try {
      const response = await fetch(`${API_URL}/api/google/status`);
      return await response.json();
    } catch (error) {
      console.error('Erreur statut Google:', error);
      return { isConnected: false, hasToken: false };
    }
  },

  // Se connecter à Google Calendar
  async connect() {
    try {
      const response = await fetch(`${API_URL}/api/google/auth`);
      const data = await response.json();
      
      const popup = window.open(data.authUrl, 'google-auth', 'width=500,height=600');
      
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setTimeout(async () => {
              const status = await this.getStatus();
              resolve(status.isConnected);
            }, 1000);
          }
        }, 1000);
        
        setTimeout(() => {
          if (!popup.closed) {
            popup.close();
            clearInterval(checkClosed);
            reject(new Error('Authentification timeout'));
          }
        }, 300000);
      });
    } catch (error) {
      console.error('Erreur connexion Google:', error);
      throw error;
    }
  },

  // 🆕 SYNCHRONISER UNE SEULE TÂCHE (TEMPS RÉEL)
  async syncSingleTask(task) {
    try {
      const response = await fetch(`${API_URL}/api/google/sync-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur sync tâche unique:', error);
      throw error;
    }
  },

  // 🆕 METTRE À JOUR UNE TÂCHE DANS GOOGLE CALENDAR
  async updateGoogleEvent(task) {
    try {
      const response = await fetch(`${API_URL}/api/google/update-event`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur mise à jour Google Calendar:', error);
      throw error;
    }
  },

  // 🆕 SUPPRIMER UN ÉVÉNEMENT GOOGLE CALENDAR
  async deleteGoogleEvent(googleEventId) {
    try {
      const response = await fetch(`${API_URL}/api/google/delete-event/${googleEventId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur suppression Google Calendar:', error);
      throw error;
    }
  },

  // Synchroniser toutes les tâches
  async syncAll(tasks) {
    try {
      const response = await fetch(`${API_URL}/api/google/sync-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur sync toutes tâches:', error);
      throw error;
    }
  },

  // Importer depuis Google Calendar
  async import() {
    try {
      const response = await fetch(`${API_URL}/api/google/import`);
      return await response.json();
    } catch (error) {
      console.error('Erreur import événements:', error);
      throw error;
    }
  },

  // 🆕 WEBHOOK / POLLING POUR CHANGEMENTS GOOGLE CALENDAR
  async checkForGoogleChanges(lastSyncTime) {
    try {
      const response = await fetch(`${API_URL}/api/google/changes-since`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ since: lastSyncTime })
      });
      return await response.json();
    } catch (error) {
      console.error('Erreur vérification changements Google:', error);
      throw error;
    }
  }
};