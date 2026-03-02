import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { FileText, Printer } from "lucide-react";

interface PTReportGeneratorProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  clientDisplayName: string;
  packages: any[];
  sessions: any[];
  invoices: any[];
  workouts: any[];
}

export function PTReportGenerator({
  open, onOpenChange, clientDisplayName, packages, sessions, invoices, workouts,
}: PTReportGeneratorProps) {
  const [includePackage, setIncludePackage] = useState(true);
  const [includeSessionLog, setIncludeSessionLog] = useState(true);
  const [includeWorkoutDetails, setIncludeWorkoutDetails] = useState(false);
  const [includeInvoices, setIncludeInvoices] = useState(true);
  const [includePending, setIncludePending] = useState(true);
  const [includeClientInfo, setIncludeClientInfo] = useState(true);
  const printRef = useRef<HTMLIFrameElement>(null);

  const activePackage = packages.find(p => p.status === "active");
  const pendingInvoices = invoices.filter(i => i.status !== "paid");

  const getWorkoutName = (wId: string | null) => {
    if (!wId) return null;
    return workouts.find((w: any) => w.id === wId)?.workout_name || "Workout";
  };

  const statusEmoji = (s: string) => s === "paid" ? "✅" : s === "pending" ? "⏳" : "⚠️";

  const generateReport = () => {
    const today = format(new Date(), "MMMM d, yyyy");
    const remaining = activePackage ? activePackage.sessions_purchased - activePackage.sessions_used : 0;

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PT Report – ${clientDisplayName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
  .header .brand { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 600; }
  .header .date { font-size: 12px; color: #94a3b8; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .value { font-size: 32px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
  .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .pkg-highlight { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
  .pkg-highlight h3 { font-size: 16px; font-weight: 700; }
  .pkg-highlight .remaining { font-size: 48px; font-weight: 900; line-height: 1; }
  .pkg-highlight .sub { font-size: 12px; opacity: 0.7; }
  .progress-bar { background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; margin-top: 12px; overflow: hidden; }
  .progress-fill { background: #22c55e; height: 100%; border-radius: 4px; transition: width 0.3s; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { text-align: left; padding: 10px 12px; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  tbody tr:hover { background: #fafafa; }
  .status-paid { color: #16a34a; font-weight: 600; }
  .status-pending { color: #ca8a04; font-weight: 600; }
  .status-overdue { color: #dc2626; font-weight: 600; }
  .alert-box { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
  .alert-box h4 { color: #92400e; font-size: 13px; font-weight: 700; }
  .alert-box p { color: #78350f; font-size: 12px; margin-top: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head><body>`;

    // Header
    html += `<div class="header"><div><div class="brand">The Vault</div><h1>PT Report</h1><div class="date">Generated ${today}</div></div><div style="text-align:right"><div style="font-size:18px;font-weight:700;">${clientDisplayName}</div></div></div>`;

    // Summary Grid
    if (includeClientInfo) {
      html += `<div class="summary-grid">
        <div class="summary-card"><div class="value">${sessions.length}</div><div class="label">Total Sessions</div></div>
        <div class="summary-card"><div class="value">${packages.length}</div><div class="label">Packages</div></div>
        <div class="summary-card"><div class="value">$${invoices.reduce((s: number, i: any) => s + Number(i.amount), 0).toFixed(0)}</div><div class="label">Total Invoiced</div></div>
      </div>`;
    }

    // Package Summary
    if (includePackage && activePackage) {
      const pct = (activePackage.sessions_used / activePackage.sessions_purchased) * 100;
      html += `<div class="section"><div class="section-title">Active Package</div>
        <div class="pkg-highlight">
          <div style="display:flex;justify-content:space-between;align-items:flex-end;">
            <div><h3>${activePackage.package_name}</h3><div class="sub">Purchased ${format(new Date(activePackage.purchase_date), "MMMM d, yyyy")}</div></div>
            <div style="text-align:right"><div class="remaining">${remaining}</div><div class="sub">sessions remaining</div></div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;opacity:0.6;"><span>${activePackage.sessions_used} used</span><span>${activePackage.sessions_purchased} total</span></div>
        </div></div>`;
    }

    // Pending invoices alert
    if (includePending && pendingInvoices.length > 0) {
      html += `<div class="alert-box"><h4>⚠️ ${pendingInvoices.length} Outstanding Invoice${pendingInvoices.length > 1 ? 's' : ''}</h4><p>Total outstanding: $${pendingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0).toFixed(2)} AUD</p></div>`;
    }

    // Session Log
    if (includeSessionLog && sessions.length > 0) {
      html += `<div class="section"><div class="section-title">Session Log</div><table><thead><tr><th>Date</th><th>Workout</th><th>Notes</th></tr></thead><tbody>`;
      sessions.forEach((s: any) => {
        html += `<tr><td>${format(new Date(s.session_date), "MMM d, yyyy")}</td><td>${getWorkoutName(s.workout_id) || "—"}</td><td>${s.notes || "—"}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }

    // Invoices
    if (includeInvoices && invoices.length > 0) {
      html += `<div class="section"><div class="section-title">Invoice History</div><table><thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Link</th></tr></thead><tbody>`;
      invoices.forEach((inv: any) => {
        const sc = inv.status === "paid" ? "status-paid" : inv.status === "pending" ? "status-pending" : "status-overdue";
        html += `<tr><td>${format(new Date(inv.invoice_date), "MMM d, yyyy")}</td><td>$${Number(inv.amount).toFixed(2)} ${inv.currency}</td><td class="${sc}">${statusEmoji(inv.status)} ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</td><td>${inv.invoice_url ? `<a href="${inv.invoice_url}" style="color:#2563eb;">View</a>` : "—"}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }

    // Past Packages
    if (includePackage && packages.filter(p => p.status !== "active").length > 0) {
      html += `<div class="section"><div class="section-title">Past Packages</div><table><thead><tr><th>Package</th><th>Sessions</th><th>Status</th><th>Date</th></tr></thead><tbody>`;
      packages.filter(p => p.status !== "active").forEach((p: any) => {
        html += `<tr><td>${p.package_name}</td><td>${p.sessions_used}/${p.sessions_purchased}</td><td>${p.status}</td><td>${format(new Date(p.purchase_date), "MMM d, yyyy")}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }

    html += `<div class="footer">Generated by The Vault · ${today}</div></body></html>`;

    // Open in new window for printing/saving as PDF
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Generate PT Report</DialogTitle>
          <DialogDescription>Choose what to include in the report for {clientDisplayName}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-client" checked={includeClientInfo} onCheckedChange={c => setIncludeClientInfo(!!c)} />
            <Label htmlFor="inc-client" className="text-sm">Client Summary Statistics</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-pkg" checked={includePackage} onCheckedChange={c => setIncludePackage(!!c)} />
            <Label htmlFor="inc-pkg" className="text-sm">Package Summary</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-sessions" checked={includeSessionLog} onCheckedChange={c => setIncludeSessionLog(!!c)} />
            <Label htmlFor="inc-sessions" className="text-sm">Session Log (dates & workouts)</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-invoices" checked={includeInvoices} onCheckedChange={c => setIncludeInvoices(!!c)} />
            <Label htmlFor="inc-invoices" className="text-sm">Invoice Summary</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-pending" checked={includePending} onCheckedChange={c => setIncludePending(!!c)} />
            <Label htmlFor="inc-pending" className="text-sm">Highlight Pending Invoices</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={generateReport} className="gap-2"><Printer className="h-4 w-4" />Generate & Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
