import type { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../lib/admin-token";

function getBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const adminUser = verifyAdminToken(token);
  if (!adminUser) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  (req as any).adminUser = adminUser;
  next();
}
