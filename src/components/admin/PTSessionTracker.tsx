import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Package, Plus, CalendarIcon, FileText, ExternalLink, DollarSign,
  CheckCircle2, Clock, AlertTriangle, Trash2, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PTReportGenerator } from "./PTReportGenerator";
import { useIsMobile } from "@/hooks/use-mobile";

interface PTSessionTrackerProps {
  clientUserId: string;
  clientDisplayName: string;
}

type PTPackage = {
  id: string;
  coach_id: string;
  client_user_id: string;
  sessions_purchased: number;
  sessions_used: number;
  package_name: string;
  purchase_date: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type PTSession = {
  id: string;
  package_id: string;
  client_user_id: string;
  session_date: string;
  workout_id: string | null;
  notes: string | null;
  created_at: string;
};

type PTInvoice = {
  id: string;
  package_id: string | null;
  client_user_id: string;
  invoice_url: string;
  amount: number;
  currency: string;
  status: string;
  invoice_date: string;
  notes: string | null;
  created_at: string;
};

export function PTSessionTracker({ clientUserId, clientDisplayName }: PTSessionTrackerProps) {
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<PTPackage[]>([]);
  const [sessions, setSessions] = useState<PTSession[]>([]);
  const [invoices, setInvoices] = useState<PTInvoice[]>([]);
  const [workouts, setWorkouts] = useState<{ id: string; workout_name: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [newPkgOpen, setNewPkgOpen] = useState(false);
  const [logSessionOpen, setLogSessionOpen] = useState(false);
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editSessionOpen, setEditSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PTSession | null>(null);

  // Edit session form
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editWorkoutId, setEditWorkoutId] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // New package form
  const [pkgName, setPkgName] = useState("");
  const [pkgSessions, setPkgSessions] = useState("10");
  const [pkgDate, setPkgDate] = useState<Date>(new Date());
  const [pkgNotes, setPkgNotes] = useState("");

  // Log session form
  const [sessionDate, setSessionDate] = useState<Date>(new Date());
  const [sessionWorkoutId, setSessionWorkoutId] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionPkgId, setSessionPkgId] = useState("");

  // Invoice form
  const [invUrl, setInvUrl] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invStatus, setInvStatus] = useState("pending");
  const [invDate, setInvDate] = useState<Date>(new Date());
  const [invPkgId, setInvPkgId] = useState("");
  const [invNotes, setInvNotes] = useState("");
  const [invCurrency, setInvCurrency] = useState("AUD");

  const activePackage = packages.find(p => p.status === "active");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pkgRes, sessRes, invRes, wkRes] = await Promise.all([
      supabase.from("pt_packages").select("*").eq("client_user_id", clientUserId).order("created_at", { ascending: false }),
      supabase.from("pt_sessions").select("*").eq("client_user_id", clientUserId).order("session_date", { ascending: false }),
      supabase.from("pt_invoices").select("*").eq("client_user_id", clientUserId).order("invoice_date", { ascending: false }),
      supabase.from("workouts").select("id, workout_name, date").eq("user_id", clientUserId).order("date", { ascending: false }).limit(50),
    ]);
    if (pkgRes.data) setPackages(pkgRes.data as PTPackage[]);
    if (sessRes.data) setSessions(sessRes.data as PTSession[]);
    if (invRes.data) setInvoices(invRes.data as PTInvoice[]);
    if (wkRes.data) setWorkouts(wkRes.data);
    setLoading(false);
  }, [clientUserId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreatePackage = async () => {
    if (!user || !pkgName.trim()) return;
    const { error } = await supabase.from("pt_packages").insert({
      coach_id: user.id,
      client_user_id: clientUserId,
      package_name: pkgName.trim(),
      sessions_purchased: parseInt(pkgSessions) || 10,
      purchase_date: format(pkgDate, "yyyy-MM-dd"),
      notes: pkgNotes || null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Package created" });
    setNewPkgOpen(false);
    setPkgName(""); setPkgSessions("10"); setPkgNotes("");
    fetchAll();
  };

  const handleLogSession = async () => {
    if (!sessionPkgId) { toast({ title: "Select a package", variant: "destructive" }); return; }
    const pkg = packages.find(p => p.id === sessionPkgId);
    if (pkg && pkg.sessions_used >= pkg.sessions_purchased) {
      toast({ title: "Package full", description: "All sessions have been used.", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("pt_sessions").insert({
      package_id: sessionPkgId,
      client_user_id: clientUserId,
      session_date: format(sessionDate, "yyyy-MM-dd"),
      workout_id: sessionWorkoutId || null,
      notes: sessionNotes || null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Increment sessions_used
    await supabase.from("pt_packages").update({ sessions_used: (pkg?.sessions_used || 0) + 1 } as any).eq("id", sessionPkgId);
    // Auto-complete if full
    if (pkg && (pkg.sessions_used + 1) >= pkg.sessions_purchased) {
      await supabase.from("pt_packages").update({ status: "completed" } as any).eq("id", sessionPkgId);
    }
    toast({ title: "Session logged" });
    setLogSessionOpen(false);
    setSessionNotes(""); setSessionWorkoutId("");
    fetchAll();
  };

  const handleAddInvoice = async () => {
    if (!invUrl.trim()) { toast({ title: "Enter invoice URL", variant: "destructive" }); return; }
    const { error } = await supabase.from("pt_invoices").insert({
      client_user_id: clientUserId,
      package_id: invPkgId || null,
      invoice_url: invUrl.trim(),
      amount: parseFloat(invAmount) || 0,
      currency: invCurrency,
      status: invStatus,
      invoice_date: format(invDate, "yyyy-MM-dd"),
      notes: invNotes || null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Invoice added" });
    setAddInvoiceOpen(false);
    setInvUrl(""); setInvAmount(""); setInvNotes(""); setInvStatus("pending"); setInvCurrency("AUD");
    fetchAll();
  };

  const openEditSession = (s: PTSession) => {
    setEditingSession(s);
    setEditDate(new Date(s.session_date));
    setEditWorkoutId(s.workout_id || "");
    setEditNotes(s.notes || "");
    setEditSessionOpen(true);
  };

  const handleEditSession = async () => {
    if (!editingSession) return;
    const { error } = await supabase.from("pt_sessions").update({
      session_date: format(editDate, "yyyy-MM-dd"),
      workout_id: editWorkoutId || null,
      notes: editNotes || null,
    } as any).eq("id", editingSession.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Session updated" });
    setEditSessionOpen(false);
    setEditingSession(null);
    fetchAll();
  };

  const handleDeleteSession = async (id: string, pkgId: string) => {
    await supabase.from("pt_sessions").delete().eq("id", id);
    const pkg = packages.find(p => p.id === pkgId);
    if (pkg && pkg.sessions_used > 0) {
      await supabase.from("pt_packages").update({ sessions_used: pkg.sessions_used - 1, status: "active" } as any).eq("id", pkgId);
    }
    fetchAll();
  };

  const handleDeleteInvoice = async (id: string) => {
    await supabase.from("pt_invoices").delete().eq("id", id);
    fetchAll();
  };

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (s === "pending") return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
    return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-green-600/80";
    if (s === "pending") return "bg-yellow-600/80";
    return "bg-red-600/80";
  };

  const getWorkoutName = (wId: string | null) => {
    if (!wId) return null;
    return workouts.find(w => w.id === wId)?.workout_name || "Workout";
  };

  if (loading) return null;

  const remaining = activePackage ? activePackage.sessions_purchased - activePackage.sessions_used : 0;
  const progressPct = activePackage ? (activePackage.sessions_used / activePackage.sessions_purchased) * 100 : 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">PT SESSION TRACKER</Badge>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => { setSessionPkgId(activePackage?.id || ""); setLogSessionOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />Log Session
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setNewPkgOpen(true)}>
            <Package className="h-3.5 w-3.5" />New Package
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setAddInvoiceOpen(true)}>
            <DollarSign className="h-3.5 w-3.5" />Add Invoice
          </Button>
          <Button variant="default" size="sm" className="gap-1" onClick={() => setReportOpen(true)}>
            <FileText className="h-3.5 w-3.5" />Generate Report
          </Button>
        </div>
      </div>

      {/* Active Package Summary */}
      {activePackage ? (
        <Card className="glass border-border/50 border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{activePackage.package_name}</p>
                <p className="text-xs text-muted-foreground">Purchased {format(new Date(activePackage.purchase_date), "MMM d, yyyy")}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-mono text-primary">{remaining}</p>
                <p className="text-xs text-muted-foreground">sessions remaining</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{activePackage.sessions_used} used</span>
                <span>{activePackage.sessions_purchased} total</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50 border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            No active package. Create one to start tracking PT sessions.
          </CardContent>
        </Card>
      )}

      {sessions.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Session History ({sessions.length})</CardTitle>
          </CardHeader>
          {isMobile ? (
            <CardContent className="p-3 space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="p-2.5 rounded-lg border border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{format(new Date(s.session_date), "MMM d, yyyy")}</p>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditSession(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60" onClick={() => handleDeleteSession(s.id, s.package_id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  {getWorkoutName(s.workout_id) && <p className="text-xs text-primary">{getWorkoutName(s.workout_id)}</p>}
                  {s.notes && <p className="text-xs text-muted-foreground line-clamp-2">{s.notes}</p>}
                </div>
              ))}
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Workout</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{format(new Date(s.session_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getWorkoutName(s.workout_id) || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{s.notes || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSession(s)} title="Edit session">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteSession(s.id, s.package_id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}

      {/* Past Packages */}
      {packages.filter(p => p.status !== "active").length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Past Packages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.filter(p => p.status !== "active").map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">{p.package_name}</TableCell>
                    <TableCell className="text-sm">{p.sessions_used}/{p.sessions_purchased}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(p.purchase_date), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Invoices ({invoices.length})</CardTitle>
          </CardHeader>
          {isMobile ? (
            <CardContent className="p-3 space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="p-2.5 rounded-lg border border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{format(new Date(inv.invoice_date), "MMM d, yyyy")}</p>
                    <Badge className={cn("text-[10px] capitalize", statusColor(inv.status))}>
                      <span className="flex items-center gap-1">{statusIcon(inv.status)}{inv.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono">{inv.currency === "LKR" ? "Rs" : "$"}{Number(inv.amount).toFixed(2)} {inv.currency}</p>
                    <div className="flex items-center gap-1">
                      {inv.invoice_url && (
                        <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-6 text-xs gap-1"><ExternalLink className="h-3 w-3" />View</Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60" onClick={() => handleDeleteInvoice(inv.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">{format(new Date(inv.invoice_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-sm font-mono">{inv.currency === "LKR" ? "Rs" : "$"}{Number(inv.amount).toFixed(2)} {inv.currency}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px] capitalize", statusColor(inv.status))}>
                          <span className="flex items-center gap-1">{statusIcon(inv.status)}{inv.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.invoice_url && (
                          <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteInvoice(inv.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}

      {/* New Package Dialog */}
      <Dialog open={newPkgOpen} onOpenChange={setNewPkgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create PT Package</DialogTitle>
            <DialogDescription>Set up a new session package for {clientDisplayName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Package Name</Label>
              <Input value={pkgName} onChange={e => setPkgName(e.target.value)} placeholder='e.g. "10-Pack March 2026"' />
            </div>
            <div>
              <Label>Number of Sessions</Label>
              <Input type="number" min={1} value={pkgSessions} onChange={e => setPkgSessions(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div>
              <Label>Purchase Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(pkgDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={pkgDate} onSelect={d => d && setPkgDate(d)} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={pkgNotes} onChange={e => setPkgNotes(e.target.value)} placeholder="Any notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewPkgOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePackage} disabled={!pkgName.trim()}>Create Package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Session Dialog */}
      <Dialog open={logSessionOpen} onOpenChange={setLogSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log PT Session</DialogTitle>
            <DialogDescription>Record a personal training session for {clientDisplayName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Package</Label>
              <Select value={sessionPkgId} onValueChange={setSessionPkgId}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {packages.filter(p => p.status === "active").map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.package_name} ({p.sessions_purchased - p.sessions_used} left)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Session Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(sessionDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={sessionDate} onSelect={d => d && setSessionDate(d)} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Link to Workout (optional)</Label>
              <Select value={sessionWorkoutId || "none"} onValueChange={v => setSessionWorkoutId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workouts.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.workout_name} — {format(new Date(w.date), "MMM d")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Session notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLogSessionOpen(false)}>Cancel</Button>
            <Button onClick={handleLogSession} disabled={!sessionPkgId}>Log Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Invoice</DialogTitle>
            <DialogDescription>Link a Stripe invoice for {clientDisplayName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Invoice URL (Stripe)</Label>
              <Input value={invUrl} onChange={e => setInvUrl(e.target.value)} placeholder="https://invoice.stripe.com/..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Amount</Label>
                <Input type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={invCurrency} onValueChange={setInvCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUD">AUD ($)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="LKR">LKR (Rs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={invStatus} onValueChange={setInvStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Link to Package (optional)</Label>
              <Select value={invPkgId || "none"} onValueChange={v => setInvPkgId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {packages.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.package_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(invDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={invDate} onSelect={d => d && setInvDate(d)} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={invNotes} onChange={e => setInvNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddInvoiceOpen(false)}>Cancel</Button>
            <Button onClick={handleAddInvoice} disabled={!invUrl.trim()}>Add Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={editSessionOpen} onOpenChange={setEditSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PT Session</DialogTitle>
            <DialogDescription>Update session details for {clientDisplayName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Session Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(editDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editDate} onSelect={d => d && setEditDate(d)} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Link to Workout (optional)</Label>
              <Select value={editWorkoutId || "none"} onValueChange={v => setEditWorkoutId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workouts.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.workout_name} — {format(new Date(w.date), "MMM d")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Session notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditSessionOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSession}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Generator */}
      <PTReportGenerator
        open={reportOpen}
        onOpenChange={setReportOpen}
        clientDisplayName={clientDisplayName}
        packages={packages}
        sessions={sessions}
        invoices={invoices}
        workouts={workouts}
      />
    </section>
  );
}
