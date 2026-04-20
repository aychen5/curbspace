export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export type StreetElement =
  | "travel_lane"
  | "parking"
  | "loading_zone"
  | "bike_lane"
  | "bike_docks"
  | "bus_lane"
  | "bus_stop"
  | "sidewalk";

export type CurbScores = {
  bikeSafety: ScoreValue;
  pedestrianSafety: ScoreValue;
  trafficReliability: ScoreValue;
  curbFlexibility: ScoreValue;
};

export type CurbConfiguration = {
  id: string;
  order: number;
  title: string;
  assetSrc: string;
  geometry: StreetElement[];
  scores: CurbScores;
  oneLineExplanation: string;
  keyConflictType: string;
};

export const scoreMeaning: Record<ScoreValue, string> = {
  1: "Very poor",
  2: "Poor",
  3: "Moderate",
  4: "Good",
  5: "Very good"
};

export const streetElementLabels: Record<StreetElement, string> = {
  travel_lane: "Travel lane",
  parking: "Parking",
  loading_zone: "Loading zone",
  bike_lane: "Bike lane",
  bike_docks: "Bike docks",
  bus_lane: "Bus lane",
  bus_stop: "Bus stop",
  sidewalk: "Sidewalk"
};

const baselineSrc = new URL("../assets/1_Baseline.svg", import.meta.url).href;
const baselineBikeLaneSrc = new URL(
  "../assets/2_Baseline+bike_lane.svg",
  import.meta.url
).href;
const protectedBikeLaneSrc = new URL(
  "../assets/3_Baseline+bike_lane_protected.svg",
  import.meta.url
).href;
const bikeBusLoadingSrc = new URL(
  "../assets/4_Baseline+bike_lane+bus_lane_lz.svg",
  import.meta.url
).href;
const protectedBikeDocksSrc = new URL(
  "../assets/5_Baseline+bike_lane_protected_docks.svg",
  import.meta.url
).href;
const addBusStopSrc = new URL("../assets/6_add_busstop.svg", import.meta.url)
  .href;
const floatingBusStopSrc = new URL(
  "../assets/7_add_busstop_behind_bike.svg",
  import.meta.url
).href;
const swapBikeCarBusStopDockLoadingSrc = new URL(
  "../assets/8_swap_bike_car_busstop_dock_lz.svg",
  import.meta.url
).href;
const swapBikeCarLoadingSrc = new URL(
  "../assets/9_swap_bike_car_lz.svg",
  import.meta.url
).href;
const swapBikeCarLoadingBusLaneSrc = new URL(
  "../assets/10_swap_bike_car_lz2.svg",
  import.meta.url
).href;
const bikeBusDockClusterSrc = new URL(
  "../assets/11_Baseline+bike_lane+bus_lane.svg",
  import.meta.url
).href;
const protectedBikeDocksBusStopSrc = new URL(
  "../assets/12_Baseline+bike_lane_protected_docks_busstop.svg",
  import.meta.url
).href;

