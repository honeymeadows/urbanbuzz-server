//router
import { Router } from "express";
import auth from "../middlewares/auth.js";
//controllers
import { updateClient } from "../controllers/user.controller.js";
import { getClientProjects, updateClientProject } from "../controllers/dashboard.controller.js";
import {
  getClientUpdates,
  createClientUpdateComment,
} from "../controllers/dashboard.controller.js";
import { updateNotification } from "../controllers/notification.controller.js";
const router = Router();
//
// @desc update routes
//
router.get("/updates/:updateRequestType", [auth], getClientUpdates);
router.post("/updates/:updateRequestType", [auth], createClientUpdateComment);

//
// @desc project routes
//
router.get("/projects/:projectRequestType", [auth], getClientProjects);
router.put("/projects/:projectRequestType", [auth], updateClientProject);

//
// @desc nptification routes
//
router.put("/notifications/:notificationRequestType", [auth], updateNotification);

//
// @desc profile routes
//

router.put("/profile/:dashboardRequestType", [auth], updateClient);

export default router;
