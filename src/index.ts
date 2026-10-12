import { createAppServer } from "./app";
import { env, isR2Configured } from "./config/env";

const server = createAppServer();

server.listen(env.PORT, () => {
  console.info(`API listening on port ${env.PORT}`);
  console.info(isR2Configured() ? "Object storage: Cloudflare R2" : "Object storage: local disk (UPLOADS_DIR)");
});
