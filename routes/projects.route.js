//router
import { Router } from "express";
import auth from "../middlewares/auth.js";
//controllers
import { getProjects, createProject, updateProject } from "../controllers/project.controller.js";

const router = Router();
//
// @desc get routes
//
router.get("/:projectRequestType", [auth], getProjects);

//
// @desc create project
//
router.post("/:projectRequestType", [auth], createProject);

//
// @desc update project
//
router.put("/:projectRequestType", [auth], updateProject);

export default router;
