import { useState } from "react";
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
  const [includeInvoices, setIncludeInvoices] = useState(true);
  const [includePending, setIncludePending] = useState(true);
  const [includeClientInfo, setIncludeClientInfo] = useState(true);

  const pendingInvoices = invoices.filter(i => i.status !== "paid");
  const paidInvoices = invoices.filter(i => i.status === "paid");

  const getWorkoutName = (wId: string | null) => {
    if (!wId) return null;
    return workouts.find((w: any) => w.id === wId)?.workout_name || "Workout";
  };

  const statusEmoji = (s: string) => s === "paid" ? "✅" : s === "pending" ? "⏳" : "⚠️";
  const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const pkgStatusEmoji = (s: string) => s === "active" ? "🟢" : s === "completed" ? "✅" : s === "paused" ? "⏸️" : "❌";

  const currencySymbol = (c: string) => c === "LKR" ? "Rs" : "$";

  const generateReport = () => {
    const today = format(new Date(), "MMMM d, yyyy");

    const totalSessions = sessions.length;
    const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const totalPaid = paidInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const totalOutstanding = pendingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const totalSessionsPurchased = packages.reduce((s: number, p: any) => s + p.sessions_purchased, 0);
    const totalSessionsUsed = packages.reduce((s: number, p: any) => s + p.sessions_used, 0);

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PT Report – ${clientDisplayName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 850px; margin: 0 auto; }
  .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
  .header .brand { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 600; }
  .header .date { font-size: 12px; color: #94a3b8; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .summary-card .value { font-size: 28px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
  .summary-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .summary-card.highlight { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-color: transparent; }
  .summary-card.highlight .value { color: white; }
  .summary-card.highlight .label { color: rgba(255,255,255,0.7); }
  .pkg-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 14px; page-break-inside: avoid; }
  .pkg-card.active { border-left: 4px solid #2563eb; background: #f0f4ff; }
  .pkg-card.completed { border-left: 4px solid #16a34a; background: #f0fdf4; }
  .pkg-card.paused { border-left: 4px solid #ca8a04; background: #fefce8; }
  .pkg-card.cancelled { border-left: 4px solid #dc2626; background: #fef2f2; }
  .pkg-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .pkg-name { font-size: 15px; font-weight: 700; }
  .pkg-status { font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .pkg-status.active { background: #dbeafe; color: #1d4ed8; }
  .pkg-status.completed { background: #dcfce7; color: #15803d; }
  .pkg-status.paused { background: #fef9c3; color: #a16207; }
  .pkg-status.cancelled { background: #fee2e2; color: #b91c1c; }
  .pkg-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .pkg-meta-item { font-size: 12px; }
  .pkg-meta-item .meta-label { color: #94a3b8; font-size: 10px; text-transform: uppercase; }
  .pkg-meta-item .meta-value { font-weight: 600; color: #0f172a; }
  .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 6px; }
  .progress-fill { height: 100%; border-radius: 4px; }
  .progress-fill.active { background: #2563eb; }
  .progress-fill.completed { background: #16a34a; }
  .pkg-sessions-list { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; }
  .pkg-sessions-list h4 { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .session-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  .session-row:last-child { border-bottom: none; }
  .pkg-invoices-list { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; }
  .pkg-invoices-list h4 { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
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
  .financial-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .fin-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
  .fin-card .fin-value { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .fin-card .fin-label { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
  .fin-card.paid .fin-value { color: #16a34a; }
  .fin-card.outstanding .fin-value { color: #ca8a04; }
  .fin-card.total .fin-value { color: #0f172a; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  .notes-block { background: #f8fafc; border-left: 3px solid #94a3b8; padding: 8px 12px; font-size: 12px; color: #475569; font-style: italic; margin-top: 6px; border-radius: 0 4px 4px 0; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head><body>`;

    // Header
    html += `<div class="header"><div><div class="brand">The Vault</div><h1>PT Report</h1><div class="date">Generated ${today}</div></div><div style="text-align:right"><div style="font-size:18px;font-weight:700;">${clientDisplayName}</div></div></div>`;

    // Summary Grid
    if (includeClientInfo) {
      html += `<div class="summary-grid">
        <div class="summary-card"><div class="value">${totalSessions}</div><div class="label">Sessions Completed</div></div>
        <div class="summary-card"><div class="value">${totalSessionsPurchased - totalSessionsUsed}</div><div class="label">Sessions Remaining</div></div>
        <div class="summary-card"><div class="value">${packages.length}</div><div class="label">Total Packages</div></div>
        <div class="summary-card highlight"><div class="value">$${totalInvoiced.toFixed(0)}</div><div class="label">Total Invoiced</div></div>
      </div>`;
    }

    // Pending invoices alert
    if (includePending && pendingInvoices.length > 0) {
      html += `<div class="alert-box"><h4>⚠️ ${pendingInvoices.length} Outstanding Invoice${pendingInvoices.length > 1 ? 's' : ''}</h4><p>Total outstanding: $${totalOutstanding.toFixed(2)} AUD</p></div>`;
    }

    // Per-Package Breakdown
    if (includePackage && packages.length > 0) {
      html += `<div class="section"><div class="section-title">Package Breakdown (${packages.length})</div>`;

      packages.forEach((pkg: any) => {
        const pkgSess = sessions.filter((s: any) => s.package_id === pkg.id);
        const pkgInvs = invoices.filter((i: any) => i.package_id === pkg.id);
        const remaining = pkg.sessions_purchased - pkg.sessions_used;
        const pct = (pkg.sessions_used / pkg.sessions_purchased) * 100;
        const pkgTotal = pkgInvs.reduce((s: number, i: any) => s + Number(i.amount), 0);

        html += `<div class="pkg-card ${pkg.status}">`;
        html += `<div class="pkg-header"><div class="pkg-name">${pkgStatusEmoji(pkg.status)} ${pkg.package_name}</div><span class="pkg-status ${pkg.status}">${pkg.status}</span></div>`;

        html += `<div class="pkg-meta">
          <div class="pkg-meta-item"><div class="meta-label">Purchased</div><div class="meta-value">${format(new Date(pkg.purchase_date), "MMM d, yyyy")}</div></div>
          <div class="pkg-meta-item"><div class="meta-label">Sessions</div><div class="meta-value">${pkg.sessions_used} / ${pkg.sessions_purchased} used</div></div>
          <div class="pkg-meta-item"><div class="meta-label">Remaining</div><div class="meta-value">${remaining} session${remaining !== 1 ? 's' : ''}</div></div>
        </div>`;

        html += `<div class="progress-bar"><div class="progress-fill ${pkg.status}" style="width:${pct}%"></div></div>`;
        html += `<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px;color:#94a3b8;"><span>${pkg.sessions_used} used</span><span>${pkg.sessions_purchased} total</span></div>`;

        if (pkg.notes) {
          html += `<div class="notes-block">${pkg.notes}</div>`;
        }

        // Sessions linked to this package
        if (includeSessionLog && pkgSess.length > 0) {
          html += `<div class="pkg-sessions-list"><h4>Sessions (${pkgSess.length})</h4>`;
          pkgSess.forEach((s: any) => {
            const wName = getWorkoutName(s.workout_id);
            html += `<div class="session-row"><span>${format(new Date(s.session_date), "MMM d, yyyy")}</span><span style="color:#64748b;">${wName || "—"}</span><span style="color:#94a3b8;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.notes || "—"}</span></div>`;
          });
          html += `</div>`;
        }

        // Invoices linked to this package
        if (includeInvoices && pkgInvs.length > 0) {
          html += `<div class="pkg-invoices-list"><h4>Linked Invoices (${pkgInvs.length}) — Total: ${currencySymbol(pkgInvs[0]?.currency || "AUD")}${pkgTotal.toFixed(2)}</h4>`;
          pkgInvs.forEach((inv: any) => {
            const sc = inv.status === "paid" ? "status-paid" : inv.status === "pending" ? "status-pending" : "status-overdue";
            html += `<div class="session-row"><span>${format(new Date(inv.invoice_date), "MMM d, yyyy")}</span><span>${currencySymbol(inv.currency)}${Number(inv.amount).toFixed(2)} ${inv.currency}</span><span class="${sc}">${statusEmoji(inv.status)} ${statusLabel(inv.status)}</span></div>`;
          });
          html += `</div>`;
        }

        html += `</div>`;
      });

      html += `</div>`;
    }

    // Unlinked sessions (not tied to any package)
    if (includeSessionLog) {
      const unlinkedSessions = sessions.filter((s: any) => !packages.some((p: any) => p.id === s.package_id));
      if (unlinkedSessions.length > 0) {
        html += `<div class="section"><div class="section-title">Unlinked Sessions (${unlinkedSessions.length})</div><table><thead><tr><th>Date</th><th>Workout</th><th>Notes</th></tr></thead><tbody>`;
        unlinkedSessions.forEach((s: any) => {
          html += `<tr><td>${format(new Date(s.session_date), "MMM d, yyyy")}</td><td>${getWorkoutName(s.workout_id) || "—"}</td><td>${s.notes || "—"}</td></tr>`;
        });
        html += `</tbody></table></div>`;
      }
    }

    // Financial Summary
    if (includeInvoices && invoices.length > 0) {
      html += `<div class="section"><div class="section-title">Financial Summary</div>`;
      html += `<div class="financial-summary">
        <div class="fin-card total"><div class="fin-value">$${totalInvoiced.toFixed(2)}</div><div class="fin-label">Total Invoiced</div></div>
        <div class="fin-card paid"><div class="fin-value">$${totalPaid.toFixed(2)}</div><div class="fin-label">Total Paid</div></div>
        <div class="fin-card outstanding"><div class="fin-value">$${totalOutstanding.toFixed(2)}</div><div class="fin-label">Outstanding</div></div>
      </div>`;

      // Unlinked invoices
      const unlinkedInvoices = invoices.filter((i: any) => !i.package_id);
      if (unlinkedInvoices.length > 0) {
        html += `<div class="section-title" style="margin-top:16px;">Unlinked Invoices (${unlinkedInvoices.length})</div>`;
        html += `<table><thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Notes</th></tr></thead><tbody>`;
        unlinkedInvoices.forEach((inv: any) => {
          const sc = inv.status === "paid" ? "status-paid" : inv.status === "pending" ? "status-pending" : "status-overdue";
          html += `<tr><td>${format(new Date(inv.invoice_date), "MMM d, yyyy")}</td><td>${currencySymbol(inv.currency)}${Number(inv.amount).toFixed(2)} ${inv.currency}</td><td class="${sc}">${statusEmoji(inv.status)} ${statusLabel(inv.status)}</td><td>${inv.notes || "—"}</td></tr>`;
        });
        html += `</tbody></table>`;
      }

      html += `</div>`;
    }

    html += `<div class="footer">Generated by The Vault · ${today} · Confidential</div></body></html>`;

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
            <Label htmlFor="inc-pkg" className="text-sm">Package Breakdown (with linked sessions & invoices)</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-sessions" checked={includeSessionLog} onCheckedChange={c => setIncludeSessionLog(!!c)} />
            <Label htmlFor="inc-sessions" className="text-sm">Session Log (dates, workouts, notes)</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-invoices" checked={includeInvoices} onCheckedChange={c => setIncludeInvoices(!!c)} />
            <Label htmlFor="inc-invoices" className="text-sm">Financial Summary & Invoice Details</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox id="inc-pending" checked={includePending} onCheckedChange={c => setIncludePending(!!c)} />
            <Label htmlFor="inc-pending" className="text-sm">Highlight Outstanding Invoices</Label>
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
