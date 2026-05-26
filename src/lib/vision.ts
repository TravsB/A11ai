export type VisionMode =
  | "normal"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia"
  | "low-contrast";

export const VISION_MODES: { id: VisionMode; label: string; description: string }[] = [
  { id: "normal", label: "Standard vision", description: "Unmodified baseline rendering." },
  { id: "protanopia", label: "Protanopia", description: "Red-blind. Reduces red-green confusion." },
  { id: "deuteranopia", label: "Deuteranopia", description: "Green-blind. Separates semantic states." },
  { id: "tritanopia", label: "Tritanopia", description: "Blue-yellow deficiency. Rebalanced cool tones." },
  { id: "achromatopsia", label: "Achromatopsia", description: "Total color blindness. High-contrast monochrome." },
  { id: "low-contrast", label: "Low contrast sensitivity", description: "Reduced sensitivity. Sharpens typography." },
];

export function visionClass(mode: VisionMode) {
  return mode === "normal" ? "" : `vision-${mode}`;
}
