// backend/routes/sessions.js - VERSION FINALE CORRIGÉE
import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Session from '../models/Session.js';
import { verifyToken } from '../middleware/authMiddleware.js';


const router = express.Router();

// Fonction utilitaire pour calculer l'efficacité
const calculateEfficiency = (session) => {
  if (!session.tempsTotal || session.tempsTotal === 0) return 0;
  
  const timeEfficiency = Math.min(100, (session.tempsEcoule / session.tempsTotal) * 100);
  const pausePenalty = session.nombrePauses * 3; // 3% par pause
  
  return Math.max(0, Math.round(timeEfficiency - pausePenalty));
};

// Fonction pour calculer l'info du cycle Pomodoro
const getPomodoroInfo = (session) => {
  if (!session.chronodoroMode || !session.dureeCycle) return null;
  
  const totalCycleTime = session.dureeCycle; // Durée d'un cycle de travail
  const currentCycleTime = session.tempsEcoule % totalCycleTime;
  const cycleNumber = Math.floor(session.tempsEcoule / totalCycleTime) + 1;
  const remainingTime = totalCycleTime - currentCycleTime;
  const progress = (currentCycleTime / totalCycleTime) * 100;
  
  return {
    cycleNumber,
    totalCycles: session.cyclesTotalPrevus,
    remainingTime,
    progress: Math.min(100, progress),
    cycleType: session.cycleType || 'work'
  };
};

// @route GET /api/sessions/active
// @desc Récupérer la session active
// @access Private
router.get('/active', verifyToken, async (req, res) => {
  try {
    const activeSession = await Session.findOne({
      user: req.user.id,
      statut: 'active'
    }).populate('taskIds', 'titre module priorite statut dateEcheance');
    
    if (activeSession) {
      // Mettre à jour l'efficacité en temps réel
      activeSession.efficaciteCalculee = calculateEfficiency(activeSession);
      await activeSession.save();
    }
    
    res.json({
      activeSession: activeSession || null,
      message: activeSession ? 'Session active trouvée' : 'Aucune session active',
      pomodoroInfo: activeSession ? getPomodoroInfo(activeSession) : null,
      suggestions: activeSession ? [] : [
        "Créez une nouvelle session pour commencer à travailler",
        "Sélectionnez votre tâche prioritaire",
        "Définissez un objectif clair pour votre session"
      ]
    });
  } catch (error) {
    console.error('❌ Erreur récupération session active:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route POST /api/sessions/start
// @desc Démarrer une nouvelle session (1 tâche uniquement)
// @access Private
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { taskIds, dureeEstimee } = req.body;
    
    // Validation : Une seule tâche autorisée
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length !== 1) {
      return res.status(400).json({ 
        msg: 'Exactement une tâche doit être sélectionnée par session',
        received: taskIds?.length || 0
      });
    }

    const taskId = taskIds[0];
    
    // Validation de l'ID de tâche
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ msg: 'ID de tâche invalide' });
    }

    // Vérifier qu'aucune session n'est déjà active
    const existingSession = await Session.findOne({
      user: req.user.id,
      statut: 'active'
    });

    if (existingSession) {
      return res.status(400).json({ 
        msg: 'Une session est déjà active',
        activeSessionId: existingSession._id,
        suggestion: "Terminez la session en cours avant d'en créer une nouvelle"
      });
    }

    // Récupérer et valider la tâche
    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { user: req.user.id },
        { owners: req.user.email }
      ]
    });

    if (!task) {
      return res.status(404).json({ 
        msg: 'Tâche introuvable ou non autorisée',
        taskId: taskId
      });
    }

    // Validation durée estimée
    if (dureeEstimee && (isNaN(dureeEstimee) || dureeEstimee < 5 || dureeEstimee > 480)) {
      return res.status(400).json({ msg: 'La durée estimée doit être entre 5 et 480 minutes' });
    }

    // Créer la session
    const session = new Session({
      user: req.user.id,
      taskIds: [taskId], // Array avec un seul élément pour compatibilité
      tempsTotal: dureeEstimee ? dureeEstimee * 60 : null,
      statut: 'active'
    });

    await session.save();
    await session.populate('taskIds', 'titre module priorite statut dateEcheance');
    
    console.log('✅ Session créée:', session._id, 'avec tâche:', task.titre);

    res.status(201).json({
      session,
      message: 'Session créée avec succès',
      task: {
        id: task._id,
        titre: task.titre,
        module: task.module,
        priorite: task.priorite
      },
      suggestions: [
        "Activez le mode Focus pour vous concentrer",
        "Utilisez la technique Pomodoro pour des sessions structurées",
        "Éliminez les distractions de votre environnement"
      ]
    });
  } catch (error) {
    console.error('❌ Erreur démarrage session:', error);
    res.status(500).json({ msg: 'Erreur lors du démarrage de la session' });
  }
});

