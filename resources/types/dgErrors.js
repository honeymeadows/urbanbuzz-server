import { errorTypes } from "./index";

export const dbErrorTypes = {
  ["P1000"]: "unauthorized",
  ["P2002"]: errorTypes.alreadyExists,
};
