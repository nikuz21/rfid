import { useState } from "react";
import {
  useListRoutes,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  useToggleRoute,
  getListRoutesQueryKey,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Power,
  PowerOff,
  ArrowLeftRight,
  Wifi,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const CALBAYOG_BARANGAYS = [
  "Bugtong",
  "Tinaplacan",
  "Malaga",
  "Cag-Manipis",
  "Malayog",
  "Peña",
  "Cag-Olango",
  "Cagnipa",
  "San Joaquin",
  "Baay",
  "Binaliw",
  "Manginoo",
  "Bantian",
  "Marcatubig",
  "Malajog",
  "Malopalo",
  "Tinambacan",
  "Amampacang",
  "Lonoy",
  "Sabang",
  "Talahid",
];

const DEFAULT_DESTINATION = "Calbayog";

export default function FareMatrixPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    origin: "",
    destination: DEFAULT_DESTINATION,
    fareAmount: "",
    viceVersa: true,
  });
  const [editRoute, setEditRoute] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    origin: "",
    destination: "",
    fareAmount: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes, isLoading } = useListRoutes();

  // FIXED: Safety check for array to prevent ".find is not a function" error
  const activeRoute = Array.isArray(routes) 
    ? routes.find((r) => r.isActive) ?? null 
    : null;

  const createMutation = useCreateRoute({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoutesQueryKey() });
      },
    },
  });

  const updateMutation = useUpdateRoute({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoutesQueryKey() });
        setEditRoute(null);
        toast({ title: "Route updated" });
      },
    },
  });

  const deleteMutation = useDeleteRoute({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoutesQueryKey() });
        toast({ title: "Route deleted" });
      },
    },
  });

  const toggleMutation = useToggleRoute({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoutesQueryKey() });
        toast({ title: "Route status updated" });
      },
    },
  });

  const openEdit = (route: any) => {
    setEditRoute(route);
    setEditForm({
      origin: route.origin,
      destination: route.destination,
      fareAmount: String(route.fareAmount),
    });
  };

  const handleAdd = async () => {
    const fare = parseFloat(addForm.fareAmount) || 0;
    if (!addForm.origin || !addForm.destination || fare <= 0) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        data: {
          origin: addForm.origin,
          destination: addForm.destination,
          fareAmount: fare,
        },
      });

      if (addForm.viceVersa) {
        await createMutation.mutateAsync({
          data: {
            origin: addForm.destination,
            destination: addForm.origin,
            fareAmount: fare,
          },
        });
      }

      setShowAdd(false);
      setAddForm({
        origin: "",
        destination: DEFAULT_DESTINATION,
        fareAmount: "",
        viceVersa: true,
      });
      toast({
        title: addForm.viceVersa
          ? "Routes added (both directions)"
          : "Route added",
      });
    } catch (error) {
      toast({ title: "Failed to add route", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6" data-testid="fare-matrix-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Fare Matrix
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage transit routes and fares for RFID tap deduction
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-route">
          <Plus className="w-4 h-4 mr-2" />
          Add Route
        </Button>
      </div>

      <div
        className={`rounded-xl border-2 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          activeRoute
            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
            : "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              activeRoute
                ? "bg-green-100 dark:bg-green-900/40"
                : "bg-yellow-100 dark:bg-yellow-900/40"
            }`}
          >
            {activeRoute ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div>
            <p
              className={`font-semibold text-sm ${
                activeRoute
                  ? "text-green-800 dark:text-green-300"
                  : "text-yellow-800 dark:text-yellow-300"
              }`}
            >
              {activeRoute ? "Active Route — RFID Ready" : "No Active Route"}
            </p>
            {activeRoute ? (
              <p className="text-green-700 dark:text-green-400 font-bold text-lg">
                {activeRoute.origin} → {activeRoute.destination} &nbsp;·&nbsp; ₱
                {activeRoute.fareAmount.toFixed(2)} per tap
              </p>
            ) : (
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Activate a route below so the ESP32 RFID reader can process fare
                deductions.
              </p>
            )}
          </div>
        </div>

        {activeRoute && (
          <div className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-2 font-mono">
            <div className="flex items-center gap-1 font-semibold text-green-800 dark:text-green-300 mb-1">
              <Wifi className="w-3.5 h-3.5" />
              ESP32 Endpoint
            </div>
            <span>POST /api/scan-rfid</span>
            <span className="text-green-600">{'{ "cardUid": "<uid>" }'}</span>
          </div>
        )}
      </div>

      <Card className="border-dashed shadow-none bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex gap-2 items-start">
              <span className="text-primary font-bold text-lg leading-none">
                1
              </span>
              <div>
                <p className="font-semibold">Card Tap</p>
                <p className="text-muted-foreground text-xs">
                  ESP32 sends Card UID to{" "}
                  <code className="bg-muted px-1 rounded">/api/scan-rfid</code>
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-primary font-bold text-lg leading-none">
                2
              </span>
              <div>
                <p className="font-semibold">Balance Check</p>
                <p className="text-muted-foreground text-xs">
                  Total Wallet = Card Balance + GCash Balance ≥ current fare
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-primary font-bold text-lg leading-none">
                3
              </span>
              <div>
                <p className="font-semibold">Deduction</p>
                <p className="text-muted-foreground text-xs">
                  Deducts from Card Balance first, then GCash. Saves history.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Configured Routes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Only <strong>one route</strong> can be active at a time. Activating
            a route deactivates all others.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Origin</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Fare Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!Array.isArray(routes) || routes.length === 0) ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No routes configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => (
                      <TableRow
                        key={route.id}
                        data-testid={`row-route-${route.id}`}
                        className={
                          route.isActive
                            ? "bg-green-50/50 dark:bg-green-950/10"
                            : "opacity-60"
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {route.origin}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs px-1">
                          →
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {route.destination}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold ${
                              route.isActive
                                ? "text-green-700 dark:text-green-400 text-base"
                                : ""
                            }`}
                          >
                            ₱{route.fareAmount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={route.isActive ? "default" : "secondary"}
                            className={route.isActive ? "bg-green-600" : ""}
                          >
                            {route.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={route.isActive ? "destructive" : "default"}
                            className={
                              route.isActive
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }
                            onClick={() =>
                              toggleMutation.mutate({ id: route.id })
                            }
                            disabled={toggleMutation.isPending}
                            data-testid={`toggle-route-${route.id}`}
                          >
                            {route.isActive ? (
                              <>
                                <PowerOff className="w-3.5 h-3.5 mr-1" />{" "}
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-3.5 h-3.5 mr-1" /> Activate
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(route)}
                              data-testid={`button-edit-route-${route.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() =>
                                deleteMutation.mutate({ id: route.id })
                              }
                              data-testid={`button-delete-route-${route.id}`}
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

      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          setShowAdd(open);
          if (!open)
            setAddForm({
              origin: "",
              destination: DEFAULT_DESTINATION,
              fareAmount: "",
              viceVersa: true,
            });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Origin (Barangay)</Label>
              <Select
                value={addForm.origin}
                onValueChange={(v) => setAddForm({ ...addForm, origin: v })}
              >
                <SelectTrigger data-testid="input-add-origin">
                  <SelectValue placeholder="Select barangay..." />
                </SelectTrigger>
                <SelectContent className="max-h-[280px] overflow-y-auto">
                  <SelectItem value={DEFAULT_DESTINATION}>
                    {DEFAULT_DESTINATION} (City Center)
                  </SelectItem>
                  {CALBAYOG_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destination</Label>
              <Select
                value={addForm.destination}
                onValueChange={(v) =>
                  setAddForm({ ...addForm, destination: v })
                }
              >
                <SelectTrigger data-testid="input-add-destination">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px] overflow-y-auto">
                  <SelectItem value={DEFAULT_DESTINATION}>
                    {DEFAULT_DESTINATION} (City Center)
                  </SelectItem>
                  {CALBAYOG_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fare Amount (PHP)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={addForm.fareAmount}
                onChange={(e) =>
                  setAddForm({ ...addForm, fareAmount: e.target.value })
                }
                data-testid="input-add-fare"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Checkbox
                id="vice-versa"
                checked={addForm.viceVersa}
                onCheckedChange={(v) =>
                  setAddForm({ ...addForm, viceVersa: !!v })
                }
              />
              <div>
                <Label
                  htmlFor="vice-versa"
                  className="font-medium cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Add vice versa route
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Also creates the reverse direction at the same fare
                </p>
              </div>
            </div>

            {addForm.origin && addForm.destination && (
              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-1">
                <p className="font-medium text-blue-700 dark:text-blue-400">
                  Routes to be created:
                </p>
                <p>
                  • {addForm.origin} → {addForm.destination} @ ₱
                  {addForm.fareAmount || "0.00"}
                </p>
                {addForm.viceVersa && (
                  <p>
                    • {addForm.destination} → {addForm.origin} @ ₱
                    {addForm.fareAmount || "0.00"}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={createMutation.isPending}
              data-testid="button-save-route"
            >
              {createMutation.isPending ? "Adding..." : "Add Route"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editRoute}
        onOpenChange={(open) => !open && setEditRoute(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Select
                value={editForm.origin}
                onValueChange={(v) => setEditForm({ ...editForm, origin: v })}
              >
                <SelectTrigger data-testid="input-edit-origin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px] overflow-y-auto">
                  <SelectItem value={DEFAULT_DESTINATION}>
                    {DEFAULT_DESTINATION} (City Center)
                  </SelectItem>
                  {CALBAYOG_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select
                value={editForm.destination}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, destination: v })
                }
              >
                <SelectTrigger data-testid="input-edit-destination">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px] overflow-y-auto">
                  <SelectItem value={DEFAULT_DESTINATION}>
                    {DEFAULT_DESTINATION} (City Center)
                  </SelectItem>
                  {CALBAYOG_BARANGAYS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fare Amount (PHP)</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.fareAmount}
                onChange={(e) =>
                  setEditForm({ ...editForm, fareAmount: e.target.value })
                }
                data-testid="input-edit-fare"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditRoute(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateMutation.mutate({
                  id: editRoute.id,
                  data: {
                    origin: editForm.origin,
                    destination: editForm.destination,
                    fareAmount: parseFloat(editForm.fareAmount) || 0,
                  },
                })
              }
              disabled={updateMutation.isPending}
              data-testid="button-update-route"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}