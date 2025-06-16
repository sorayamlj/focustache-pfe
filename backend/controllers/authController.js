// backend/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { email, password, nom } = req.body;

  if (!email || !password || !nom) {
    return res.status(400).json({ msg: "Champs manquants" });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: "Email déjà utilisé" });

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password: hashed, nom });

  // On inclut maintenant l'email dans le token
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // On renvoie aussi l'objet user « safe »
  const safeUser = { _id: user._id, email: user.email, nom: user.nom };
  res.json({ user: safeUser, token });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return res.status(400).json({ msg: "Connexion uniquement via adresse Gmail." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Utilisateur non trouvé." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Mot de passe incorrect." });

    // On inclut l'email dans le token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    const safeUser = { _id: user._id, email: user.email, nom: user.nom };
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur", err });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Erreur serveur" });
  }
};