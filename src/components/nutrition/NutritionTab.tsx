import { useEffect, useMemo, useState } from "react";
import { addDays, format, isToday, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Plus, Settings2, UtensilsCrossed } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNutritionLogStore, sumMacros, type MealSlot } from "@/stores/nutritionLogStore";
import { LogMealSheet } from "./LogMealSheet";
import { TargetsSheet } from "./TargetsSheet";
import { FoodEntryRow } from "./FoodEntryRow";
import { MacroProgress } from "./MacroProgress";

const SLOT_ORDER: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export function NutritionTab() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdminCheck();
  const { selectedDate, entries, target, loading, error, loadDay, deleteEntry } =
    useNutritionLogStore();

  const [logOpen, setLogOpen] = useState(false);
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [targetsOpen, setTargetsOpen] = useState(false);

  useEffect(() => {
    if (user) loadDay(selectedDate, user.id);
  }, [user, selectedDate, loadDay]);

  const totals = useMemo(() => sumMacros(entries), [entries]);

  const shift = (days: number) =>
    useNutritionLogStore
      .getState()
      .setSelectedDate(format(addDays(parseISO(selectedDate), days), "yyyy-MM-dd"));

  const openLog = (s: MealSlot) => {
    setSlot(s);
    setLogOpen(true);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Date */}
      <div className="flex items-center justify-between">
        <button onClick={() => shift(-1)} className="p-2 -ml-2 text-muted-foreground" aria-label="Previous day">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold">
          {isToday(parseISO(selectedDate)) ? "Today" : format(parseISO(selectedDate), "EEE d MMM")}
        </p>
        <button
          onClick={() => shift(1)}
          className="p-2 -mr-2 text-muted-foreground disabled:opacity-30"
          aria-label="Next day"
          disabled={isToday(parseISO(selectedDate))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Targets vs actual */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Today's fuel
            </p>
            <p className="text-2xl font-semibold leading-tight">
              {Math.round(totals.calories)}
              {target?.calories ? (
                <span className="text-base text-muted-foreground font-normal">
                  {" "}/ {Math.round(Number(target.calories))} kcal
                </span>
              ) : (
                <span className="text-base text-muted-foreground font-normal"> kcal</span>
              )}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setTargetsOpen(true)}
              className="p-2 -mr-1 text-muted-foreground"
              aria-label="Edit targets"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {target ? (
          <div className="grid grid-cols-3 gap-3">
            <MacroProgress label="Protein" value={totals.protein} target={Number(target.protein_g) || null} accent />
            <MacroProgress label="Carbs" value={totals.carbs} target={Number(target.carbs_g) || null} />
            <MacroProgress label="Fat" value={totals.fats} target={Number(target.fats_g) || null} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No targets set yet — Andy will set these for you. Keep logging in the meantime.
          </p>
        )}
        {target?.notes && <p className="text-xs text-accent">{target.notes}</p>}
      </section>

      <Button variant="elite" className="w-full h-12" onClick={() => openLog("lunch")}>
        <Plus className="h-4 w-4 mr-1.5" /> Log food
      </Button>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => user && loadDay(selectedDate, user.id)}>
            Retry
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm font-medium mt-2">Nothing logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Snap a photo or describe what you ate — it takes seconds.
          </p>
        </div>
      ) : (
        SLOT_ORDER.map((s) => {
          const rows = entries.filter((e) => e.meal_slot === s);
          if (rows.length === 0) return null;
          return (
            <section key={s} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground capitalize">
                  {s}
                </p>
                <button onClick={() => openLog(s)} className="text-xs text-primary font-medium p-1">
                  Add
                </button>
              </div>
              {rows.map((e) => (
                <FoodEntryRow key={e.id} entry={e} onDelete={deleteEntry} />
              ))}
            </section>
          );
        })
      )}

      <LogMealSheet
        open={logOpen}
        onOpenChange={setLogOpen}
        entryDate={selectedDate}
        defaultSlot={slot}
      />
      {user && (
        <TargetsSheet
          open={targetsOpen}
          onOpenChange={setTargetsOpen}
          userId={user.id}
          current={target}
        />
      )}
    </div>
  );
}
