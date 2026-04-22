import { Router, type IRouter } from "express";
import { sql, eq, gte, and } from "drizzle-orm";
import { db, transactionsTable, usersTable, fareRoutesTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRevenueTrendResponse,
  GetReportSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const APP_TIME_ZONE = "Asia/Manila";

function getTodayInAppTz(): { year: number; month: number; day: number; dateStr: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { year, month, day, dateStr };
}

function getLast7DatesInAppTz(): string[] {
  const { year, month, day } = getTodayInAppTz();
  const baseUtc = new Date(Date.UTC(year, month - 1, day));

  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseUtc);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  return dates;
}

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const { dateStr: todayDate } = getTodayInAppTz();

  // Calculate total revenue today (only from Success Fares)
  const [revenueResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${transactionsTable.amount}), 0)`,
    })
    .from(transactionsTable)
    .where(
      and(
        sql`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') = ${todayDate}`,
        eq(transactionsTable.type, "Fare"),
        eq(transactionsTable.status, "Success")
      )
    );

  // Calculate total taps today (only from Fare transactions)
  const [tapsResult] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(transactionsTable)
    .where(
      and(
        sql`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD') = ${todayDate}`,
        eq(transactionsTable.type, "Fare")
      )
    );

  const [cardsResult] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(usersTable);

  const [routesResult] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(fareRoutesTable)
    .where(eq(fareRoutesTable.isActive, true));

  res.json(
    GetDashboardStatsResponse.parse({
      totalRevenueToday: Number(revenueResult.total),
      totalTapsToday: tapsResult.count,
      registeredCards: cardsResult.count,
      activeRoutes: routesResult.count,
    })
  );
});

router.get("/dashboard/revenue-trend", async (_req, res): Promise<void> => {
  const dateSeries = getLast7DatesInAppTz();
  const sevenDaysAgo = new Date(`${dateSeries[0]}T00:00:00`);

  const rows = await db
    .select({
      date: sql<string>`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`,
      revenue: sql<string>`COALESCE(SUM(${transactionsTable.amount}), 0)`,
    })
    .from(transactionsTable)
    .where(
      and(
        gte(transactionsTable.timestamp, sevenDaysAgo),
        eq(transactionsTable.type, "Fare"),
        eq(transactionsTable.status, "Success")
      )
    )
    .groupBy(sql`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`);

  const result: { date: string; revenue: number }[] = [];
  for (const dateStr of dateSeries) {
    const found = rows.find((r) => r.date === dateStr);
    result.push({
      date: dateStr,
      revenue: found ? Number(found.revenue) : 0,
    });
  }

  res.json(GetRevenueTrendResponse.parse(result));
});

router.get("/reports/summary", async (_req, res): Promise<void> => {
  const dateSeries = getLast7DatesInAppTz();
  const sevenDaysAgo = new Date(`${dateSeries[0]}T00:00:00`);

  const rows = await db
    .select({
      date: sql<string>`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`,
      revenue: sql<string>`COALESCE(SUM(${transactionsTable.amount}), 0)`,
    })
    .from(transactionsTable)
    .where(
      and(
        gte(transactionsTable.timestamp, sevenDaysAgo),
        eq(transactionsTable.type, "Fare"),
        eq(transactionsTable.status, "Success")
      )
    )
    .groupBy(sql`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${transactionsTable.timestamp} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`);

  const dailyBreakdown: { date: string; revenue: number }[] = [];
  for (const dateStr of dateSeries) {
    const found = rows.find((r) => r.date === dateStr);
    dailyBreakdown.push({
      date: dateStr,
      revenue: found ? Number(found.revenue) : 0,
    });
  }

  const totalRevenue7Days = dailyBreakdown.reduce((sum, d) => sum + d.revenue, 0);
  const averageDailyRevenue = totalRevenue7Days / 7;

  // Calculate total taps for 7 days (only from Fare transactions)
  const [tapsResult] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(transactionsTable)
    .where(
      and(
        gte(transactionsTable.timestamp, sevenDaysAgo),
        eq(transactionsTable.type, "Fare")
      )
    );

  res.json(
    GetReportSummaryResponse.parse({
      totalRevenue7Days,
      averageDailyRevenue: Math.round(averageDailyRevenue * 100) / 100,
      totalTaps7Days: tapsResult.count,
      dailyBreakdown,
    })
  );
});

export default router;
