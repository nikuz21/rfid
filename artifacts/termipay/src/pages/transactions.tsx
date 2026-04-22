import { useState } from "react";
import {
  useListTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
  getListTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Pencil, Trash2, AlertCircle } from "lucide-react";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editTx, setEditTx] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    type: "",
    amount: "",
    status: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params: any = {};
  if (search) params.search = search;
  if (typeFilter && typeFilter !== "all") params.type = typeFilter;
  if (statusFilter && statusFilter !== "all") params.status = statusFilter;

  const { data: transactions, isLoading } = useListTransactions(params);
  const transactionList = Array.isArray(transactions) ? transactions : [];

  const updateMutation = useUpdateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListTransactionsQueryKey(),
        });
        setEditTx(null);
        toast({ title: "Transaction updated successfully" });
      },
    },
  });

  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListTransactionsQueryKey(),
        });
        toast({ title: "Transaction deleted", variant: "destructive" });
      },
    },
  });

  const openEdit = (tx: any) => {
    setEditTx(tx);
    setEditForm({
      type: tx.type,
      // Ginagawang positive ang display sa edit form kahit ano pa ang nasa DB
      amount: String(Math.abs(Number(tx.amount))), 
      status: tx.status,
    });
  };

  const handleUpdate = () => {
    if (!editTx) return;

    const amountVal = parseFloat(editForm.amount);

    /**
     * REAL-WORLD LOGIC FIX:
     * Hindi na tayo gagamit ng negative sign (-).
     * Gagamit tayo ng Math.abs() para laging positive ang amount na ise-save.
     * Ang SQL Trigger na ang bahala mag-deduct kung ang type ay "Fare".
     */
    const cleanAmount = Math.abs(amountVal);

    updateMutation.mutate({
      id: editTx.id,
      data: {
        type: editForm.type,
        amount: cleanAmount, // Laging positive
        status: editForm.status,
      },
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Success": return "default";
      case "Failed": return "destructive";
      case "Pending": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Transaction Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor all Fare deductions and Top-ups</p>
        </div>
      </div>

      <Card className="shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-none pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search card UID or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Fare">Fare</SelectItem>
                  <SelectItem value="Top-up">Top-up</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-0 px-6 pb-6">
          {isLoading ? (
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border relative">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>Card UID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                        No transaction records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactionList.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp || tx.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{tx.card_uid || tx.cardUid}</TableCell>
                        <TableCell className="font-medium">{tx.full_name || tx.fullName}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === "Fare" ? "outline" : "default"} className={tx.type === "Fare" ? "border-red-200 text-red-700 bg-red-50" : ""}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        {/* Display Logic: Nilalagyan lang ng symbol sa UI pero positive ang number */}
                        <TableCell className={`font-bold ${tx.type === "Fare" ? "text-red-600" : "text-green-600"}`}>
                          {tx.type === "Fare" ? "-" : "+"}₱{Math.abs(Number(tx.amount)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColor(tx.status) as any}>{tx.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(tx)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Delete this log? (This won't refund the user automatically)")) 
                                  deleteMutation.mutate({ id: tx.id });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Transaction Details</DialogTitle>
          </DialogHeader>

          <div className="bg-amber-50 p-3 rounded-md flex gap-3 items-start mb-2 border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>Data Note:</strong> Ang system ay gumagamit ng positive values. Ang <b>Fare</b> ay awtomatikong ibabawas sa wallet ng user sa database.
            </p>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fare">Fare (Deduction)</SelectItem>
                  <SelectItem value="Top-up">Top-up (Addition)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₱)</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTx(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}