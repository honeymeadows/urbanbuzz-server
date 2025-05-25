//router
import { Router } from "express";
import { getJwtToken } from "../controllers/token.controller.js";

const router = Router();
//
// @desc routes
//

//
// @desc get programs
//
router.get("/", getJwtToken);

//
// @desc update programs
//

export default router;
