import { describe, it, expect } from "vitest";
import { parseSpokenSet } from "@/lib/voiceSetParser";
describe("voice set parser", () => {
  it("bench press, fourth set, 60 kilos, 8 reps, RPE 8", () => {
    const p = parseSpokenSet("Bench press, fourth set, 60 kilos, 8 reps, RPE 8.");
    expect(p).toMatchObject({ movement: "Bench Press", setNumber: 4, weight: 60, unit: "kg", reps: 8, rpe: 8 });
  });
  it("60 pounds, 10 reps, RPE 7", () => {
    const p = parseSpokenSet("60 pounds, 10 reps, RPE 7");
    expect(p).toMatchObject({ movement: null, weight: 60, unit: "lb", reps: 10, rpe: 7, setNumber: null });
  });
  it("set three spoken words", () => {
    const p = parseSpokenSet("Bench press, set three, eighty kilos, eight reps, RPE eight");
    expect(p).toMatchObject({ setNumber: 3, weight: 80, unit: "kg", reps: 8, rpe: 8 });
  });
});
