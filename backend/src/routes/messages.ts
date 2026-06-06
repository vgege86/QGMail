import { Router } from "express";
import { requireAuth } from "../middleware/auth-guard";
import { getGmailClient } from "../lib/oauth";
import "../lib/types";

const router = Router();
router.use(requireAuth);

function decodeBody(
  payload: {
    mimeType?: string | null;
    body?: { data?: string | null } | null;
    parts?: unknown[] | null;
  } | null | undefined
): { html: string | null; plain: string | null } {
  if (!payload) return { html: null, plain: null };

  let html: string | null = null;
  let plain: string | null = null;

  function walk(part: {
    mimeType?: string | null;
    body?: { data?: string | null } | null;
    parts?: unknown[] | null;
  }) {
    const mime = part.mimeType ?? "";
    const data = part.body?.data;
    if (data) {
      const text = Buffer.from(data, "base64url").toString("utf-8");
      if (mime === "text/html") html = text;
      else if (mime === "text/plain") plain = text;
    }
    if (part.parts) {
      for (const child of part.parts as typeof part[]) walk(child);
    }
  }

  walk(payload);
  return { html, plain };
}

// GET /api/messages — list messages
router.get("/", async (req, res) => {
  const gmail = getGmailClient(req.session.tokens!);
  const labelIds = (req.query.label as string) || "INBOX";
  const q = (req.query.q as string) || undefined;
  const pageToken = (req.query.pageToken as string) || undefined;
  const maxResults = 25;

  try {
    const list = await gmail.users.messages.list({
      userId: "me",
      labelIds: [labelIds],
      q,
      pageToken,
      maxResults,
    });

    const messageIds = list.data.messages ?? [];

    const messages = await Promise.all(
      messageIds.map(async ({ id }) => {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: id!,
          format: "metadata",
          metadataHeaders: ["From", "To", "Subject", "Date"],
        });
        const headers = msg.data.payload?.headers ?? [];
        const get = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value ?? "";
        return {
          id: msg.data.id,
          threadId: msg.data.threadId,
          labelIds: msg.data.labelIds ?? [],
          snippet: msg.data.snippet,
          from: get("From"),
          to: get("To"),
          subject: get("Subject"),
          date: get("Date"),
          unread: (msg.data.labelIds ?? []).includes("UNREAD"),
        };
      })
    );

    res.json({
      messages,
      nextPageToken: list.data.nextPageToken ?? null,
      resultSizeEstimate: list.data.resultSizeEstimate ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// GET /api/messages/:id — get full message
router.get("/:id", async (req, res) => {
  const gmail = getGmailClient(req.session.tokens!);
  try {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: req.params.id,
      format: "full",
    });

    const headers = msg.data.payload?.headers ?? [];
    const get = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value ?? "";

    const { html, plain } = decodeBody(msg.data.payload);

    const attachments = (function collectAttachments(
      part: {
        mimeType?: string | null;
        filename?: string | null;
        body?: { attachmentId?: string | null; size?: number | null } | null;
        parts?: unknown[] | null;
      } | null | undefined,
      acc: { id: string; filename: string; mimeType: string; size: number }[] = []
    ) {
      if (!part) return acc;
      if (part.filename && part.body?.attachmentId) {
        acc.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType ?? "application/octet-stream",
          size: part.body.size ?? 0,
        });
      }
      for (const child of (part.parts ?? []) as typeof part[]) {
        collectAttachments(child, acc);
      }
      return acc;
    })(msg.data.payload);

    res.json({
      id: msg.data.id,
      threadId: msg.data.threadId,
      labelIds: msg.data.labelIds ?? [],
      snippet: msg.data.snippet,
      from: get("From"),
      to: get("To"),
      cc: get("Cc"),
      subject: get("Subject"),
      date: get("Date"),
      unread: (msg.data.labelIds ?? []).includes("UNREAD"),
      html,
      plain,
      attachments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

// PATCH /api/messages/:id — modify labels (archive, mark read/unread, trash)
router.patch("/:id", async (req, res) => {
  const gmail = getGmailClient(req.session.tokens!);
  const { addLabelIds = [], removeLabelIds = [] } = req.body as {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  };
  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: req.params.id,
      requestBody: { addLabelIds, removeLabelIds },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to modify message" });
  }
});

// DELETE /api/messages/:id — move to trash
router.delete("/:id", async (req, res) => {
  const gmail = getGmailClient(req.session.tokens!);
  try {
    await gmail.users.messages.trash({ userId: "me", id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to trash message" });
  }
});

export default router;
