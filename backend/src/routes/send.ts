import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth-guard";
import { getGmailClient } from "../lib/oauth";
import "../lib/types";

const router = Router();
router.use(requireAuth);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

function buildMimeMessage(params: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  isHtml: boolean;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  files: Express.Multer.File[];
}): string {
  const boundary = `boundary_${Date.now()}`;
  const { to, cc, subject, body, isHtml, inReplyTo, references, files } = params;

  const headers = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : "",
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : "",
    references ? `References: ${references}` : "",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ]
    .filter(Boolean)
    .join("\r\n");

  const bodyPart = [
    `--${boundary}`,
    `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    "",
    body,
  ].join("\r\n");

  const attachmentParts = files.map((f) => {
    const b64 = f.buffer.toString("base64");
    return [
      `--${boundary}`,
      `Content-Type: ${f.mimetype}; name="${f.originalname}"`,
      `Content-Disposition: attachment; filename="${f.originalname}"`,
      `Content-Transfer-Encoding: base64`,
      "",
      b64.match(/.{1,76}/g)!.join("\r\n"),
    ].join("\r\n");
  });

  const raw = [headers, "", bodyPart, ...attachmentParts, `--${boundary}--`].join("\r\n");
  return Buffer.from(raw).toString("base64url");
}

router.post("/", upload.array("attachments"), async (req, res) => {
  const gmail = getGmailClient(req.session.tokens!);
  const { to, cc, subject, body, isHtml, threadId, inReplyTo, references } = req.body as {
    to: string;
    cc?: string;
    subject: string;
    body: string;
    isHtml?: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
  };

  const files = (req.files as Express.Multer.File[]) ?? [];

  const raw = buildMimeMessage({
    to,
    cc,
    subject,
    body,
    isHtml: isHtml === "true",
    threadId,
    inReplyTo,
    references,
    files,
  });

  try {
    const sent = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw, threadId },
    });
    res.json({ id: sent.data.id, threadId: sent.data.threadId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
