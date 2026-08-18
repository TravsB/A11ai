import app from "./app";
import { logger } from "./lib/logger";

// Allow a sensible default PORT for local development to make it easy to
// run the app without environment variables. In production the PORT should
// still be provided by the environment or orchestration platform.
let port = 5000; // default backend port used in README
const rawPort = process.env["PORT"] ?? process.env.HTTP_PORT ?? process.env.BACKEND_PORT;
if (!rawPort) {
  console.warn("PORT not provided — using default port 5000 for development.");
} else {
  const parsed = Number(rawPort);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  port = parsed;
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
