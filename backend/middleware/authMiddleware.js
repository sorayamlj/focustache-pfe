// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ msg: "Token manquant" });

  const token = authHeader.split(" ")[1];
  try {
    // decoded aura { id, email } grâce au nouveau token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };

    // Optionnel : recharger l'email depuis la DB pour être sûr
    const user = await User.findById(decoded.id).select("email");
    req.user.email = user.email;

    next();
  } catch {
    res.status(403).json({ msg: "Token invalide" });
  }
};