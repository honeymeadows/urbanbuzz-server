//router
import { Router } from "express";
import auth from "../middlewares/auth.js";
//controllers
import { getClients, updateClients, deleteClients } from "../controllers/client.controller.js";
const router = Router();

//
// @desc get routes
//
router.get("/:clientRequestType", [auth], getClients);

//
// @desc update routes
//
router.put("/:clientRequestType", updateClients);

//
// @desc delete routes
//
router.delete("/:clientRequestType/:clientId", deleteClients);

export default router;
