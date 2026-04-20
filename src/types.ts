//types.ts is the contract for my story data
// it defines the shape of my data
// chapter objects must match the types
// so that scrolly.tsx trusts that each chapter has the right fields
// graphic.tsx can trust that state contains the fields it needs
export type StepId =
  | "claimant-parked-cars"
  | "claimant-bike-docks"
  | "claimant-buses"
  | "claimant-deliveries"
  | "claimant-fhv"
  | "friction-congestion"
  | "friction-safety";

export type CurbActor =
  | "parked-cars"
  | "bike-docks"
  | "buses"
  | "delivery-vehicles"
  | "fhv";

export type Conflict = "double-parking" | "bike-merge";

export type Level = "low" | "medium" | "high";

export type StreetContext = {
  laneCount: number;
  trafficFlow: Level;
  activityDensity: Level;
};

//types.ts says a chapter state looks like this:
// so very chapter in chapters.ts must include exactly those kinds of fields
export type GraphicState = {
  title: string;
  note: string;
  visibleActors: CurbActor[];
  conflicts: Conflict[];
  context: StreetContext;
};

export type Chapter = {
  id: StepId;
  headline: string;
  body: string;
  state: GraphicState;
};
