import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Users,
  Map,
  FileBarChart,
  LogOut,
  Menu,
  X,
  User,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

function normalizeApiBaseUrl(rawUrl?: string | null): string {
  const trimmed = (rawUrl || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/card-registration", label: "Card Registration", icon: CreditCard },
  { path: "/transactions", label: "Transaction Logs", icon: ArrowLeftRight },
  { path: "/users", label: "User Management", icon: Users },
  { path: "/fare-matrix", label: "Fare Matrix", icon: Map },
  { path: "/reports", label: "Reports", icon: FileBarChart },
];

function CurrentDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="text-sm text-muted-foreground" data-testid="text-datetime">
      {now.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })}{" "}
      {now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoggingOut, refetchUser } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Logic States
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    currentPassword: "",
    newPassword: "",
  });

  // I-reset ang form pag binuksan ang modal
  useEffect(() => {
    if (profileModalOpen) {
      setFormData({
        name: user?.name || "",
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [profileModalOpen, user]);

  const handleSaveChanges = async () => {
    // 1. Client-side validation
    if (formData.newPassword && !formData.currentPassword) {
      toast({
        title: "Security Check",
        description: "Pakilagay ang iyong 'Current Password' para payagan ang pagpalit.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const supabaseSession = sessionData.session;

      // Supabase-first profile update path
      if (supabaseSession?.user) {
        if (formData.newPassword && !supabaseSession.user.email) {
          throw new Error("Cannot update password for this account");
        }

        if (
          formData.newPassword &&
          supabaseSession.user.email &&
          formData.currentPassword
        ) {
          const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: supabaseSession.user.email,
            password: formData.currentPassword,
          });
          if (verifyError) {
            throw new Error("Invalid current password");
          }
        }

        const payload: { data?: { full_name: string; name: string }; password?: string } = {};
        if (formData.name && formData.name.trim() !== "") {
          payload.data = {
            full_name: formData.name.trim(),
            name: formData.name.trim(),
          };
        }
        if (formData.newPassword && formData.newPassword.trim() !== "") {
          payload.password = formData.newPassword.trim();
        }

        const { error: updateError } = await supabase.auth.updateUser(payload);
        if (updateError) {
          throw new Error(updateError.message);
        }

        await refetchUser();
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
        setProfileModalOpen(false);
        setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
        return;
      }

      // Legacy fallback path for session/admin-table users.
      const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || null);
      const endpoint = `${apiBaseUrl}/api/auth/update-profile`;
      const token = window.localStorage.getItem("termipay_auth_token");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      // 3. I-handle ang error galing sa backend (e.g. "Mali ang current password")
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

      const newToken = typeof data?.token === "string" ? data.token : null;
      if (newToken) {
        window.localStorage.setItem("termipay_auth_token", newToken);
      }

      await refetchUser();
      setProfileModalOpen(false);
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        data-testid="sidebar"
      >
        <div className="flex items-center gap-3 p-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">
              Fare Collection System
            </h1>
            <p className="text-xs text-muted-foreground">Admin Console</p>
          </div>
        </div>

        <nav className="p-3 space-y-1" data-testid="nav-sidebar">
          {navItems.map((item) => {
            const isActive =
              location === item.path ||
              (item.path !== "/" && location.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer
                    transition-colors duration-150
                    ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                  data-testid={`link-nav-${item.path.replace("/", "") || "dashboard"}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-menu"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <CurrentDateTime />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p
                className="text-sm font-medium text-foreground"
                data-testid="text-admin-name"
              >
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>

            <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
              <DialogTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm uppercase cursor-pointer hover:bg-primary/20 transition-colors">
                  {user?.name ? user.name.trim().charAt(0) : "A"}
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Admin Profile Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                      <User className="w-4 h-4" /> Personal Information
                    </h4>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium leading-none flex items-center gap-2 text-primary">
                      <Lock className="w-4 h-4" /> Change Password
                    </h4>
                    <div className="grid gap-2">
                      <Label htmlFor="current-password" title="Required to verify identity">
                        Current Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        placeholder="Enter current password (e.g. qwerty123)"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setProfileModalOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" onClick={logout} disabled={isLoggingOut}>
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}