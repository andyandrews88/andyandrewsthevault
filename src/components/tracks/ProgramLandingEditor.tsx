import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Program } from "@/stores/programStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface Props {
  program: Program;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ProgramLandingEditor({ program, open, onClose, onSaved }: Props) {
  const [description, setDescription] = useState(program.description);
  const [longDescription, setLongDescription] = useState(
    (program as any).long_description || ""
  );
  const [videoUrl, setVideoUrl] = useState(program.video_url || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("programs")
        .update({
          description: description.trim(),
          long_description: longDescription.trim(),
          video_url: videoUrl.trim() || null,
        } as any)
        .eq("id", program.id);
      if (error) throw error;
      toast.success("Landing page updated");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Landing Page</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div>
            <Label>Short Description (card blurb)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief program summary shown on the card..."
            />
          </div>

          <div>
            <Label>Landing Page Description</Label>
            <Textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={8}
              placeholder="Full program description for the landing page. Explain what users can expect, who it's for, what equipment is needed, etc."
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is the detailed description shown on the program's dedicated
              landing page.
            </p>
          </div>

          <div>
            <Label>Program Video URL</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              YouTube or Vimeo link — embedded at the top of the landing page.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
