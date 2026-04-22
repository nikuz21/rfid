import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import { LoginBody, GetMeResponse } from "@workspace/api-zod";
import { createAdminToken, verifyAdminToken } from "../lib/admin-token";
import { signInSupabaseWithPassword } from "../lib/supabase";

const router: IRouter = Router();

function getBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

// --- LOGIN ROUTE ---
router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.username, parsed.data.username))
      .limit(1);

    const { username, password } = parsed.data;
    const looksLikeEmail = username.includes("@");
    const supabaseUser = looksLikeEmail ? await signInSupabaseWithPassword(username, password) : null;
    const isLegacyAdminValid = !!admin && admin.password_hash === password;

    if (!supabaseUser && !isLegacyAdminValid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const normalizedUsername = admin?.username ?? supabaseUser?.email ?? username;
    const displayName =
      admin?.full_name ||
      (typeof supabaseUser.user_metadata?.full_name === "string" ? supabaseUser.user_metadata.full_name : null) ||
      normalizedUsername;

    res.json({
      success: true,
      message: "Login successful",
      username: admin?.username ?? normalizedUsername,
      name: displayName,
      token: createAdminToken({ username: admin?.username ?? normalizedUsername, name: displayName }),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- UPDATE PROFILE ROUTE ---
router.post("/auth/update-profile", async (req, res): Promise<void> => {
  try {
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

    const body = req.body as {
      name?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const currentPassword =
      typeof body?.currentPassword === "string" ? body.currentPassword.trim() : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.username, adminUser.username))
      .limit(1);

    if (!admin) {
      res.status(404).json({ error: "Admin account not found" });
      return;
    }

    if (newPassword && !currentPassword) {
      res.status(400).json({ error: "Current password is required" });
      return;
    }

    if (newPassword && admin.password_hash !== currentPassword) {
      res.status(401).json({ error: "Invalid current password" });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    const nextFullName = name || admin.full_name;
    const nextPasswordHash = newPassword || admin.password_hash;

    await db
      .update(adminsTable)
      .set({
        full_name: nextFullName,
        password_hash: nextPasswordHash,
      })
      .where(eq(adminsTable.id, admin.id));

    res.json({
      success: true,
      message: "Profile updated successfully",
      username: admin.username,
      name: nextFullName,
      token: createAdminToken({ username: admin.username, name: nextFullName }),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- LOGOUT ROUTE ---
router.post("/auth/logout", (req, res): void => {
  res.status(200).json({ success: true });
});

// --- GET ME ROUTE ---
router.get("/auth/me", async (req, res): Promise<void> => {
  try {
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

    const validatedUser = GetMeResponse.parse({
      username: adminUser.username,
      name: adminUser.name,
    });
    res.json(validatedUser);
  } catch (e) {
    console.error("Auth state error:", e);
    res.status(401).json({ error: "Invalid auth state" });
  }
});

export default router;