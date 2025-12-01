import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;          
    req.userId = user._id;    

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};