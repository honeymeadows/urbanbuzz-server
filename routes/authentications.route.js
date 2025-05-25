//router
import { Router } from "express";
//controllers
import { authentications } from "../controllers/auth.controller.js";
//messsages
const router = Router();

//
// @desc routes
//
router.post("/:authRequestType", authentications);

export default router;
