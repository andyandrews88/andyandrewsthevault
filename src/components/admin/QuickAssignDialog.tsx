import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Users, Dumbbell, Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Template { id: string; name: string; category: string; duration_weeks: number; days_per_week: number }
interface UserItem { id: string; display_name: string; avatar_url: string | null }

const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function QuickAssignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [trainingDays, setTrainingDays] = useState<number[]>([1, 3, 5]);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (!open) { setStep(1); setSelectedTemplate(""); setSelectedUsers([]); setUserSearch(""); return; }
    setLoading(true);
    Promise.all([
      supabase.functions.invoke("admin-workout-builder", { body: { action: "list_templates" } }),
      supabase.functions.invoke("admin-workout-builder", { body: { action: "list_all_users" } }),
    ]).then(([tRes, uRes]) => {
      setTemplates(tRes.data || []);
      setUsers(uRes.data || []);
    }).finally(() => setLoading(false));
  }, [open]);

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const toggleDay = (day: number) => {
    setTrainingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const handleAssign = async () => {
    if (!selectedTemplate || !selectedUsers.length || !trainingDays.length) return;
    setAssigning(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
        body: {
          action: "batch_assign_template",
          templateId: selectedTemplate,
          targetUserIds: selectedUsers,
          startDate,
          trainingDays,
        },
      });
      if (error) throw error;
      const successes = (data?.results || []).filter((r: any) => r.success).length;
      toast({ title: "Programs Assigned", description: `Successfully assigned to ${successes} of ${selectedUsers.length} clients.` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to assign", variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const filteredUsers = users.filter(u => u.display_name.toLowerCase().includes(userSearch.toLowerCase()));
  const selectedTemplateName = templates.find(t => t.id === selectedTemplate)?.name || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" /> Quick Assign Template
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-32" /></div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Choose a program template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} <span className="text-muted-foreground ml-1">({t.duration_weeks}w · {t.days_per_week}d)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Select Clients</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search clients..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
              <ScrollArea className="h-[200px] mt-2 border rounded-md p-2">
                {filteredUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-2 py-1.5 px-1 hover:bg-muted/30 rounded cursor-pointer">
                    <Checkbox checked={selectedUsers.includes(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                    <span className="text-sm">{u.display_name}</span>
                  </label>
                ))}
              </ScrollArea>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{selectedUsers.length} client(s) selected</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!selectedTemplate || !selectedUsers.length}>
                Next: Schedule
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">
              <span className="font-medium">{selectedTemplateName}</span>
              <span className="text-muted-foreground"> → {selectedUsers.length} client(s)</span>
            </div>

            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">Training Days</Label>
              <div className="flex gap-2 mt-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <Badge
                    key={d}
                    variant={trainingDays.includes(d) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => toggleDay(d)}
                  >
                    {DAY_LABELS[d]}
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleAssign} disabled={assigning || !trainingDays.length}>
                {assigning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Assigning...</> : <>
                  <Users className="h-4 w-4 mr-2" />Assign to {selectedUsers.length} Client(s)
                </>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
