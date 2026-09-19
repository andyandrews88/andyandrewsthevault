/**
 * Parses a spoken set into structured values.
 *
 * "Bench press, set three, 80 kilos, eight reps, RPE eight"
 *   -> { movement: "Bench press", setNumber: 3, weight: 80, unit: "kg", reps: 8, rpe: 8 }
 *
 * Anything not clearly heard stays null so the confirmation card can flag it.
 * Nothing here writes to the database.
 */

export interface ParsedSet {
  movement: string | null;
  setNumber: number | null;
  weight: number | null;
  unit: "kg" | "lb" | null;
  reps: number | null;
  rpe: number | null;
  /** normalised, cleaned-up sentence for display */
  normalised: string;
}

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

/** Spoken ordinals, so "fourth set" reads the same as "set four". */
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
  eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
};

const HOMOPHONES: Record<string, string> = {
  won: "one", to: "two", too: "two", for: "four", fore: "four", ate: "eight",
};


/** Rewrites spoken number words into digits, handling "eighty five" -> 85. */
export function wordsToDigits(input: string): string {
  const tokens = input.toLowerCase().replace(/[,;]/g, " ").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const raw = tokens[i].replace(/[^a-z0-9.\-]/g, "");
    const word = HOMOPHONES[raw] ?? raw;
    if (word in TENS) {
      let value = TENS[word];
      const next = tokens[i + 1]?.replace(/[^a-z]/g, "");
      const nextWord = next ? (HOMOPHONES[next] ?? next) : "";
      if (nextWord && nextWord in UNITS && UNITS[nextWord] > 0 && UNITS[nextWord] < 10) {
        value += UNITS[nextWord];
        i += 1;
      }
      out.push(String(value));
    } else if (word in UNITS) {
      out.push(String(UNITS[word]));
    } else if (word === "hundred" && out.length > 0 && /^\d+$/.test(out[out.length - 1])) {
      out[out.length - 1] = String(Number(out[out.length - 1]) * 100);
    } else {
      out.push(tokens[i]);
    }
    i += 1;
  }
  return out.join(" ");
}

const NUM = "(\\d+(?:\\.\\d+)?)";

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function parseSpokenSet(transcript: string): ParsedSet {
  const normalised = wordsToDigits(transcript)
    .replace(/\s+/g, " ")
    .replace(/[.]+$/, "")
    .trim();
  const text = normalised.toLowerCase();

  const rpeMatch = text.match(new RegExp(`\\brpe\\s*(?:of\\s*)?${NUM}`));
  const repsMatch = text.match(new RegExp(`${NUM}\\s*(?:reps?|repetitions?|times)\\b`));
  const weightMatch = text.match(
    new RegExp(`${NUM}\\s*(kilograms?|kilos?|kgs?|pounds?|lbs?|lb)\\b`)
  );
  const setMatch = text.match(new RegExp(`\\bset\\s*(?:number\\s*)?${NUM}`));

  let unit: "kg" | "lb" | null = null;
  if (weightMatch) unit = /^(k)/.test(weightMatch[2]) ? "kg" : "lb";

  // Movement = words before the first structured token ("set", a number, or a unit).
  let movement: string | null = null;
  const cut = text.search(/\bset\b|\d/);
  if (cut > 0) {
    const candidate = text
      .slice(0, cut)
      .replace(/[^a-z\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (candidate.length >= 3) movement = titleCase(candidate);
  }

  const num = (m: RegExpMatchArray | null) => (m ? Number(m[1]) : null);

  const reps = num(repsMatch);
  const rpe = num(rpeMatch);
  const setNumber = setMatch ? Math.round(Number(setMatch[1])) : null;
  const weight = num(weightMatch);

  return {
    movement,
    setNumber: setNumber && setNumber > 0 && setNumber <= 50 ? setNumber : null,
    weight: weight !== null && weight > 0 ? weight : null,
    unit,
    reps: reps !== null && reps > 0 && reps <= 200 ? Math.round(reps) : null,
    rpe: rpe !== null && rpe > 0 && rpe <= 10 ? rpe : null,
    normalised,
  };
}

/** Human summary used on the confirmation card. */
export function describeParsedSet(p: ParsedSet, movementLabel?: string | null) {
  const parts = [
    movementLabel ?? p.movement,
    p.setNumber ? `set ${p.setNumber}` : null,
    p.weight !== null ? `${p.weight} ${p.unit ?? ""}`.trim() : null,
    p.reps !== null ? `${p.reps} reps` : null,
    p.rpe !== null ? `RPE ${p.rpe}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
