//router
import { Router } from "express";
import auth from "../middlewares/auth.js";
//controllers
import { updateUser } from "../controllers/user.controller.js";
const router = Router();

//
// @desc update routes
//
router.put("/:userRequestType", [auth], updateUser);

export default router;
