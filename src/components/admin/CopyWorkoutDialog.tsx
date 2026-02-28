import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWorkoutId: string;
  sourceWorkoutName: string;
  excludeUserId?: string;
}

export function CopyWorkoutDialog({ open, onOpenChange, sourceWorkoutId, sourceWorkoutName, excludeUserId }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [search, setSearch] = useState("");
  const [targetDate, setTargetDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "list_all_users" },
        });
        if (error) throw error;
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setUsers((parsed || []).filter((u: User) => u.id !== excludeUserId));
      } catch { setUsers([]); }
      finally { setLoading(false); }
    };
    fetchUsers();
  }, [open, excludeUserId]);

  const filtered = users.filter(u => u.display_name.toLowerCase().includes(search.toLowerCase()));

  const handleCopy = async () => {
    if (!selectedUser) return;
    setCopying(true);
    try {
      const { error } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "copy_workout_to_user", sourceWorkoutId, targetUserId: selectedUser.id, targetDate },
      });
      if (error) throw error;
      toast({ title: "Workout copied!", description: `"${sourceWorkoutName}" → ${selectedUser.display_name}` });
      onOpenChange(false);
      setSelectedUser(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setCopying(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Copy "{sourceWorkoutName}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />

          {selectedUser ? (
            <div className="flex items-center justify-between border border-primary/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{selectedUser.display_name[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{selectedUser.display_name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : filtered.map(u => (
                  <Button
                    key={u.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 h-auto py-2"
                    onClick={() => setSelectedUser(u)}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">{u.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{u.display_name}</span>
                  </Button>
                ))}
              </div>
            </>
          )}

          <Button onClick={handleCopy} disabled={!selectedUser || copying} className="w-full gap-2">
            {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Copy Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
