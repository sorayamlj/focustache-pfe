import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ✅ Scopes étendus pour Calendar + Drive
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive.file"
];

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: 'consent'
  });
};

export const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

export const calendar = google.calendar({ version: "v3", auth: oauth2Client });

import fs from "fs";

export const uploadToDrive = async (filePath, fileName) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMetadata = { name: fileName };
  const media = {
    mimeType: "application/pdf",
    body: fs.createReadStream(filePath)
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id"
  });

  return file.data;
};

// ========== NOUVELLES FONCTIONS GOOGLE CALENDAR ==========

// Échanger le code contre des tokens
export const getTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    throw new Error(`Erreur lors de l'obtention des tokens: ${error.message}`);
  }
};

// Créer un événement dans Google Calendar
export const createCalendarEvent = async (eventData) => {
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.startDateTime,
        timeZone: 'Africa/Casablanca',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: 'Africa/Casablanca',
      },
      colorId: getPriorityColor(eventData.priority),
      extendedProperties: {
        private: {
          taskId: eventData.taskId,
          source: 'focustache'
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data;
  } catch (error) {
    throw new Error(`Erreur lors de la création de l'événement: ${error.message}`);
  }
};

// Lister les événements
export const getCalendarEvents = async (timeMin, timeMax) => {
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des événements: ${error.message}`);
  }
};

// Mettre à jour un événement
export const updateCalendarEvent = async (eventId, eventData) => {
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.startDateTime,
        timeZone: 'Africa/Casablanca',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: 'Africa/Casablanca',
      },
      colorId: getPriorityColor(eventData.priority),
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return response.data;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de l'événement: ${error.message}`);
  }
};

// Supprimer un événement
export const deleteCalendarEvent = async (eventId) => {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (error) {
    throw new Error(`Erreur lors de la suppression de l'événement: ${error.message}`);
  }
};

// Obtenir les couleurs selon la priorité
export const getPriorityColor = (priority) => {
  const colorMap = {
    'haute': '11', // Rouge
    'moyenne': '5', // Jaune
    'basse': '2'   // Vert
  };
  return colorMap[priority] || '1'; // Bleu par défaut
};

// Convertir une tâche en événement Google Calendar
export const taskToEvent = (task) => {
  const deadline = new Date(task.dateEcheance);
  const duration = task.dureeEstimee || 60; // 1 heure par défaut

  // Si pas d'heure spécifiée, mettre à 09:00
  if (!task.heure) {
    deadline.setHours(9, 0, 0, 0);
  } else {
    const [hours, minutes] = task.heure.split(':');
    deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }

  const endTime = new Date(deadline.getTime() + (duration * 60000));

  return {
    title: task.titre,
    description: `${task.description || ''}\n\nTâche créée depuis FocusTache\nPriorité: ${task.priorite}\nCatégorie: ${task.categorie}`,
    startDateTime: deadline.toISOString(),
    endDateTime: endTime.toISOString(),
    priority: task.priorite,
    taskId: task._id.toString()
  };
};

// Convertir un événement Google en tâche
export const eventToTask = (event) => {
  return {
    titre: event.summary || 'Événement Google Calendar',
    description: event.description || '',
    dateEcheance: event.start.dateTime || event.start.date,
    heure: event.start.dateTime ? 
      new Date(event.start.dateTime).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : null,
    priorite: 'moyenne',
    categorie: 'autre',
    statut: 'à faire',
    googleEventId: event.id,
    source: 'google-calendar'
  };
};