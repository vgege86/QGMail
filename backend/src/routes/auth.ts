import { Router } from "express";
import { createOAuth2Client, SCOPES } from "../lib/oauth";
import "../lib/types";

const router = Router();

router.get("/login", (_req, res) => {
  const client = createOAuth2Client();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    res.redirect("/?error=auth_denied");
    return;
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const oauth2 = (await import("googleapis")).google.oauth2({
      version: "v2",
      auth: client,
    });
    const { data } = await oauth2.userinfo.get();

    req.session.tokens = tokens;
    req.session.userEmail = data.email ?? "";
    req.session.userName = data.name ?? "";
    req.session.userPicture = data.picture ?? "";

    res.redirect("/");
  } catch {
    res.redirect("/?error=auth_failed");
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.tokens) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    email: req.session.userEmail,
    name: req.session.userName,
    picture: req.session.userPicture,
  });
});

export default router;
