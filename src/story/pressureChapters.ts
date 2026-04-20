export type PressureStepId =
  | "pressure-citywide"
  | "pressure-hotspot"
  | "pressure-lookup";

export type PressureGraphicState = {
  variant: "citywide" | "hotspot";
  hotspotLabel?: string;
  hotspotNote?: string;
  enableRegionLookup?: boolean;
};

export type PressureChapter = {
  id: PressureStepId;
  headline: string;
  body: string;
  state: PressureGraphicState;
};

export const pressureChapters: PressureChapter[] = [
  {
    id: "pressure-citywide",
    headline: "Citywide curb pressure",
    body:
      "These pressures are not evenly distributed. They cluster in places where limited curb space meets intense demand.",
    state: {
      variant: "citywide"
    }
  },
  {
    id: "pressure-hotspot",
    headline: "Zoom into a hotspot",
    body:
      "Downtown Brooklyn makes the pattern legible: multiple competing uses, heavy activity, and too little curb space to absorb demand cleanly.",
    state: {
      variant: "hotspot",
      hotspotLabel: "Downtown Brooklyn",
      hotspotNote:
        "Transit access, civic buildings, loading activity, and short-term curb demand overlap across the same few blocks."
    }
  },
  {
    id: "pressure-lookup",
    headline: "Try yourself!",
    body:
      "Now test another borough or ZIP code and compare its curb-pressure profile against the same citywide benchmarks.",
    state: {
      variant: "hotspot",
      hotspotLabel: "Downtown Brooklyn",
      hotspotNote:
        "Start with Downtown Brooklyn, then type a borough or ZIP code to compare another part of the city.",
      enableRegionLookup: true
    }
  }
];