// @route PUT /api/sessions/:id/focus
// @desc Activer le mode Focus simple (sans Pomodoro)
// @access Private
router.put('/:id/focus', verifyToken, async (req, res) => {
  try {
    const { dureeMinutes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'ID de session invalide' });
    }

    // Validation durée
    if (dureeMinutes && (isNaN(dureeMinutes) || dureeMinutes < 5 || dureeMinutes > 480)) {
      return res.status(400).json({ msg: 'La durée doit être entre 5 et 480 minutes' });
    }
    
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
      statut: 'active'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Session introuvable ou non autorisée' });
    }

    // Vérifier que Pomodoro n'est pas déjà actif
    if (session.chronodoroMode) {
      return res.status(400).json({ 
        msg: 'La technique Pomodoro est déjà active sur cette session',
        suggestion: 'Arrêtez la session actuelle pour changer de mode'
      });
    }

    // Activer le mode Focus simple
    session.focusActif = true;
    session.notificationsBloquees = true;
    session.timerActif = true;
    session.timerPause = false;
    session.chronodoroMode = false; // S'assurer que Pomodoro est désactivé
    
    if (dureeMinutes && dureeMinutes > 0) {
      session.tempsTotal = dureeMinutes * 60;
    }

    await session.save();
    await session.populate('taskIds', 'titre module priorite');
    
    console.log('✅ Focus activé pour session:', session._id);

    res.json({
      session,
      message: 'Mode Focus activé',
      focusType: dureeMinutes ? 'Durée fixe' : 'Durée libre',
      notificationsBlocked: true,
      tips: [
        "Concentrez-vous sur votre tâche principale",
        "Évitez les distractions externes",
        "Prenez des notes si des idées vous viennent"
      ]
    });
  } catch (error) {
    console.error('❌ Erreur activation Focus:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route PUT /api/sessions/:id/chronodoro
// @desc Activer le mode Focus + Pomodoro
// @access Private
router.put('/:id/chronodoro', verifyToken, async (req, res) => {
  try {
    const { dureeCycleMinutes = 25, nombreCycles = 4 } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'ID de session invalide' });
    }
    
    // Validation paramètres Pomodoro
    if (isNaN(dureeCycleMinutes) || dureeCycleMinutes < 5 || dureeCycleMinutes > 60) {
      return res.status(400).json({ msg: 'La durée d\'un cycle doit être entre 5 et 60 minutes' });
    }

    if (isNaN(nombreCycles) || nombreCycles < 1 || nombreCycles > 12) {
      return res.status(400).json({ msg: 'Le nombre de cycles doit être entre 1 et 12' });
    }
    
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
      statut: 'active'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Session introuvable ou non autorisée' });
    }

    // Vérifier que Pomodoro n'est pas déjà actif
    if (session.chronodoroMode) {
      return res.status(400).json({ 
        msg: 'La technique Pomodoro est déjà active sur cette session',
        currentCycle: Math.floor(session.cycleCount / 2) + 1,
        cycleType: session.cycleType
      });
    }

    // Activer le mode Focus + Pomodoro
    session.chronodoroMode = true;
    session.focusActif = true;
    session.notificationsBloquees = true;
    session.timerActif = true;
    session.timerPause = false;
    session.dureeCycle = dureeCycleMinutes * 60; // conversion en secondes
    session.cyclesTotalPrevus = nombreCycles;
    session.cycleCount = 0;
    session.cycleType = 'work';

    await session.save();
    await session.populate('taskIds', 'titre module priorite');
    
    console.log('✅ Pomodoro activé pour session:', session._id, `${dureeCycleMinutes}min x ${nombreCycles} cycles`);

    res.json({
      session,
      message: 'Mode Focus + Pomodoro démarré',
      pomodoroInfo: getPomodoroInfo(session),
      cycleInfo: {
        duration: dureeCycleMinutes,
        totalCycles: nombreCycles,
        currentCycle: 1,
        currentType: "work"
      },
      technique: {
        name: "Technique Pomodoro",
        description: "Alternance entre périodes de travail intense et pauses courtes",
        benefits: [
          "Améliore la concentration",
          "Réduit la fatigue mentale", 
          "Augmente la productivité",
          "Structure efficacement le temps de travail"
        ]
      }
    });
  } catch (error) {
    console.error('❌ Erreur démarrage Pomodoro:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route PUT /api/sessions/:id/timer
// @desc Contrôler le timer (pause/reprendre)
// @access Private
router.put('/:id/timer', verifyToken, async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'ID de session invalide' });
    }
    
    if (!['pause', 'resume'].includes(action)) {
      return res.status(400).json({ msg: 'Action doit être "pause" ou "resume"' });
    }
    
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
      statut: 'active'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Session introuvable ou non autorisée' });
    }

    if (!session.focusActif) {
      return res.status(400).json({ 
        msg: 'Le mode Focus doit être actif pour contrôler le timer',
        suggestion: 'Activez le mode Focus ou Pomodoro d\'abord'
      });
    }

    if (action === 'pause') {
      if (session.timerPause) {
        return res.status(400).json({ msg: 'Le timer est déjà en pause' });
      }
      session.timerActif = false;
      session.timerPause = true;
      session.nombrePauses = (session.nombrePauses || 0) + 1;
    } else {
      if (!session.timerPause) {
        return res.status(400).json({ msg: 'Le timer n\'est pas en pause' });
      }
      session.timerActif = true;
      session.timerPause = false;
    }

    await session.save();
    await session.populate('taskIds', 'titre module priorite');
    
    console.log('✅ Timer', action, 'pour session:', session._id);

    res.json({
      session,
      message: action === 'pause' ? 'Timer en pause' : 'Timer repris',
      timerState: {
        active: session.timerActif,
        paused: session.timerPause,
        totalPauses: session.nombrePauses
      },
      pomodoroInfo: session.chronodoroMode ? getPomodoroInfo(session) : null
    });
  } catch (error) {
    console.error('❌ Erreur contrôle timer:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route PUT /api/sessions/:id/update
// @desc Mettre à jour le temps écoulé et gérer les cycles Pomodoro
// @access Private
router.put('/:id/update', verifyToken, async (req, res) => {
  try {
    const { tempsEcouleSecondes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'ID de session invalide' });
    }
    
    if (typeof tempsEcouleSecondes !== 'number' || tempsEcouleSecondes < 0) {
      return res.status(400).json({ msg: 'Le temps écoulé doit être un nombre positif' });
    }
    
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
      statut: 'active'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Session introuvable' });
    }

    if (!session.timerActif) {
      return res.status(400).json({ msg: 'Le timer n\'est pas actif' });
    }

    // Sauvegarder l'ancien temps pour détecter les changements de cycle
    const oldTime = session.tempsEcoule;
    session.tempsEcoule = tempsEcouleSecondes;
    
    // Calculer l'efficacité en temps réel
    session.efficaciteCalculee = calculateEfficiency(session);

    // Vérifier si un cycle Pomodoro est terminé
    let cycleCompleted = false;
    let nextCycle = null;
    
    if (session.chronodoroMode && session.dureeCycle) {
      const oldCycleNumber = Math.floor(oldTime / session.dureeCycle);
      const newCycleNumber = Math.floor(tempsEcouleSecondes / session.dureeCycle);
      
      // Si on vient de finir un cycle
      if (newCycleNumber > oldCycleNumber) {
        cycleCompleted = true;
        session.cycleCount = newCycleNumber;
        
        // Alterner entre travail et pause
        if (session.cycleType === 'work') {
          const isLongBreak = (newCycleNumber % 4 === 0); // Pause longue tous les 4 cycles
          nextCycle = { 
            type: 'break', 
            duration: isLongBreak ? 900 : 300, // 15min ou 5min
            isLong: isLongBreak,
            cycleNumber: newCycleNumber + 1
          };
          session.cycleType = 'break';
        } else {
          nextCycle = { 
            type: 'work', 
            duration: session.dureeCycle,
            cycleNumber: newCycleNumber + 1
          };
          session.cycleType = 'work';
        }
        
        console.log('🔄 Cycle Pomodoro terminé:', newCycleNumber, 'Type suivant:', session.cycleType);
        
        // Vérifier si tous les cycles sont terminés
        const totalCyclesCompleted = Math.floor(newCycleNumber / 2);
        if (totalCyclesCompleted >= session.cyclesTotalPrevus) {
          // Marquer la session comme complétée
          session.statut = 'completed';
          session.dateFin = new Date();
          session.timerActif = false;
          
          await session.save();
          
          console.log('🎉 Tous les cycles Pomodoro terminés - Session auto-complétée');
          
          // Mettre à jour la tâche
          if (session.tempsEcoule > 300) { // Au moins 5 minutes
            await Task.findByIdAndUpdate(session.taskIds[0], {
              $inc: { 
                timeSpent: session.tempsEcoule,
                pomodoroCount: Math.floor(session.cycleCount / 2)
              },
              $set: { 
                statut: session.tempsEcoule > 1800 ? 'en cours' : 'à faire' // 30min+ = en cours
              }
            });
          }
          
          return res.json({
            session: null,
            sessionCompleted: true,
            message: 'Félicitations ! Tous les cycles Pomodoro terminés.',
            stats: {
              dureeeTotale: session.tempsEcoule,
              efficacite: session.efficaciteCalculee,
              nombrePauses: session.nombrePauses,
              cyclesCompletes: Math.floor(session.cycleCount / 2),
              technique: 'Pomodoro'
            }
          });
        }
      }
    }

    await session.save();
    await session.populate('taskIds', 'titre module priorite');

    res.json({
      session,
      pomodoroInfo: session.chronodoroMode ? getPomodoroInfo(session) : null,
      cycleCompleted,
      nextCycle,
      message: cycleCompleted ? 'Cycle terminé !' : 'Session mise à jour'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour session:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route PUT /api/sessions/:id/stop
// @desc Arrêter une session
// @access Private
router.put('/:id/stop', verifyToken, async (req, res) => {
  try {
    const { action = 'complete' } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'ID de session invalide' });
    }
    
    if (!['complete', 'cancel'].includes(action)) {
      return res.status(400).json({ msg: 'Action doit être "complete" ou "cancel"' });
    }
    
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user.id,
      statut: 'active'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Session introuvable' });
    }

    // Calculer les stats finales
    let stats = null;
    if (action === 'complete') {
      session.statut = 'completed';
      session.dateFin = new Date();
      session.timerActif = false;
      session.efficaciteCalculee = calculateEfficiency(session);
      
      stats = {
        dureeeTotale: session.tempsEcoule,
        tempsProductif: Math.max(0, session.tempsEcoule - (session.nombrePauses * 60)),
        efficacite: session.efficaciteCalculee,
        nombrePauses: session.nombrePauses || 0,
        cyclesCompletes: session.chronodoroMode ? Math.floor(session.cycleCount / 2) : 0,
        taskId: session.taskIds[0],
        technique: session.chronodoroMode ? 'Pomodoro' : session.focusActif ? 'Focus' : 'Standard'
      };

      // Mettre à jour la tâche si travail significatif
      if (session.tempsEcoule > 300) { // Au moins 5 minutes
        const updateData = {
          $inc: { timeSpent: session.tempsEcoule }
        };
        
        if (session.chronodoroMode) {
          updateData.$inc.pomodoroCount = Math.floor(session.cycleCount / 2);
        }
        
        // Changer le statut de la tâche si elle était "à faire"
        const task = await Task.findById(session.taskIds[0]);
        if (task && task.statut === 'à faire' && session.tempsEcoule > 900) { // 15min+
          updateData.$set = { statut: 'en cours' };
        }
        
        await Task.findByIdAndUpdate(session.taskIds[0], updateData);
      }
      
      console.log('✅ Session complétée:', session._id, `${Math.floor(session.tempsEcoule / 60)}min`);
    } else {
      session.statut = 'cancelled';
      session.dateFin = new Date();
      session.timerActif = false;
      
      console.log('⏹️ Session annulée:', session._id);
    }

    await session.save();

    res.json({
      message: action === 'complete' ? 'Session terminée avec succès' : 'Session annulée',
      stats,
      recommendations: action === 'complete' ? [
        "Félicitations pour cette session productive !",
        "Prenez une pause bien méritée",
        "Notez vos accomplissements et progrès"
      ] : [
        "Pas de souci, on reprendra plus tard",
        "Identifiez ce qui vous a interrompu",
        "Planifiez votre prochaine session"
      ]
    });
  } catch (error) {
    console.error('❌ Erreur arrêt session:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route GET /api/sessions/history
// @desc Récupérer l'historique des sessions
// @access Private
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let filter = { 
      user: req.user.id,
      statut: { $in: ['completed', 'cancelled'] }
    };

    if (status && ['completed', 'cancelled'].includes(status)) {
      filter.statut = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await Session.find(filter)
      .sort({ dateFin: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('taskIds', 'titre module priorite')
      .lean();

    const total = await Session.countDocuments(filter);
    
    res.json({
      sessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      },
      message: `${sessions.length} session(s) trouvée(s)`
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

// @route GET /api/sessions/stats
// @desc Récupérer les statistiques des sessions
// @access Private
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { periode = 'week' } = req.query;
    
    // Calculer la date de début selon la période
    const now = new Date();
    let startDate;
    
    switch (periode) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Agrégation MongoDB pour les statistiques
    const statsAgg = await Session.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: startDate },
          statut: { $in: ['completed', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          sessionsCompleted: {
            $sum: { $cond: [{ $eq: ['$statut', 'completed'] }, 1, 0] }
          },
          totalTemps: {
            $sum: { $cond: [{ $eq: ['$statut', 'completed'] }, '$tempsEcoule', 0] }
          },
          totalFocus: {
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$statut', 'completed'] }, { $eq: ['$focusActif', true] }] }, 
                '$tempsEcoule', 
                0
              ] 
            }
          },
          totalPomodoro: {
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$statut', 'completed'] }, { $eq: ['$chronodoroMode', true] }] }, 
                '$cycleCount', 
                0
              ] 
            }
          },
          efficaciteMoyenne: {
            $avg: { $cond: [{ $eq: ['$statut', 'completed'] }, '$efficaciteCalculee', null] }
          }
        }
      }
    ]);
    
    const stats = statsAgg[0] || {
      totalSessions: 0,
      sessionsCompleted: 0,
      totalTemps: 0,
      totalFocus: 0,
      totalPomodoro: 0,
      efficaciteMoyenne: 0
    };

    // Calculs additionnels
    const tauxCompletion = stats.totalSessions > 0 
      ? Math.round((stats.sessionsCompleted / stats.totalSessions) * 100) 
      : 0;

    const tempsMoyenParSession = stats.sessionsCompleted > 0 
      ? Math.round(stats.totalTemps / stats.sessionsCompleted) 
      : 0;

    res.json({
      periode: {
        type: periode,
        debut: startDate,
        fin: now,
        jours: Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
      },
      sessions: {
        total: stats.totalSessions,
        completes: stats.sessionsCompleted,
        tauxCompletion: tauxCompletion,
        tempsMoyenParSession: tempsMoyenParSession
      },
      temps: {
        total: stats.totalTemps,
        focus: stats.totalFocus,
        formate: {
          total: `${Math.floor(stats.totalTemps / 3600)}h ${Math.floor((stats.totalTemps % 3600) / 60)}min`,
          focus: `${Math.floor(stats.totalFocus / 3600)}h ${Math.floor((stats.totalFocus % 3600) / 60)}min`,
          moyenne: `${Math.floor(tempsMoyenParSession / 60)}min`
        },
        pourcentageFocus: stats.totalTemps > 0 ? Math.round((stats.totalFocus / stats.totalTemps) * 100) : 0
      },
      pomodoro: {
        cycles: Math.floor(stats.totalPomodoro / 2) || 0,
        sessionsPomodoro: stats.totalPomodoro > 0 ? Math.ceil(stats.totalPomodoro / 8) : 0 // Estimation basée sur 4 cycles moyens
      },
      performance: {
        efficaciteMoyenne: Math.round(stats.efficaciteMoyenne || 0),
        productivite: tauxCompletion
      },
      message: `Statistiques pour la période ${periode}`
    });
  } catch (error) {
    console.error('❌ Erreur calcul statistiques:', error);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

export default router;