export const curbConfigurations: CurbConfiguration[] = [
  {
    id: "baseline",
    order: 1,
    title: "Baseline",
    assetSrc: baselineSrc,
    geometry: ["travel_lane", "parking", "sidewalk"],
    scores: {
      bikeSafety: 1,
      pedestrianSafety: 3,
      trafficReliability: 2,
      curbFlexibility: 2
    },
    oneLineExplanation:
      "Simple parking-first street, but it provides no bike facility and performs poorly when curb demand is high.",
    keyConflictType: "double_parking_and_unmanaged_curb_stopping"
  },
  {
    id: "baseline_bike_lane",
    order: 2,
    title: "Baseline + Bike Lane",
    assetSrc: baselineBikeLaneSrc,
    geometry: ["travel_lane", "bike_lane", "parking", "sidewalk"],
    scores: {
      bikeSafety: 2,
      pedestrianSafety: 3,
      trafficReliability: 3,
      curbFlexibility: 2
    },
    oneLineExplanation:
      "Adds dedicated bike space, but the bike lane sits between moving traffic and parked cars, creating dooring and side-swipe risk.",
    keyConflictType: "dooring_and_bike_exposure_to_moving_traffic"
  },
  {
    id: "baseline_bike_lane_protected",
    order: 3,
    title: "Protected Bike Lane",
    assetSrc: protectedBikeLaneSrc,
    geometry: ["travel_lane", "parking", "bike_lane", "sidewalk"],
    scores: {
      bikeSafety: 4,
      pedestrianSafety: 4,
      trafficReliability: 3,
      curbFlexibility: 2
    },
    oneLineExplanation:
      "Stronger bike and pedestrian safety because parked cars buffer bikes from moving traffic, though curb access is less flexible.",
    keyConflictType: "turning_and_loading_crossings_across_protected_bike_lane"
  },
  {
    id: "baseline_bike_lane_bus_lane_lz",
    order: 4,
    title: "Bike + Bus Lane + Loading Zone",
    assetSrc: bikeBusLoadingSrc,
    geometry: [
      "travel_lane",
      "bus_lane",
      "loading_zone",
      "bike_docks",
      "bike_lane",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 2,
      pedestrianSafety: 2,
      trafficReliability: 4,
      curbFlexibility: 5
    },
    oneLineExplanation:
      "Good for throughput and curb utility, but loading and bike movements are packed too tightly to feel safe or intuitive.",
    keyConflictType: "loading_crossings_and_bike_through_movement_overlap"
  },
  {
    id: "baseline_bike_lane_protected_docks",
    order: 5,
    title: "Protected Bike Lane + Docks",
    assetSrc: protectedBikeDocksSrc,
    geometry: [
      "travel_lane",
      "parking",
      "bike_docks",
      "bike_lane",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 3,
      pedestrianSafety: 3,
      trafficReliability: 3,
      curbFlexibility: 3
    },
    oneLineExplanation:
      "Micromobility access is improved, but bike docks add curbside crossings and reduce spatial clarity.",
    keyConflictType: "bike_share_access_movements_crossing_bike_facility"
  },
  {
    id: "add_busstop",
    order: 6,
    title: "Add Bus Stop",
    assetSrc: addBusStopSrc,
    geometry: [
      "travel_lane",
      "bus_lane",
      "bike_docks",
      "bus_stop",
      "bike_docks",
      "parking",
      "bike_lane",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 3,
      pedestrianSafety: 2,
      trafficReliability: 4,
      curbFlexibility: 4
    },
    oneLineExplanation:
      "A strong transit-access node, but pedestrian crowding and ambiguous crossings weaken safety performance.",
    keyConflictType: "bus_passenger_waiting_and_alighting_in_high_activity_curb_zone"
  },
  {
    id: "add_busstop_behind_bike",
    order: 7,
    title: "Floating Bus Stop",
    assetSrc: floatingBusStopSrc,
    geometry: [
      "travel_lane",
      "bus_lane",
      "bus_stop",
      "bike_lane",
      "parking",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 4,
      pedestrianSafety: 4,
      trafficReliability: 5,
      curbFlexibility: 3
    },
    oneLineExplanation:
      "This is the cleanest multimodal separation: buses stop in their own space and bike-through movement remains legible.",
    keyConflictType: "pedestrian_crossing_of_bike_lane_to_reach_bus_island"
  },
  {
    id: "swap_bike_car_busstop_dock_lz",
    order: 8,
    title: "Swap Bike/Car + Bus Stop + Dock + Loading",
    assetSrc: swapBikeCarBusStopDockLoadingSrc,
    geometry: [
      "travel_lane",
      "bus_lane",
      "bike_lane",
      "bus_stop",
      "loading_zone",
      "bike_docks",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 1,
      pedestrianSafety: 2,
      trafficReliability: 3,
      curbFlexibility: 5
    },
    oneLineExplanation:
      "Very flexible on paper, but too many active uses are stacked into one strip, creating conflict saturation.",
    keyConflictType: "stacked_transit_loading_and_micromobility_conflicts"
  },
  {
    id: "swap_bike_car_lz",
    order: 9,
    title: "Swap Bike/Car + Loading Zone",
    assetSrc: swapBikeCarLoadingSrc,
    geometry: [
      "travel_lane",
      "bike_lane",
      "bike_docks",
      "loading_zone",
      "parking",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 2,
      pedestrianSafety: 3,
      trafficReliability: 3,
      curbFlexibility: 4
    },
    oneLineExplanation:
      "Loading is formally accommodated, but bikes remain exposed to both moving traffic and curbside activity.",
    keyConflictType: "loading_activity_spilling_toward_bike_space"
  },
  {
    id: "swap_bike_car_lz_buslane",
    order: 10,
    title: "Swap Bike/Car + Loading Zone + Bus Lane",
    assetSrc: swapBikeCarLoadingBusLaneSrc,
    geometry: [
      "travel_lane",
      "bus_lane",
      "bike_lane",
      "loading_zone",
      "parking",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 2,
      pedestrianSafety: 3,
      trafficReliability: 4,
      curbFlexibility: 5
    },
    oneLineExplanation:
      "Operationally strong because both buses and loading are assigned space, but the bike condition remains conflict-prone.",
    keyConflictType: "overlapping_bus_loading_and_bike_edge_activity"
  },
  {
    id: "baseline_bike_lane_bus_lane",
    order: 11,
    title: "Bike Lane + Bus Lane + Docks/Stop Cluster",
    assetSrc: bikeBusDockClusterSrc,
    geometry: [
      "travel_lane",
      "bus_lane",
      "parking",
      "bike_docks",
      "bus_stop",
      "bike_docks",
      "bike_lane",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 3,
      pedestrianSafety: 3,
      trafficReliability: 4,
      curbFlexibility: 4
    },
    oneLineExplanation:
      "Transit operations improve with a dedicated bus lane, but the bike edge still sits next to an active curb cluster.",
    keyConflictType: "pedestrian_crossing_between_transit_and_micromobility_zones"
  },
  {
    id: "baseline_bike_lane_protected_docks_busstop",
    order: 12,
    title: "Protected Bike Lane + Docks + Bus Stop",
    assetSrc: protectedBikeDocksBusStopSrc,
    geometry: [
      "travel_lane",
      "parking",
      "bike_docks",
      "bus_stop",
      "bike_docks",
      "bike_lane",
      "sidewalk"
    ],
    scores: {
      bikeSafety: 3,
      pedestrianSafety: 2,
      trafficReliability: 3,
      curbFlexibility: 4
    },
    oneLineExplanation:
      "A dense multimodal curb node that supports several uses, but crowding and crossing churn reduce pedestrian clarity and comfort.",
    keyConflictType: "bus_boarding_plus_bike_share_access_concentrated_in_one_node"
  }
];
