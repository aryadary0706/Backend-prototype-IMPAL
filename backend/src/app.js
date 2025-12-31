import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes/router.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", router);

// Single-service deployment helper:
// Proxy all non-/api requests to the Next.js frontend running locally.
// Enable by setting ENABLE_FRONTEND_PROXY=true
const enableFrontendProxy = String(process.env.ENABLE_FRONTEND_PROXY || "").toLowerCase() === "true";
const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:3000";

if (enableFrontendProxy) {
	app.use(
		"/",
		createProxyMiddleware({
			target: frontendUrl,
			changeOrigin: true,
			ws: true,
			logLevel: "warn",
		})
	);
}

export default app;
