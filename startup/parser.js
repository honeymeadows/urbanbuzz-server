import bodyParser from "body-parser";
const { json, urlencoded } = bodyParser;

/**
 * Initialize express routes
 * @param {expressapp} app The exrpess app.
 */
export default function (app) {
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ limit: "50mb", extended: true }));
}
