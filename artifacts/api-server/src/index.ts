import app from "./app";
import { logger } from "./lib/logger";

// 1. Panatilihin mo itong condition para gumana pa rin sa Local
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    logger.info({ port }, "Server listening on local");
  });
}

// 2. ITO ANG PINAKA-IMPORTANTE PARA SA VERCEL
export default app; 
