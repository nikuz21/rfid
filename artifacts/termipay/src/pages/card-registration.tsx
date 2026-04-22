import { useState } from "react";
import { useCreateUser, useListRecentUsers, getListRecentUsersQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CardRegistrationPage() {
  const [cardUid, setCardUid] = useState("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [type, setType] = useState("Regular");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentUsers, isLoading } = useListRecentUsers();

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecentUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setCardUid("");
        setFullName("");
        setContactNumber("");
        setInitialBalance("");
        setType("Regular");
        toast({ title: "Card registered successfully" });
      },
      onError: () => {
        toast({ title: "Failed to register card", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        cardUid,
        fullName,
        contactNumber,
        type,
        initialBalance: parseFloat(initialBalance) || 0,
      },
    });
  };

  return (
    <div className="space-y-6" data-testid="card-registration-page">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Card Registration</h2>
        <p className="text-sm text-muted-foreground mt-1">Register new RFID cards for transit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Register New Card
            </CardTitle>
            <CardDescription>Fill in cardholder details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardUid">Card UID</Label>
                <Input id="cardUid" placeholder="e.g. RFID-004" value={cardUid} onChange={(e) => setCardUid(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">User Type</Label>
                <Select value={type} onValueChange={setType}>
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
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input id="contactNumber" placeholder="09XX-XXX-XXXX" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialBalance">Initial Balance (PHP)</Label>
                <Input id="initialBalance" type="number" step="0.01" min="0" placeholder="0.00" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                <CreditCard className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "Registering..." : "Register Card"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recently Registered</CardTitle>
            <CardDescription>Last 5 registered cards</CardDescription>
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* FIX: Ginamit ang Array.isArray para siguradong hindi mag-crash ang .map */}
                    {Array.isArray(recentUsers) && recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-sm">{user.cardUid}</TableCell>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{user.type || 'Regular'}</Badge>
                          </TableCell>
                          <TableCell>{user.contactNumber}</TableCell>
                          <TableCell>P{Number(user.balance || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No cards registered yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}