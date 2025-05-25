//router
import { Router } from "express";
//authorization middlewares
import auth from "../middlewares/auth.js";
//controllers
import { createAdminInvite, createInvite, resendInvite } from "../controllers/invite.controller.js";
import admin from "../middlewares/admin.js";

const router = Router();
//
// @desc routes
//

//
// @desc get programs
//
router.post("/admin", [auth, admin], createAdminInvite);
router.post("/:inviteRequestType", [auth, admin], createInvite);
router.put("/:inviteRequestType", [auth, admin], resendInvite);

export default router;
