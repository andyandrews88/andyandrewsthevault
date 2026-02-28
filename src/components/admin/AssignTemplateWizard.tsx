import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Dumbbell, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  duration_weeks: number;
  days_per_week: number;
  category: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetDisplayName: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AssignTemplateWizard({ open, onOpenChange, targetUserId, targetDisplayName }: Props) {
  const [step, setStep] = useState<"template" | "schedule">("template");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [trainingDays, setTrainingDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri

  useEffect(() => {
    if (!open) { setStep("template"); setSelectedTemplate(null); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("admin-workout-builder", {
          body: { action: "list_templates" },
        });
        if (error) throw error;
        setTemplates(typeof data === "string" ? JSON.parse(data) : data || []);
      } catch { setTemplates([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [open]);

  const toggleDay = (day: number) => {
    setTrainingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const handleAssign = async () => {
    if (!selectedTemplate) return;
    setAssigning(true);
    try {
      const { error } = await supabase.functions.invoke("admin-workout-builder", {
        body: {
          action: "assign_template",
          templateId: selectedTemplate.id,
          targetUserId,
          startDate,
          trainingDays,
        },
      });
      if (error) throw error;
      toast({ title: "Program assigned!", description: `${selectedTemplate.name} → ${targetDisplayName}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setAssigning(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Assign Program to {targetDisplayName}
          </DialogTitle>
        </DialogHeader>

        {step === "template" ? (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No templates. Create one first.</p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {templates.map(t => (
                  <Button
                    key={t.id}
                    variant={selectedTemplate?.id === t.id ? "default" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => setSelectedTemplate(t)}
                  >
                    <Dumbbell className="h-4 w-4 shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.duration_weeks}w · {t.days_per_week}d/w · {t.category}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            <Button onClick={() => setStep("schedule")} disabled={!selectedTemplate} className="w-full">
              Next: Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Training Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <Button
                    key={i}
                    variant={trainingDays.includes(i) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(i)}
                    className="w-12"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <strong>{selectedTemplate?.name}</strong> · {selectedTemplate?.duration_weeks} weeks starting {startDate}
              · Training on {trainingDays.map(d => DAY_LABELS[d]).join(", ")}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("template")} className="flex-1">Back</Button>
              <Button onClick={handleAssign} disabled={assigning || trainingDays.length === 0} className="flex-1 gap-2">
                {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Assign Program
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
