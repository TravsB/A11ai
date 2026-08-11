import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && (!sessionSecret || sessionSecret === "dev-secret-change-me")) {
  throw new Error(
    "CRITICAL SECURITY ERROR: SESSION_SECRET must be set to a strong secret key in production environment.",
  );
}

if (!sessionSecret || sessionSecret === "dev-secret-change-me") {
  logger.warn(
    "SECURITY WARNING: SESSION_SECRET is using default development key. Set SESSION_SECRET env variable before deploying.",
  );
}

if (!process.env.DATABASE_URL) {
  logger.warn(
    "DATABASE_URL environment variable is missing. Database features will fail until configured.",
  );
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, env: process.env.NODE_ENV ?? "development" }, "Server listening");
});
