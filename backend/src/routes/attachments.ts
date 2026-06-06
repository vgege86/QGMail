import { Router } from "express";
import { requireAuth } from "../middleware/auth-guard";
import { getGmailClient } from "../lib/oauth";
import "../lib/types";

const router = Router();
router.use(requireAuth);

// GET /api/attachments/:messageId/:attachmentId
router.get("/:messageId/:attachmentId", async (req, res) => {
  const gmail = getGmailClient(req.session.tokens!);
  const { messageId, attachmentId } = req.params;
  const filename = (req.query.filename as string) ?? "attachment";
  const mimeType = (req.query.mimeType as string) ?? "application/octet-stream";

  try {
    const { data } = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });

    const buffer = Buffer.from(data.data ?? "", "base64url");
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attachment" });
  }
});

export default router;
