import { useState } from "react";
import {
  useListUsers,
  useUpdateUser,
  useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Pencil, Trash2, Wallet } from "lucide-react";

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: "", contactNumber: "", balance: "", status: "", type: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListUsers(search ? { search } : undefined);

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setEditUser(null);
        toast({ title: "User updated" });
      },
    },
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User deleted" });
      },
    },
  });

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName,
      contactNumber: user.contactNumber,
      balance: String(user.balance),
      status: user.status,
      type: user.type || "Regular",
    });
  };

  const handleUpdate = () => {
    if (!editUser) return;
    updateMutation.mutate({
      id: editUser.id,
      data: {
        fullName: editForm.fullName,
        contactNumber: editForm.contactNumber,
        balance: parseFloat(editForm.balance),
        status: editForm.status,
        type: editForm.type,
      },
    });
  };

  return (
    <div className="space-y-6" data-testid="users-page">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage registered cardholders and balances</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-lg">Registered Cardholders</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card UID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>GCash Total</TableHead>
                    <TableHead className="font-semibold text-primary">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        Total Wallet
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* FIX: Ginamit ang Array.isArray check bago ang .map */}
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((user) => {
                      const totalWallet = (user.balance || 0) + (user.gcashLoadedTotal || 0);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-sm">{user.cardUid}</TableCell>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize border-primary/20 bg-primary/5">
                              {user.type || "Regular"}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.contactNumber}</TableCell>
                          <TableCell className="font-medium">₱{(user.balance || 0).toFixed(2)}</TableCell>
                          <TableCell>₱{(user.gcashLoadedTotal || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-sm">
                              <Wallet className="w-3 h-3" />
                              ₱{totalWallet.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate({ id: user.id })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>User Type</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="PWD">PWD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input value={editForm.contactNumber} onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Balance (PHP)</Label>
              <Input type="number" step="0.01" value={editForm.balance} onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}