 /*
 Stores the actual story content
  - one object per step
  - each object has headline, body, and state
  */
import type { Chapter } from "../types";


//each object in this array is one “slide” in the scrollytelling sequence
//when the active step changes, src/components/scrolly.tsx picks the matching chapter and passes its state into the graphic
export const chapters: Chapter[] = [
  {
    id: "claimant-parked-cars",
    headline: "The curb starts with parking",
    body:
      "A lot of people think of the curb as a place for parked cars first. That expectation alone already claims a meaningful share of limited street space.",
    state: {
      title: "Many users, one curb",
      note:
        "The curb looks ordinary, but it is already occupied. Parked cars are one of the first visible claims on this limited strip of space.",
      visibleActors: ["parked-cars"],
      conflicts: [],
      context: {
        laneCount: 2,
        trafficFlow: "medium",
        activityDensity: "high"
      }
    }
  },
  {
    id: "claimant-bike-docks",
    headline: "Micromobility adds another claim",
    body:
      "Bike docks and related curbside micromobility uses also need space. The curb is not just for storage; it supports access and turnover too.",
    state: {
      title: "Many users, one curb",
      note:
        "Now another claimant appears. The curb has to absorb more than parking alone.",
      visibleActors: ["parked-cars", "bike-docks"],
      conflicts: [],
      context: {
        laneCount: 2,
        trafficFlow: "medium",
        activityDensity: "high"
      }
    }
  },
  {
    id: "claimant-buses",
    headline: "Transit also depends on curb access",
    body:
      "Buses rely on curb access for stops, boarding, and reliable operations. They add a public-service claim to the same constrained edge of the street.",
    state: {
      title: "Many users, one curb",
      note: "",
      visibleActors: ["parked-cars", "bike-docks", "buses"],
      conflicts: [],
      context: {
        laneCount: 2,
        trafficFlow: "medium",
        activityDensity: "high"
      }
    }
  },
  {
    id: "claimant-fhv",
    headline: "Pickups and drop-offs compete too",
    body:
      "For-hire vehicles also rely on curb access for pickups and drop-offs. Their short stops add another competing claim to already-limited curb space.",
    state: {
      title: "Many users, one curb",
      note:
        "Parking, micromobility, transit, and passenger pickups all compete for the same edge of the street.",
      visibleActors: [
        "parked-cars",
        "bike-docks",
        "buses",
        "fhv"
      ],
      conflicts: [],
      context: {
        laneCount: 2,
        trafficFlow: "medium",
        activityDensity: "high"
      }
    }
  },
  {
    id: "claimant-deliveries",
    headline: "Deliveries add constant curb pressure",
    body:
      "Commercial deliveries need short-term loading access throughout the day. That demand is frequent, time-sensitive, and hard to schedule perfectly.",
    state: {
      title: "Many users, one curb",
      note:
        "With pickups, transit, bikes, and parking already in play, deliveries intensify competition because they need flexible curb access near active destinations.",
      visibleActors: [
        "parked-cars",
        "bike-docks",
        "buses",
        "fhv",
        "delivery-vehicles"
      ],
      conflicts: [],
      context: {
        laneCount: 2,
        trafficFlow: "medium",
        activityDensity: "high"
      }
    }
  },
  {
    id: "friction-congestion",
    headline: "Competition turns into congestion",
    body:
      "When demand exceeds available curb space, vehicles improvise. Double parking blocks travel lanes, slows buses, and causes traffic to queue behind obstructions.",
    state: {
      title: "Competition turns into friction",
      note:
        "The curb can no longer absorb demand cleanly, so activity spills into the moving lane and creates operational delay.",
      visibleActors: [
        "parked-cars",
        "bike-docks",
        "buses",
        "delivery-vehicles",
        "fhv"
      ],
      conflicts: ["double-parking"],
      context: {
        laneCount: 2,
        trafficFlow: "high",
        activityDensity: "high"
      }
    }
  },
  {
    id: "friction-safety",
    headline: "Spillover creates safety risks too",
    body:
      "The consequences are not only slower traffic. When curb activity blocks the lane, cyclists may be forced to merge into moving traffic and navigate more dangerous conditions.",
    state: {
      title: "Friction becomes a safety issue",
      note:
        "A blocked curb lane can force riders around obstructions, turning curb competition into a direct safety concern.",
      visibleActors: [
        "parked-cars",
        "bike-docks",
        "buses",
        "delivery-vehicles",
        "fhv"
      ],
      conflicts: ["double-parking", "bike-merge"],
      context: {
        laneCount: 2,
        trafficFlow: "high",
        activityDensity: "high"
      }
    }
  }
];
