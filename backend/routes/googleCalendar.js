import express from "express";
import { getAuthUrl, setCredentials, calendar } from "../utils/google.js";
import Task from "../models/Task.js";

const router = express.Router();

// Store user tokens (amélioration pour multi-utilisateurs)
const userTokens = new Map();

// OAuth flow - Version améliorée
router.get("/auth", (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl }); // JSON au lieu de redirect pour le frontend
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await calendar._options.auth.getToken(code);
    setCredentials(tokens);
    
    // Stocker les tokens (amélioré)
    userTokens.set('default', tokens);
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>FocusTache - Authentification réussie</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>✅ Authentification Google réussie !</h2>
          <p>Votre compte Google est maintenant connecté à FocusTache.</p>
          <p>Vous pouvez fermer cette fenêtre et retourner à l'application.</p>
          <script>
            // Fermer automatiquement la popup après 3 secondes
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Erreur: ${error.message}`);
  }
});

// ✅ NOUVELLES ROUTES AJOUTÉES

// Vérifier le statut de connexion Google
router.get("/status", (req, res) => {
  const hasToken = userTokens.has('default');
  res.json({ 
    isConnected: hasToken,
    hasToken 
  });
});

// Task sync (votre route existante - gardée)
router.post("/sync/:taskId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ msg: "Tâche introuvable" });

    const start = new Date(task.dateEcheance);
    
    // Si la tâche a une heure, l'utiliser
    if (task.heure) {
      const [hours, minutes] = task.heure.split(':');
      start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      start.setHours(9, 0, 0, 0); // 9h par défaut
    }

    const event = {
      summary: task.titre,
      description: `${task.description || ""}\n\nCréé depuis FocusTache\nPriorité: ${task.priorite}\nCatégorie: ${task.categorie}`,
      start: { 
        dateTime: start.toISOString(),
        timeZone: 'Africa/Casablanca'
      },
      end: {
        dateTime: new Date(start.getTime() + (task.dureeEstimee || 60) * 60 * 1000).toISOString(),
        timeZone: 'Africa/Casablanca'
      },
      colorId: getPriorityColor(task.priorite),
      extendedProperties: {
        private: {
          taskId: task._id.toString(),
          source: 'focustache'
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event
    });

    // Sauvegarder l'ID de l'événement dans la tâche
    task.googleEventId = response.data.id;
    await task.save();

    res.json({ 
      success: true,
      msg: "Événement synchronisé", 
      eventId: response.data.id,
      link: response.data.htmlLink 
    });
  } catch (err) {
    res.status(500).json({ msg: "Erreur synchronisation", error: err.message });
  }
});

// Synchroniser TOUTES les tâches en attente
router.post("/sync-all", async (req, res) => {
  try {
    if (!userTokens.has('default')) {
      return res.status(401).json({ error: 'Non authentifié avec Google' });
    }

    // Récupérer toutes les tâches sans eventId
    const tasks = await Task.find({ 
      googleEventId: { $exists: false },
      statut: { $ne: 'terminée' }
    });

    const results = [];
    
    for (const task of tasks) {
      try {
        const start = new Date(task.dateEcheance);
        
        if (task.heure) {
          const [hours, minutes] = task.heure.split(':');
          start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          start.setHours(9, 0, 0, 0);
        }

        const event = {
          summary: task.titre,
          description: `${task.description || ""}\n\nCréé depuis FocusTache\nPriorité: ${task.priorite}\nCatégorie: ${task.categorie}`,
          start: { 
            dateTime: start.toISOString(),
            timeZone: 'Africa/Casablanca'
          },
          end: {
            dateTime: new Date(start.getTime() + (task.dureeEstimee || 60) * 60 * 1000).toISOString(),
            timeZone: 'Africa/Casablanca'
          },
          colorId: getPriorityColor(task.priorite),
          extendedProperties: {
            private: {
              taskId: task._id.toString(),
              source: 'focustache'
            }
          }
        };

        const response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: event
        });
        
        task.googleEventId = response.data.id;
        await task.save();
        
        results.push({
          taskId: task._id,
          taskTitle: task.titre,
          success: true,
          eventId: response.data.id
        });
      } catch (error) {
        results.push({
          taskId: task._id,
          taskTitle: task.titre,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true,
      message: `${results.filter(r => r.success).length}/${results.length} tâches synchronisées`,
      results 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Importer les événements de Google Calendar
router.get("/import", async (req, res) => {
  try {
    if (!userTokens.has('default')) {
      return res.status(401).json({ error: 'Non authentifié avec Google' });
    }

    // Dates pour la récupération (30 jours à partir d'aujourd'hui)
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    // Filtrer les événements qui ne viennent pas de notre app
    const externalEvents = events.filter(event => 
      !event.extendedProperties?.private?.source === 'focustache'
    );

    const importedTasks = [];
    
    for (const event of externalEvents) {
      // Vérifier si cette tâche existe déjà
      const existingTask = await Task.findOne({ googleEventId: event.id });
      
      if (!existingTask) {
        const taskData = {
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

        const newTask = new Task(taskData);
        await newTask.save();
        importedTasks.push(newTask);
      }
    }

    res.json({
      success: true,
      message: `${importedTasks.length} nouveaux événements importés`,
      importedCount: importedTasks.length,
      totalEvents: events.length,
      tasks: importedTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Déconnecter Google Calendar
router.post("/disconnect", (req, res) => {
  userTokens.delete('default');
  res.json({ 
    success: true, 
    message: 'Déconnecté de Google Calendar' 
  });
});

// Fonction utilitaire pour les couleurs
function getPriorityColor(priority) {
  const colorMap = {
    'haute': '11', // Rouge
    'moyenne': '5', // Jaune
    'basse': '2'   // Vert
  };
  return colorMap[priority] || '1'; // Bleu par défaut
}

export default router;