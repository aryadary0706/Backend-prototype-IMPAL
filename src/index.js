import express from "express";
import cors from "cors";
import "dotenv/config";
import router from "./routes/router.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

// ---------------- START SERVER ----------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
