import cors from "cors";
/**
 * Initialize express routes
 * @param {expressapp} app The exrpess app.
 */
export default function (app) {
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "https://app.honeymeadows.ca",
        "https://honey-meadow-git-development-bitechxconnects-projects.vercel.app",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type", "x-auth-token"],
    })
  );
}
