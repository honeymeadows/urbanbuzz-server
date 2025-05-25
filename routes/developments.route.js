//router
import { Router } from "express";
//controllers
import { updateDb } from "../controllers/development.controller.js";
const router = Router();
//
// @desc routes
//

router.get("/", updateDb);

export default router;
