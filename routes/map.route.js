//router
import { Router } from "express";
import auth from "../middlewares/auth.js";
//controllers
import { getlocationImage } from "../controllers/map.controller.js";
const router = Router();

//
// @desc update routes
//
router.get("/location-image", [auth], getlocationImage);

export default router;
