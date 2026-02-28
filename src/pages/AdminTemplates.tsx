import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Plus, Dumbbell, Archive, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TemplateEditor } from "@/components/admin/TemplateEditor";

interface Template {
  id: string;
  name: string;
  description: string;
  duration_weeks: number;
  days_per_week: number;
  category: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminTemplates() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newWeeks, setNewWeeks] = useState("4");
  const [newDays, setNewDays] = useState("4");
  const [newCategory, setNewCategory] = useState("strength");
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "list_templates", includeArchived: true },
      });
      if (error) throw error;
      setTemplates(typeof data === "string" ? JSON.parse(data) : data || []);
    } catch { setTemplates([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate("/"); return; }
    fetchTemplates();
  }, [isAdmin, adminLoading, navigate]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("admin-workout-builder", {
        body: {
          action: "create_template", name: newName.trim(), description: newDesc.trim(),
          durationWeeks: parseInt(newWeeks), daysPerWeek: parseInt(newDays), category: newCategory,
        },
      });
      if (error) throw error;
      toast({ title: "Template created" });
      setCreateOpen(false);
      setNewName(""); setNewDesc("");
      fetchTemplates();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleArchive = async (t: Template) => {
    try {
      await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "update_template", templateId: t.id, isArchived: !t.is_archived },
      });
      toast({ title: t.is_archived ? "Restored" : "Archived" });
      fetchTemplates();
    } catch {}
  };

  const handleDelete = async (t: Template) => {
    if (!confirm(`Delete "${t.name}" permanently?`)) return;
    try {
      await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "delete_template", templateId: t.id },
      });
      toast({ title: "Deleted" });
      fetchTemplates();
    } catch {}
  };

  if (editingTemplate) {
    return <TemplateEditor template={editingTemplate} onBack={() => { setEditingTemplate(null); fetchTemplates(); }} />;
  }

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
          <Skeleton className="h-8 w-64" />
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Program Templates</h1>
              <p className="text-sm text-muted-foreground">Create reusable multi-week programs</p>
            </div>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2"><Plus className="h-4 w-4" />New Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Program Template</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Template name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Duration (weeks)</label>
                    <Input type="number" value={newWeeks} onChange={(e) => setNewWeeks(e.target.value)} min="1" max="52" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Days / week</label>
                    <Input type="number" value={newDays} onChange={(e) => setNewDays(e.target.value)} min="1" max="7" />
                  </div>
                </div>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["strength", "hypertrophy", "powerlifting", "conditioning", "general"].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} disabled={!newName.trim() || saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {templates.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No templates yet. Create your first program template.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <Card key={t.id} className={`glass border-border/50 ${t.is_archived ? "opacity-60" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditingTemplate(t)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Dumbbell className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-semibold truncate">{t.name}</p>
                      <Badge variant="secondary" className="capitalize text-[10px]">{t.category}</Badge>
                      {t.is_archived && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.duration_weeks} weeks · {t.days_per_week} days/week
                      {t.description ? ` · ${t.description.slice(0, 60)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTemplate(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleArchive(t)}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
