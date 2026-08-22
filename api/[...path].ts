import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";
import { ensureOrderingSchema } from "../artifacts/api-server/src/lib/ordering";

let schemaReady: Promise<void> | undefined;

function initializeDatabase() {
  schemaReady ??= ensureOrderingSchema().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const expressHandler = app as unknown as (
  req: IncomingMessage,
  res: ServerResponse,
) => void;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await initializeDatabase();
    expressHandler(req, res);
  } catch (error) {
    console.error("Unable to initialize ordering database", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: {
        code: "ORDERING_UNAVAILABLE",
        message: "Online ordering is temporarily unavailable. Please try again shortly.",
      },
    }));
  }
}