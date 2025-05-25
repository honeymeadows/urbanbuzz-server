import "dotenv/config";
import express from "express";
import parser from "./startup/parser.js";
import routes from "./startup/routes.js";
import cors from "./startup/cors.js";

const app = express();

cors(app);
// Initialize parser
parser(app);
// Initialize routes
routes(app);

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
