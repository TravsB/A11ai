import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET ?? "development-secret";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in the environment before starting the API server.");
}

const COOKIE_NAME = "a11ai_token";

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  userName: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as jwt.JwtPayload & {
      id?: string;
      email?: string;
      name?: string;
    };
    const userId = payload.id ?? "";
    const userEmail = payload.email ?? "";
    const userName = payload.name ?? "";

    if (!userId || !userEmail || !userName) {
      res.status(401).json({ error: "Invalid or expired session." });
      return;
    }

    (req as AuthenticatedRequest).userId = userId;
    (req as AuthenticatedRequest).userEmail = userEmail;
    (req as AuthenticatedRequest).userName = userName;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
  }
}
