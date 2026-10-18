import { createApp } from "./app.js";
import { env } from "./config/env.js";

async function bootstrap() {
  const app = await createApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`Server running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  }
}

void bootstrap();
