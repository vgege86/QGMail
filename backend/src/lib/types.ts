import { Credentials } from "google-auth-library";

declare module "express-session" {
  interface SessionData {
    tokens: Credentials;
    userEmail: string;
    userName: string;
    userPicture: string;
  }
}
