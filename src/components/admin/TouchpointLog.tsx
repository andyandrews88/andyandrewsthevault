import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, MessageCircle, Phone, Mail, ClipboardCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Touchpoint {
  id: string;
  touchpoint_type: string;
  content: string;
  created_at: string;
}

interface Props {
  clientUserId: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  note: MessageCircle,
  "check-in": ClipboardCheck,
  call: Phone,
  email: Mail,
};

export function TouchpointLog({ clientUserId }: Props) {
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");

  const fetch = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "get_touchpoints", clientUserId },
      });
      if (error) throw error;
      setTouchpoints(typeof data === "string" ? JSON.parse(data) : data || []);
    } catch { setTouchpoints([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [clientUserId]);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setAdding(true);
    try {
      const { error } = await supabase.functions.invoke("admin-workout-builder", {
        body: { action: "add_touchpoint", clientUserId, touchpointType: type, content: content.trim() },
      });
      if (error) throw error;
      setContent("");
      setShowForm(false);
      toast({ title: "Touchpoint added" });
      fetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setAdding(false); }
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Coaching Notes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1 h-7">
            <Plus className="h-3.5 w-3.5" />{showForm ? "Cancel" : "Add"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-2 border border-primary/20 rounded-lg p-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="check-in">Check-in</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add a coaching note..." className="min-h-[60px] text-sm" />
            <Button size="sm" onClick={handleAdd} disabled={!content.trim() || adding} className="w-full">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}Save
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : touchpoints.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No coaching notes yet</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {touchpoints.map(tp => {
              const Icon = TYPE_ICONS[tp.touchpoint_type] || MessageCircle;
              return (
                <div key={tp.id} className="flex gap-2 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] capitalize">{tp.touchpoint_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(tp.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5">{tp.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
