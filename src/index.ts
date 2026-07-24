import { env } from "./config/env";
import { createAppServer } from "./app";

const server = createAppServer();

server.listen(env.PORT, () => {
  console.info(`API listening on port ${env.PORT}`);
});
