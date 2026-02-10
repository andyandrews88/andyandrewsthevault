export interface BreathPhase {
  name: string;
  duration: number;
  instruction: string;
}

export interface BreathworkMethod {
  id: string;
  name: string;
  purpose: "Relaxation" | "Activation" | "Sleep" | "Focus" | "Balance";
  shortDescription: string;
  fullDescription: string;
  science: string;
  phases: BreathPhase[];
  rounds: number;
  icon: string;
}

export const breathworkMethods: BreathworkMethod[] = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    purpose: "Focus",
    shortDescription: "4-4-4-4 pattern used by Navy SEALs for calm focus under pressure.",
    fullDescription:
      "Box Breathing (also called Square Breathing) is a technique used by Navy SEALs, first responders, and elite athletes to regulate the autonomic nervous system under extreme stress. Each phase — inhale, hold, exhale, hold — lasts exactly 4 seconds, creating a 'box' pattern that anchors your attention and steadies your heart rate.",
    science:
      "The equal-duration phases activate the vagus nerve and shift the autonomic nervous system from sympathetic (fight-or-flight) toward parasympathetic (rest-and-digest) dominance. The breath holds increase CO₂ tolerance, which reduces the urge to over-breathe during stress. Studies show it lowers cortisol and improves HRV within minutes.",
    phases: [
      { name: "Inhale", duration: 4, instruction: "Breathe in slowly through your nose" },
      { name: "Hold", duration: 4, instruction: "Hold your breath gently" },
      { name: "Exhale", duration: 4, instruction: "Breathe out slowly through your mouth" },
      { name: "Hold", duration: 4, instruction: "Hold empty and stay relaxed" },
    ],
    rounds: 4,
    icon: "Square",
  },
  {
    id: "4-7-8",
    name: "4-7-8 Breathing",
    purpose: "Sleep",
    shortDescription: "Dr. Andrew Weil's sleep technique — inhale 4, hold 7, exhale 8.",
    fullDescription:
      "The 4-7-8 technique, developed by Dr. Andrew Weil and rooted in the ancient yogic practice of pranayama, is designed to act as a natural tranquilizer for the nervous system. The extended exhale phase (8 seconds) is the key — it forces the body into a parasympathetic state that mimics the relaxation response needed for sleep onset.",
    science:
      "The long exhale-to-inhale ratio (2:1) maximizes vagal tone, slowing heart rate and lowering blood pressure. The 7-second hold saturates blood with oxygen while the extended exhale expels more CO₂, triggering a calming reflex. Regular practice has been shown to reduce sleep onset latency and improve perceived sleep quality.",
    phases: [
      { name: "Inhale", duration: 4, instruction: "Breathe in quietly through your nose" },
      { name: "Hold", duration: 7, instruction: "Hold your breath" },
      { name: "Exhale", duration: 8, instruction: "Exhale completely through your mouth" },
    ],
    rounds: 4,
    icon: "Moon",
  },
  {
    id: "wim-hof",
    name: "Wim Hof Method",
    purpose: "Activation",
    shortDescription: "Power breathing for energy, focus, and cold tolerance.",
    fullDescription:
      "The Wim Hof Method combines rapid deep breathing with breath retention to deliberately activate the sympathetic nervous system. Developed by 'The Iceman' Wim Hof, this technique involves 30 cycles of powerful inhales and passive exhales, followed by a breath hold after the final exhale, and a recovery breath. It's used to boost energy, enhance focus, and build stress resilience.",
    science:
      "The hyperventilation phase lowers CO₂ and raises blood pH (respiratory alkalosis), which triggers adrenaline and noradrenaline release. The subsequent breath hold activates the dive reflex and spleen contraction, releasing stored red blood cells. Research from Radboud University showed practitioners could voluntarily influence their immune response and suppress inflammatory markers.",
    phases: [
      { name: "Inhale", duration: 1.5, instruction: "Deep powerful breath IN through nose or mouth" },
      { name: "Exhale", duration: 1, instruction: "Let the breath fall out passively" },
    ],
    rounds: 3,
    icon: "Flame",
  },
  {
    id: "physiological-sigh",
    name: "Physiological Sigh",
    purpose: "Relaxation",
    shortDescription: "Stanford-backed rapid stress relief — double inhale, long exhale.",
    fullDescription:
      "The Physiological Sigh is a breathing pattern discovered by Stanford neuroscientist Dr. Andrew Huberman and his colleagues. It's the fastest known real-time method to reduce stress — just 1-3 cycles can noticeably calm your nervous system. The double inhale maximally inflates the lung's alveoli (tiny air sacs), and the extended exhale offloads CO₂ efficiently, triggering immediate relaxation.",
    science:
      "During stress, alveoli in the lungs can collapse, reducing the surface area for CO₂ offloading. The double inhale pops them open. The long exhale then activates the parasympathetic nervous system via the vagus nerve. A 2023 Stanford study found that 5 minutes of cyclic physiological sighing was more effective at reducing stress than mindfulness meditation.",
    phases: [
      { name: "Inhale", duration: 2, instruction: "Quick inhale through the nose" },
      { name: "Inhale", duration: 1, instruction: "Second sharp sip of air through the nose" },
      { name: "Exhale", duration: 6, instruction: "Long slow exhale through the mouth" },
    ],
    rounds: 5,
    icon: "Wind",
  },
  {
    id: "alternate-nostril",
    name: "Alternate Nostril",
    purpose: "Balance",
    shortDescription: "Nadi Shodhana — ancient yogic technique for nervous system balance.",
    fullDescription:
      "Alternate Nostril Breathing (Nadi Shodhana) is one of the most well-researched pranayama techniques, used for thousands of years in yoga traditions. By alternating airflow between nostrils, it's believed to balance the left and right hemispheres of the brain and harmonize the sympathetic and parasympathetic nervous systems. It's ideal as a pre-meditation or pre-focus warm-up.",
    science:
      "Research shows that each nostril is linked to opposite-hemisphere brain activation via the nasal cycle. Left-nostril breathing activates the right (creative/calm) hemisphere, while right-nostril activates the left (analytical/active) hemisphere. Alternating between them promotes bilateral coherence, improving HRV, reducing blood pressure, and enhancing cognitive performance in studies from the Journal of Alternative and Complementary Medicine.",
    phases: [
      { name: "Inhale Left", duration: 4, instruction: "Close right nostril, inhale through left" },
      { name: "Hold", duration: 4, instruction: "Close both nostrils and hold" },
      { name: "Exhale Right", duration: 4, instruction: "Release right nostril, exhale through right" },
      { name: "Inhale Right", duration: 4, instruction: "Keep left closed, inhale through right" },
      { name: "Hold", duration: 4, instruction: "Close both nostrils and hold" },
      { name: "Exhale Left", duration: 4, instruction: "Release left nostril, exhale through left" },
    ],
    rounds: 4,
    icon: "Leaf",
  },
];

// Wim Hof special config
export const WIM_HOF_POWER_BREATHS = 30;
export const WIM_HOF_RETENTION_SECONDS = 60;
export const WIM_HOF_RECOVERY_HOLD_SECONDS = 15;
