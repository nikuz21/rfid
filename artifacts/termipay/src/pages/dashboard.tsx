import {
  useGetDashboardStats,
  useGetRevenueTrend,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Fingerprint, CreditCard, Route } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchInterval: 15000,
    },
  });
  const { data: trend, isLoading: trendLoading } = useGetRevenueTrend({
    query: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchInterval: 15000,
    },
  });

  // FIX 1: Nilagyan ng ?. sa toFixed para hindi mag-error kung undefined ang stats
  const statCards = [
    {
      title: "Total Revenue Today",
      value: stats?.totalRevenueToday != null ? `P${stats.totalRevenueToday.toFixed(2)}` : "P0.00",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Total Taps Today",
      value: stats?.totalTapsToday ?? "0",
      icon: Fingerprint,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Registered Cards",
      value: stats?.registeredCards ?? "0",
      icon: CreditCard,
      color: "text-violet-600 bg-violet-50",
    },
    {
      title: "Active Routes",
      value: stats?.activeRoutes ?? "0",
      icon: Route,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.name || "Admin"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-5">
              {statsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {card.title}
                    </p>
                    <p
                      className="text-2xl font-bold text-foreground mt-1"
                      data-testid={`text-stat-${i}`}
                    >
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              {/* FIX 2: Sinigurado na Array ang data gamit ang fallback na [] */}
              <LineChart data={Array.isArray(trend) ? trend : []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => {
                    if (!d) return "";
                    const date = new Date(d + "T00:00:00");
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v: number) => `P${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [
                    `P${Number(value || 0).toFixed(2)}`,
                    "Revenue",
                  ]}
                  labelFormatter={(label: string) => {
                    if (!label) return "";
                    const date = new Date(label + "T00:00:00");
                    return date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}