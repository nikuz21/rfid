import { Router, type IRouter } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  CreateUserBody,
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserParams,
  ListRecentUsersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    ...u,
    balance: Number(u.balance),
    gcashLoadedTotal: Number(u.gcashLoadedTotal),
  };
}

router.get("/users/recent", async (_req, res): Promise<void> => {
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(5);
  res.json(ListRecentUsersResponse.parse(users.map(formatUser)));
});

router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const search = params.success ? params.data.search : undefined;

  let query = db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  if (search) {
    const users = await db
      .select()
      .from(usersTable)
      .where(
        or(
          ilike(usersTable.fullName, `%${search}%`),
          ilike(usersTable.cardUid, `%${search}%`),
          ilike(usersTable.contactNumber, `%${search}%`),
        ),
      )
      .orderBy(desc(usersTable.createdAt));
    res.json(ListUsersResponse.parse(users.map(formatUser)));
    return;
  }

  const users = await query;
  res.json(ListUsersResponse.parse(users.map(formatUser)));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { cardUid, fullName, contactNumber, initialBalance, type } = parsed.data;

  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        cardUid: cardUid.trim(),
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim(),
        type: type || "Regular",
        balance: String(initialBalance),
        gcashLoadedTotal: "0",
        // Explicitly set this for Supabase tables that don't define a DB default.
        totalWallet: String(initialBalance),
        status: "Active",
      })
      .returning();

    res.status(201).json(GetUserResponse.parse(formatUser(user)));
  } catch (error) {
    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "Failed to register card";

    if (message.toLowerCase().includes("duplicate key")) {
      res.status(409).json({ error: "Card UID already exists" });
      return;
    }

    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to register card in database" });
  }
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(formatUser(user)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, any> = {};
  if (parsed.data.fullName !== undefined)
    updateData.fullName = parsed.data.fullName;
  if (parsed.data.contactNumber !== undefined)
    updateData.contactNumber = parsed.data.contactNumber;
  if (parsed.data.balance !== undefined)
    updateData.balance = String(parsed.data.balance);
  if (parsed.data.status !== undefined) 
    updateData.status = parsed.data.status;

  // Idinagdag para gumana rin ang pag-update ng type
  if (parsed.data.type !== undefined) 
    updateData.type = parsed.data.type;

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserResponse.parse(formatUser(user)));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;