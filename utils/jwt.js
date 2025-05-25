import jwt from "jsonwebtoken";
import { errorTypes } from "../resources/types/index.js";

export const decodeJwtToken = (token) => {
  if (!token) return { error: "No token." };
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return { error: errorTypes.invalidToken };
  }
};
export const verifyJwtToken = (token, secret) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    return { error: errorTypes.expiredJwt };
  }
};
