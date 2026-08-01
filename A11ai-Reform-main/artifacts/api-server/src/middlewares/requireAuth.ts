import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
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
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
    };
    (req as AuthenticatedRequest).userId = payload.id;
    (req as AuthenticatedRequest).userEmail = payload.email;
    (req as AuthenticatedRequest).userName = payload.name;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
  }
}
