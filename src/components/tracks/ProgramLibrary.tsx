import { useEffect, useState } from "react";
import { useProgramStore, Program } from "@/stores/programStore";
import { ProgramCard } from "./ProgramCard";
import { ProgramAssignmentWizard } from "./ProgramAssignmentWizard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function ProgramLibrary() {
  const { programs, enrollments, fetchPrograms, fetchEnrollments, isLoading } = useProgramStore();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchEnrollments();
  }, [fetchPrograms, fetchEnrollments]);

  const enrolledProgramIds = new Set(enrollments.map(e => e.program_id));

  const handleSelect = (program: Program) => {
    setSelectedProgram(program);
    setWizardOpen(true);
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Section header */}
      <div className="flex flex-col items-start gap-1">
        <span className="section-label">FREE PROGRAMS</span>
        <h2 className="text-base font-semibold">12-Week Training Programs</h2>
        <p className="text-xs text-muted-foreground max-w-lg hidden md:block">
          Free for all Vault members. Select a program, choose your start date and training days — your workouts will be automatically scheduled on your calendar.
        </p>
      </div>

      {/* Program grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {programs.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              isEnrolled={enrolledProgramIds.has(program.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Assignment wizard */}
      <ProgramAssignmentWizard
        program={selectedProgram}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}
