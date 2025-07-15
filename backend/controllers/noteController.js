import Note from "../models/Note.js";

// GET /api/notes
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: "Erreur récupération notes", err });
  }
};

// GET /api/notes/:id
export const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ msg: "Note non trouvée" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ msg: "Erreur récupération note", err });
  }
};

// POST /api/notes
export const createNote = async (req, res) => {
  const { title, content = '' } = req.body; // content par défaut vide
  if (!title) {
    return res.status(400).json({ msg: "Titre requis" });
  }
  try {
    const note = await Note.create({ title, content, owner: req.user.id });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ msg: "Erreur création note", err });
  }
};


// PUT /api/notes/:id
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { ...req.body },
      { new: true }
    );
    if (!note) return res.status(404).json({ msg: "Note non trouvée ou non autorisé" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ msg: "Erreur mise à jour note", err });
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!note) return res.status(404).json({ msg: "Note non trouvée ou non autorisé" });
    res.json({ msg: "Note supprimée" });
  } catch (err) {
    res.status(500).json({ msg: "Erreur suppression note", err });
  }
};