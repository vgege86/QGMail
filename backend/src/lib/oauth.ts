import { OAuth2Client } from "google-auth-library";
import { Credentials } from "google-auth-library";
import { google } from "googleapis";

export function createOAuth2Client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGmailClient(tokens: Credentials) {
  const auth = createOAuth2Client();
  auth.setCredentials(tokens);
  return google.gmail({ version: "v1", auth });
}

export const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];
