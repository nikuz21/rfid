import { useGetReportSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Printer, TrendingUp, Calendar, Fingerprint, ShieldCheck } from "lucide-react";

export default function ReportsPage() {
  const { data: report, isLoading } = useGetReportSummary({
    query: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchInterval: 15000,
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const timestamp = new Date().toLocaleString("en-PH");

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* --- SCREEN ONLY HEADER --- */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">7-day revenue analytics and performance</p>
        </div>
        <Button onClick={handlePrint} variant="secondary" data-testid="button-print-pdf">
          <Printer className="w-4 h-4 mr-2" />
          Print PDF
        </Button>
      </div>

      {/* --- PRINT ONLY HEADER (Official Government/Audit Style) --- */}
      <div className="hidden print:flex flex-col items-center text-center border-b-2 border-black pb-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-8 h-8 text-black" />
          <span className="text-2xl font-black uppercase tracking-widest">Official Revenue Report</span>
        </div>
        <p className="text-xs font-mono uppercase">Republic of the Philippines • Audit Division</p>
        <div className="w-full flex justify-between mt-6 text-[10px] font-bold uppercase">
          <span>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          <span>Generated: {timestamp}</span>
        </div>
      </div>

      {/* --- SUMMARY SECTION --- */}
      {/* Note: print:grid-cols-3 forces the layout to stay horizontal on paper */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
        <Card className="shadow-sm print:shadow-none print:border-black">
          <CardContent className="p-5 print:p-3">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase print:text-black">7-Day Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1 print:text-xl" data-testid="text-total-revenue">
                    P{(report?.totalRevenue7Days ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 print:hidden">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm print:shadow-none print:border-black">
          <CardContent className="p-5 print:p-3">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase print:text-black">Avg Daily Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1 print:text-xl" data-testid="text-avg-revenue">
                    P{(report?.averageDailyRevenue ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 print:hidden">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm print:shadow-none print:border-black">
          <CardContent className="p-5 print:p-3">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase print:text-black">Total Taps</p>
                  <p className="text-2xl font-bold text-foreground mt-1 print:text-xl" data-testid="text-total-taps">
                    {report?.totalTaps7Days ?? 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-violet-600 bg-violet-50 print:hidden">
                  <Fingerprint className="w-5 h-5" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- CHART (HIDDEN ON PRINT) --- */}
      {/* We hide the chart on print to keep the report "Raw Data & Numbers" style as requested */}
      <Card className="shadow-sm print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Daily Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report?.dailyBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => {
                    const date = new Date(d + "T00:00:00");
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v: number) => `P${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(value: number) => [`P${value.toFixed(2)}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* --- DATA TABLE --- */}
      <Card className="shadow-sm print:shadow-none print:border-none">
        <CardHeader className="print:px-0">
          <CardTitle className="text-lg print:text-sm print:uppercase print:font-black">Detailed Transaction Log</CardTitle>
        </CardHeader>
        <CardContent className="print:px-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table className="print:border print:border-black">
              <TableHeader className="print:bg-gray-100">
                <TableRow className="print:border-b-2 print:border-black">
                  <TableHead className="print:text-black print:font-bold">Date</TableHead>
                  <TableHead className="print:text-black print:font-bold">Day</TableHead>
                  <TableHead className="text-right print:text-black print:font-bold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(report?.dailyBreakdown || []).map((day, i) => {
                  const date = new Date(day.date + "T00:00:00");
                  return (
                    <TableRow key={i} className="print:border-b print:border-gray-400">
                      <TableCell className="print:py-1">{date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</TableCell>
                      <TableCell className="print:py-1">{date.toLocaleDateString("en-US", { weekday: "long" })}</TableCell>
                      <TableCell className="text-right font-medium print:py-1">P{day.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* --- PRINT ONLY SIGNATURE FOOTER --- */}
      <div className="hidden print:grid grid-cols-2 gap-10 mt-16 text-center text-xs uppercase font-bold">
        <div>
          <div className="border-t border-black pt-2">Prepared By: System Administrator</div>
        </div>
        <div>
          <div className="border-t border-black pt-2">Verified By: Financial Auditor</div>
        </div>
      </div>
    </div>
  );
}