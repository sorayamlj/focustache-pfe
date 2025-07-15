// services/profileApi.js - Version simplifiée

export const profileApi = {
  // Fonctions temporaires pour faire fonctionner le composant
  getProfile: async () => {
    // Retourner des données mockées pour le moment
    return {
      name: "Utilisateur",
      email: "user@example.com",
      avatar: null,
      preferences: {
        theme: "dark",
        notifications: true
      }
    };
  },

  updateProfile: async (data) => {
    console.log("Mise à jour du profil:", data);
    return { success: true, message: "Profil mis à jour" };
  },

  changePassword: async (data) => {
    console.log("Changement de mot de passe:", data);
    return { success: true, message: "Mot de passe changé" };
  },

  uploadAvatar: async (file) => {
    console.log("Upload avatar:", file);
    return { success: true, avatarUrl: "fake-url" };
  },

  deleteAvatar: async () => {
    console.log("Suppression avatar");
    return { success: true };
  }
};

export default profileApi;