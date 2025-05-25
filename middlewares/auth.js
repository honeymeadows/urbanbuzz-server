import { admin } from "../config/firebase.js";

export default async function auth(req, res, next) {
  // check authorization
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(400).json({ message: "Auth token required." });
  }
  try {
    const tokenData = await admin.auth().verifyIdToken(token);
    req.user = {
      ...tokenData,
    };
    req.token = token;
    next();
  } catch (error) {
    console.log("authMiddleware", error);
    return res.status(403).json({ message: "only authorized users can perform this action." });
  }
}
