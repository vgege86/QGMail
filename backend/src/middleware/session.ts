import session from "express-session";
import FileStoreFactory from "session-file-store";

const FileStore = FileStoreFactory(session);

export const sessionMiddleware = session({
  store: new FileStore({
    path: "./sessions",
    retries: 1,
    logFn: () => {},
  }),
  secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
