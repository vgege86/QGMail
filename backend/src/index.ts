import express from "express";
import path from "path";
import { sessionMiddleware } from "./middleware/session";
import authRouter from "./routes/auth";
import messagesRouter from "./routes/messages";
import labelsRouter from "./routes/labels";
import sendRouter from "./routes/send";
import attachmentsRouter from "./routes/attachments";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.use(express.json());
app.use(sessionMiddleware);

app.use("/auth", authRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/labels", labelsRouter);
app.use("/api/send", sendRouter);
app.use("/api/attachments", attachmentsRouter);

// Serve React frontend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`QGMail running on http://0.0.0.0:${PORT}`);
});
