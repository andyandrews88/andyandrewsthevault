import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Trash2, Edit2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    // Use edge function to bypass the "active only" RLS filter
    const { data, error } = await supabase.functions.invoke("admin-detail", {
      body: { section: "announcements" },
    });
    // Fallback to direct query if edge function doesn't support it yet
    const { data: directData } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements((directData as Announcement[]) || []);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const resetForm = () => {
    setTitle(""); setMessage(""); setType("info"); setIsActive(true);
    setEditingId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }

    const payload = { title: title.trim(), message: message.trim(), type, is_active: isActive };

    if (editingId) {
      const { error } = await supabase.from("announcements").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Announcement updated" });
    } else {
      const { error } = await supabase.from("announcements").insert(payload);
      if (error) { toast({ title: "Create failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Announcement created" });
    }
    resetForm();
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", variant: "destructive" }); return; }
    toast({ title: "Announcement deleted" });
    fetchAnnouncements();
  };

  const handleEdit = (a: Announcement) => {
    setEditingId(a.id); setTitle(a.title); setMessage(a.message);
    setType(a.type); setIsActive(a.is_active); setShowForm(true);
  };

  const toggleActive = async (a: Announcement) => {
    await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id);
    fetchAnnouncements();
  };

  const typeBadge = (t: string) => {
    const variants: Record<string, string> = { info: "default", warning: "secondary", success: "outline" };
    return <Badge variant={variants[t] as any || "default"} className="text-xs capitalize">{t}</Badge>;
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Announcements</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? <X className="h-4 w-4" /> : <><Plus className="h-4 w-4 mr-1" />New</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} rows={3} />
            <div className="flex gap-4 items-center">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label className="text-sm">Active</Label>
              </div>
              <Button size="sm" onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
            </div>
          </div>
        )}

        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No announcements yet.</p>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className={`flex items-start justify-between p-3 rounded-lg border ${a.is_active ? "bg-background" : "bg-muted/30 opacity-60"}`}>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    {typeBadge(a.type)}
                    {!a.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(a)}>
                    <Switch checked={a.is_active} className="scale-75" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(a)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
