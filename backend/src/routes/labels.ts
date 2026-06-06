import { Router } from "express";
import { requireAuth } from "../middleware/auth-guard";
import { getGmailClient } from "../lib/oauth";
import "../lib/types";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const gmail = getGmailClient(req.session.tokens!);
  try {
    const { data } = await gmail.users.labels.list({ userId: "me" });
    res.json(data.labels ?? []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch labels" });
  }
});

export default router;
