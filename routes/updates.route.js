//router
import { Router } from "express";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";
//controllers
import {
  getUpdates,
  createUpdate,
  updateProjectUpdate,
  deleteProjectUpdate,
} from "../controllers/update.controller.js";

const router = Router();
//
// @desc get routes
//
router.get("/:updateRequestType", [auth, admin], getUpdates);

//
// @desc create update
//
router.post("/:updateRequestType", [auth, admin], createUpdate);

//
// @desc update update
//
router.put("/:updateRequestType", [auth, admin], updateProjectUpdate);
//
// @desc update delete
//
router.delete("/", [auth, admin], deleteProjectUpdate);

export default router;
