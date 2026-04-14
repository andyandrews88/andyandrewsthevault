import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Program, useProgramStore } from "@/stores/programStore";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toEmbedUrl } from "@/lib/vaultService";
import { ProgramAssignmentWizard } from "@/components/tracks/ProgramAssignmentWizard";
import { ProgramLandingEditor } from "@/components/tracks/ProgramLandingEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Dumbbell,
  Clock,
  BarChart3,
  Pencil,
} from "lucide-react";

export default function ProgramLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const { enrollments, fetchEnrollments } = useProgramStore();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchProgram = async () => {
    if (!slug) return;
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!error && data) setProgram(data as unknown as Program);
    setLoading(false);
  };

  useEffect(() => {
    fetchProgram();
    fetchEnrollments();
  }, [slug]);

  const isEnrolled = program
    ? enrollments.some((e) => e.program_id === program.id)
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-6 w-60" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Program not found.</p>
        <Button variant="outline" onClick={() => navigate("/vault")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Programs
        </Button>
      </div>
    );
  }

  const embedUrl = program.video_url ? toEmbedUrl(program.video_url) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/vault")}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Programs
        </Button>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => setEditorOpen(true)}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Video hero */}
        {embedUrl && (
          <div className="rounded-xl overflow-hidden border border-border">
            <AspectRatio ratio={16 / 9}>
              <iframe
                src={embedUrl}
                title={program.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </AspectRatio>
          </div>
        )}

        {/* Title & badges */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{program.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {program.difficulty}
            </Badge>
            <Badge variant="secondary">
              {program.duration_weeks} weeks
            </Badge>
            <Badge variant="secondary">
              {program.days_per_week}d/week
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {program.category}
            </Badge>
            {program.program_style && (
              <Badge variant="outline" className="capitalize">
                {program.program_style}
              </Badge>
            )}
          </div>
        </div>

        {/* About section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">About This Program</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {(program as any).long_description || program.description || "No description available."}
          </p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailCard
            icon={<Calendar className="w-4 h-4" />}
            label="Duration"
            value={`${program.duration_weeks} weeks`}
          />
          <DetailCard
            icon={<Dumbbell className="w-4 h-4" />}
            label="Days / week"
            value={`${program.days_per_week} sessions`}
          />
          <DetailCard
            icon={<BarChart3 className="w-4 h-4" />}
            label="Difficulty"
            value={program.difficulty}
          />
          {program.program_style && (
            <DetailCard
              icon={<Clock className="w-4 h-4" />}
              label="Style"
              value={program.program_style}
            />
          )}
        </div>

        {/* CTA */}
        <div className="pt-2">
          {isEnrolled ? (
            <div className="flex items-center justify-center gap-2 py-3 text-primary font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Currently Enrolled
            </div>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setWizardOpen(true)}
            >
              Enroll Now
            </Button>
          )}
        </div>
      </div>

      {/* Enrollment wizard */}
      <ProgramAssignmentWizard
        program={program}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Admin editor */}
      {isAdmin && (
        <ProgramLandingEditor
          program={program}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            fetchProgram();
          }}
        />
      )}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border rounded-lg p-3 flex items-center gap-3">
      <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}
