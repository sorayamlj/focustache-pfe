// src/services/tasksApi.js
const API_BASE = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const tasksApi = {
  // Récupérer toutes les tâches
  getTasks: async () => {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tâches');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur getTasks:', error);
      throw error;
    }
  },

  // Créer une nouvelle tâche
  createTask: async (taskData) => {
    try {
      console.log('=== API DEBUG CREATE TASK ===');
      console.log('URL:', `${API_BASE}/tasks`);
      console.log('Headers:', {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      });
      console.log('Body (stringify):', JSON.stringify(taskData));
      
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(taskData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.msg || `Erreur ${response.status}: ${errorText}`);
        } catch {
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
      }
      
      const result = await response.json();
      console.log('Response success:', result);
      return result;
    } catch (error) {
      console.error('=== API ERROR CREATE TASK ===');
      console.error('Error:', error);
      throw error;
    }
  },

  // Modifier une tâche
  updateTask: async (taskId, taskData) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(taskData) // Toujours en JSON pour l'instant
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erreur lors de la modification de la tâche');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur updateTask:', error);
      throw error;
    }
  },

  // Supprimer une tâche
  deleteTask: async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erreur lors de la suppression de la tâche');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur deleteTask:', error);
      throw error;
    }
  },

  // Marquer une tâche comme terminée
  toggleTaskStatus: async (taskId, completed) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ completed })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Erreur lors du changement de statut');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur toggleTaskStatus:', error);
      throw error;
    }
  }
};