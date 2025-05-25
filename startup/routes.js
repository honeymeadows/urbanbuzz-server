import { json } from "express";
//routes
import authentications from "../routes/authentications.route.js";
import admins from "../routes/admins.route.js";
import dashboard from "../routes/dashboard.route.js";
import clients from "../routes/clients.route.js";
import invites from "../routes/invites.route.js";
import projects from "../routes/projects.route.js";
import updates from "../routes/updates.route.js";
import developments from "../routes/developments.route.js";
import users from "../routes/users.route.js";
import map from "../routes/map.route.js";
import tokens from "../routes/tokens.route.js";

/**
 * Initialize express routes
 * @param {expressapp} app The exrpess app.
 */
export default function (app) {
  app.use(json());
  app.use("/authentications", authentications);
  app.use("/admins", admins);
  app.use("/dashboard", dashboard);
  app.use("/clients", clients);
  app.use("/invites", invites);
  app.use("/projects", projects);
  app.use("/updates", updates);
  app.use("/developments", developments);
  app.use("/users", users);
  app.use("/map", map);
  app.use("/tokens", tokens);
}
