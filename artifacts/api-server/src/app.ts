import express, { type Request, type Response } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { handleStripeWebhook } from "./routes/ordering.js";
import { InvalidWebhookError } from "./lib/stripe.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.post("/api/stripe/webhook", express.raw({ type: "application/json", limit: "256kb" }), async (req: Request, res: Response) => {
  try {
    await handleStripeWebhook(req.body.toString("utf8"), req.header("stripe-signature") ?? "");
    res.json({ received: true });
  } catch (cause) {
    req.log.warn({ err: cause }, "Stripe webhook rejected");
    const status = cause instanceof InvalidWebhookError ? 400 : 500;
    res.status(status).json({ error: { code: status === 400 ? "INVALID_WEBHOOK" : "WEBHOOK_PROCESSING_FAILED", message: status === 400 ? "Webhook could not be verified." : "Webhook processing failed; Stripe may retry." } });
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
