// src/services/dashboardApi.js
const API_BASE = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const dashboardApi = {
  // Récupérer les stats du dashboard
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur getStats:', error);
      throw error;
    }
  },

  // Récupérer l'activité récente
  getActivity: async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/activity`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'activité');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur getActivity:', error);
      throw error;
    }
  },

  // Récupérer les tâches récentes
  getRecentTasks: async (limit = 5) => {
    try {
      const response = await fetch(`${API_BASE}/tasks?limit=${limit}&sort=updatedAt&order=desc`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tâches récentes');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur getRecentTasks:', error);
      throw error;
    }
  }
};