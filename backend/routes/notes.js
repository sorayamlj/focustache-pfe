import express from "express";
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
} from "../controllers/noteController.js";

const router = express.Router();

// ❌ RETIRÉ: router.use(verifyToken); 
// Car verifyToken est déjà appliqué dans server.js

router.get("/", getNotes);
router.get("/:id", getNote);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;