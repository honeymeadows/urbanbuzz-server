//router
import { Router } from "express";
//failed request delay
//controllers
import { getAdmins, deleteAdmins } from "../controllers/admin.controller.js";
//messsages

const router = Router();
//
// @desc get routes
//
router.get("/:adminRequestType", getAdmins);

//
// @desc delete routes
//
router.delete("/:adminRequestType/:adminId", deleteAdmins);

export default router;
