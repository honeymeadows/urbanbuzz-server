import "dotenv/config";
import express from "express";
import parser from "./startup/parser.js";
import routes from "./startup/routes.js";
import cors from "./startup/cors.js";
import helmet from "./startup/helmet.js";
import hpp from "./startup/hpp.js";
import limiter from "./startup/limiter.js";

const app = express();

cors(app);
helmet(app);
hpp(app);
limiter(app);
parser(app);
routes(app);

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
