import express from "express";
import { getAuthUrl, setCredentials, calendar } from "../utils/google.js";
import Task from "../models/Task.js";

const router = express.Router();

// OAuth flow
router.get("/auth", (req, res) => {
  res.redirect(getAuthUrl());
});
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await calendar._options.auth.getToken(code);
  setCredentials(tokens);
  res.send("Authentification réussie. Retourne à l'application.");
});

// Task sync (parameterized)
router.post("/sync/:taskId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ msg: "Tâche introuvable" });

    const start = new Date(task.dateEcheance);
    const event = {
      summary: task.titre,
      description: task.description || "",
      start: { dateTime: start.toISOString() },
      end: {
        dateTime: new Date(start.getTime() + 60 * 60 * 1000).toISOString()
      }
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event
    });

    res.json({ msg: "Événement synchronisé", link: response.data.htmlLink });
  } catch (err) {
    res.status(500).json({ msg: "Erreur synchronisation", err });
  }
});

export default router;
