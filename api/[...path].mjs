import app, { ensureOrderingSchema } from "../artifacts/api-server/dist/vercel.mjs";

let schemaReady;

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

export default async function handler(req, res) {
  try {
    await initializeDatabase();
    app(req, res);
  } catch (error) {
    console.error("Unable to initialize ordering database", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: {
          code: "ORDERING_UNAVAILABLE",
          message:
            "Online ordering is temporarily unavailable. Please try again shortly.",
        },
      }),
    );
  }
}